import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { naturalSort } from "@/utils/naturalSort";
import { loadMaskPixels, stackVolume, extractBinaryVolume, interpolateZAxis } from "@/utils/volumeBuilder";
import { getDefaultLabelColor, getDefaultLabelName } from "@/utils/colorPalette";
import { calculateAllETDRSVolumes, type ETDRSVolumes } from "@/utils/etdrsCalculation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import Scene from "./components/Scene";
import Sidebar3D from "./components/Sidebar3D";

interface MeshData {
  labelId: number;
  name: string;
  color: string;
  positions: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  faceCount: number;
}

interface SliceInfo {
  index: number;
  filename: string;
  valid: boolean;
}

const DEFAULT_SCALINGS: [number, number, number] = [11.54, 3.87, 246.0]; // X, Y, Z

export default function Viewer3DPage() {
  const { id: patientId, eye: eyeParam } = useParams();
  const navigate = useNavigate();
  const currentEye = (eyeParam as "OD" | "OS") || "OD";

  const patient = useLiveQuery(() => db.patients.get(patientId!), [patientId]);
  const maskImages = useLiveQuery(
    () => db.images.where("[patientId+type+eye]").equals([patientId!, "mask", currentEye]).toArray(),
    [patientId, currentEye]
  );

  const [meshes, setMeshes] = useState<MeshData[]>([]);
  const [slices, setSlices] = useState<SliceInfo[]>([]);
  const [dims, setDims] = useState<[number, number, number]>([0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Loading...");

  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({});
  const [opacityMap, setOpacityMap] = useState<Record<string, number>>({});
  const [sliceVisibility, setSliceVisibility] = useState<Record<number, boolean>>({});
  const [showSliceGrid, setShowSliceGrid] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [etdrsVolumes, setEtdrsVolumes] = useState<Record<string, ETDRSVolumes>>({});

  const scalings = DEFAULT_SCALINGS;

  const toggleVisibility = useCallback((name: string) => {
    setVisibilityMap((prev) => ({ ...prev, [name]: !(prev[name] ?? true) }));
  }, []);

  const updateOpacity = useCallback((name: string, value: number) => {
    setOpacityMap((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Main pipeline
  useEffect(() => {
    if (!patient || !maskImages) return;

    const sortedMasks = naturalSort(maskImages, (img) => img.filename);
    if (sortedMasks.length === 0) {
      setLoading(false);
      setStatusText("No masks found");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Step 1: Load mask pixels
        setStatusText("Loading masks...");
        setProgress(10);
        const pixelSlices = [];
        for (let i = 0; i < sortedMasks.length; i++) {
          const pixels = await loadMaskPixels(sortedMasks[i].blob);
          pixelSlices.push(pixels);
          setProgress(10 + (30 * (i + 1)) / sortedMasks.length);
        }
        if (cancelled) return;

        // Step 2: Stack volume
        setStatusText("Building 3D volume...");
        setProgress(45);
        const { volume, dims: volDims, labels } = stackVolume(pixelSlices);
        setDims(volDims);

        // Build slice info
        const sliceInfo: SliceInfo[] = sortedMasks.map((img, i) => ({
          index: i,
          filename: img.filename,
          valid: true, // all uploaded masks are valid
        }));
        setSlices(sliceInfo);

        if (labels.length === 0) {
          setLoading(false);
          setStatusText("No labels found in masks");
          return;
        }

        // Step 2.5: Calculate ETDRS volumes
        setStatusText("Calculating ETDRS volumes...");
        setProgress(48);

        const labelNames: Record<number, string> = {};
        for (const lid of labels) {
          labelNames[lid] = patient.labelConfig[lid]?.name || getDefaultLabelName(lid);
        }
        // ETDRS origin: center of physical X (width) and physical Z (depth)
        const etdrsOrigin: [number, number] = [
          (volDims[2] * scalings[0]) / 2, // center of image width
          (volDims[0] * scalings[2]) / 2, // center of depth
        ];
        const vols = calculateAllETDRSVolumes(
          volume, volDims, labels, labelNames, scalings, etdrsOrigin, currentEye
        );
        setEtdrsVolumes(vols);

        // Step 3: Generate meshes via Web Worker
        setStatusText("Generating 3D meshes...");
        setProgress(50);

        const worker = new Worker(
          new URL("../../workers/marchingCubes.worker.ts", import.meta.url),
          { type: "module" }
        );

        const results: MeshData[] = [];
        let completed = 0;

        for (const labelId of labels) {
          if (cancelled) { worker.terminate(); return; }

          const labelConfig = patient.labelConfig[labelId];
          const name = labelConfig?.name || getDefaultLabelName(labelId);
          const colorArr = labelConfig?.color || getDefaultLabelColor(labelId);
          const color = `rgb(${colorArr[0]},${colorArr[1]},${colorArr[2]})`;

          setStatusText(`Generating mesh: ${name}...`);

          const binaryVolume = extractBinaryVolume(volume, volDims, labelId);

          // Interpolate along Z axis for smoother meshes.
          // Insert 6 intermediate slices between each pair (25 → 169 slices).
          const interpSteps = 6;
          const { volume: interpVolume, dims: interpDims } =
            interpolateZAxis(binaryVolume, volDims, interpSteps);

          // Spacing order for marching cubes: [dim0=Z, dim1=Y, dim2=X]
          // Z spacing shrinks by (steps + 1) after interpolation
          const spacing: [number, number, number] = [
            scalings[2] / (interpSteps + 1),
            scalings[1],
            scalings[0],
          ];

          const result = await new Promise<MeshData | null>((resolve) => {
            worker.onmessage = (e) => {
              if (e.data.type === "meshResult") {
                if (e.data.vertexCount > 0) {
                  resolve({
                    labelId: e.data.labelId,
                    name,
                    color,
                    positions: e.data.positions,
                    indices: e.data.indices,
                    vertexCount: e.data.vertexCount,
                    faceCount: e.data.faceCount,
                  });
                } else {
                  resolve(null);
                }
              } else if (e.data.type === "error") {
                console.error(`Worker error for ${name}:`, e.data.message);
                resolve(null);
              }
            };

            worker.postMessage(
              {
                type: "generateMesh",
                volume: interpVolume,
                dims: interpDims,
                spacing,
                labelId,
                smoothingIterations: 30,
              },
              [interpVolume.buffer]
            );
          });

          if (result) results.push(result);
          completed++;
          setProgress(50 + (50 * completed) / labels.length);
        }

        worker.terminate();

        if (cancelled) return;

        // Initialize visibility/opacity
        const vis: Record<string, boolean> = {};
        const opa: Record<string, number> = {};
        results.forEach((m) => { vis[m.name] = true; opa[m.name] = 0.7; });
        setVisibilityMap(vis);
        setOpacityMap(opa);
        setMeshes(results);
        setLoading(false);
        setResetTrigger((p) => p + 1);
      } catch (err) {
        console.error("3D pipeline error:", err);
        setStatusText(`Error: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [patient, maskImages, scalings]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center space-y-4 w-80">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{statusText}</p>
          <Progress value={progress} />
        </div>
      </div>
    );
  }

  if (meshes.length === 0) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{statusText || "No meshes generated"}</p>
          <Button className="mt-4" onClick={() => navigate(`/patient/${patientId}`)}>Back</Button>
        </div>
      </div>
    );
  }

  // Compute ETDRS origin (center of volume)
  const origin: [number, number, number] = [
    (dims[0] * scalings[2]) / 2,
    0,
    (dims[2] * scalings[0]) / 2,
  ];

  return (
    <div className="fixed inset-0 bg-background flex">
      {/* 3D Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <Canvas shadows>
          <Suspense fallback={null}>
            <Scene
              meshes={meshes}
              visibilityMap={visibilityMap}
              opacityMap={opacityMap}
              resetTrigger={resetTrigger}
              origin={origin}
              eye={currentEye}
              showSliceGrid={showSliceGrid}
              slices={slices}
              scalings={scalings}
              dims={dims}
              sliceVisibility={sliceVisibility}
            />
          </Suspense>
        </Canvas>

        {/* Overlay info */}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-4 border border-border">
          <h2 className="text-lg font-semibold mb-2">{patient?.name}</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Dimensions: {dims[2]}x{dims[1]}x{dims[0]}</p>
            <p>Eye: {currentEye}</p>
            <p>Meshes: {meshes.length}</p>
          </div>
        </div>

        {/* Controls help */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border text-xs text-muted-foreground">
          <p><strong>Left Click:</strong> Rotate</p>
          <p><strong>Right Click:</strong> Pan</p>
          <p><strong>Scroll:</strong> Zoom</p>
        </div>

        {/* Close button */}
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 right-4 bg-background/90"
          onClick={() => navigate(`/patient/${patientId}`)}
        >
          Close
        </Button>
      </div>

      {/* Sidebar toggle */}
      {!showSidebar && (
        <Button
          variant="outline"
          size="sm"
          className="absolute top-1/2 right-4 -translate-y-1/2 bg-background/90"
          onClick={() => setShowSidebar(true)}
        >
          Layers
        </Button>
      )}

      {/* Sidebar */}
      <Sidebar3D
        meshes={meshes}
        visibilityMap={visibilityMap}
        opacityMap={opacityMap}
        toggleVisibility={toggleVisibility}
        updateOpacity={updateOpacity}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        showSliceGrid={showSliceGrid}
        setShowSliceGrid={setShowSliceGrid}
        slices={slices}
        sliceVisibility={sliceVisibility}
        setSliceVisibility={setSliceVisibility}
        volumes={etdrsVolumes}
        eye={currentEye}
      />
    </div>
  );
}
