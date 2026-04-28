import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { DEFAULT_X_SPACING, DEFAULT_Y_SPACING, DEFAULT_Z_SPACING } from "@/db/types";
import { naturalSort } from "@/utils/naturalSort";
import { loadMaskPixels, stackVolume } from "@/utils/volumeBuilder";
import { getDefaultLabelColor, getDefaultLabelName } from "@/utils/colorPalette";
import {
  calculateAllETDRSVolumes,
  calculateAllETDRSThicknesses,
  calculateAverageThicknesses,
  type ETDRSVolumes,
} from "@/utils/etdrsCalculation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import Scene from "./components/Scene";
import Sidebar3D from "./components/Sidebar3D";
import useTranslation from "@/i18n/useTranslation";

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

export default function Viewer3DPage() {
  const { id: patientId, eye: eyeParam } = useParams();
  const navigate = useNavigate();
  const currentEye = (eyeParam as "OD" | "OS") || "OD";
  const { t } = useTranslation();

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
  const [statusText, setStatusText] = useState(t("viewer3d.loading"));

  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({});
  const [opacityMap, setOpacityMap] = useState<Record<string, number>>({});
  const [sliceVisibility, setSliceVisibility] = useState<Record<number, boolean>>({});
  const [showSliceGrid, setShowSliceGrid] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [etdrsVolumes, setEtdrsVolumes] = useState<Record<string, ETDRSVolumes>>({});
  const [etdrsThicknesses, setEtdrsThicknesses] = useState<Record<string, ETDRSVolumes>>({});
  const [thicknesses, setThicknesses] = useState<Record<string, number>>({});
  const [clipRange, setClipRange] = useState<[number, number]>([0, 1]);

  const scalings = useMemo<[number, number, number]>(
    () => [
      patient?.xSpacing ?? DEFAULT_X_SPACING,
      patient?.ySpacing ?? DEFAULT_Y_SPACING,
      patient?.zSpacing ?? DEFAULT_Z_SPACING,
    ],
    [patient?.xSpacing, patient?.ySpacing, patient?.zSpacing]
  );

  // Total Z extent in world units (depth axis = THREE.z)
  const maxZ = dims[0] * scalings[2];

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
      setStatusText(t("viewer3d.noMasks"));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Step 1: Load mask pixels
        setStatusText(t("viewer3d.loadingMasks"));
        setProgress(10);
        const pixelSlices = [];
        for (let i = 0; i < sortedMasks.length; i++) {
          const pixels = await loadMaskPixels(sortedMasks[i].blob);
          pixelSlices.push(pixels);
          setProgress(10 + (30 * (i + 1)) / sortedMasks.length);
        }
        if (cancelled) return;

        const adjScalings = scalings;

        // Step 2: Stack volume
        setStatusText(t("viewer3d.buildingVolume"));
        setProgress(45);
        const { volume, dims: volDims, labels } = stackVolume(pixelSlices);
        setDims(volDims);
        setClipRange([0, volDims[0] * adjScalings[2]]);

        // Build slice info
        const sliceInfo: SliceInfo[] = sortedMasks.map((img, i) => ({
          index: i,
          filename: img.filename,
          valid: true,
        }));
        setSlices(sliceInfo);

        if (labels.length === 0) {
          setLoading(false);
          setStatusText(t("viewer3d.noLabels"));
          return;
        }

        // Step 2.5: Calculate ETDRS volumes
        setStatusText(t("viewer3d.calculatingETDRS"));
        setProgress(48);

        const labelNames: Record<number, string> = {};
        for (const lid of labels) {
          labelNames[lid] = patient.labelConfig[lid]?.name || getDefaultLabelName(lid);
        }
        const etdrsOrigin: [number, number] = [
          ((volDims[2] - 1) / 2) * adjScalings[0],
          ((volDims[0] - 1) / 2) * adjScalings[2],
        ];
        const vols = calculateAllETDRSVolumes(
          volume, volDims, labels, labelNames, adjScalings, etdrsOrigin, currentEye
        );
        setEtdrsVolumes(vols);

        const etdrsThick = calculateAllETDRSThicknesses(
          volume, volDims, labels, labelNames, adjScalings, etdrsOrigin, currentEye
        );
        setEtdrsThicknesses(etdrsThick);

        // Step 2.6: Calculate average thicknesses
        const thick = calculateAverageThicknesses(
          volume, volDims, labels, labelNames, adjScalings[1]
        );
        setThicknesses(thick);

        // Step 3: Generate meshes via Web Worker
        setStatusText(t("viewer3d.generatingMeshes"));
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

          setStatusText(t("viewer3d.generatingMesh", { name }));

          const interpSteps = 6;
          const blurSigma = 3.0;
          const smoothingIters = 15;

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

            worker.postMessage({
              type: "generateMesh",
              volume,
              dims: volDims,
              spacing: adjScalings,
              labelId,
              interpSteps,
              smoothingIterations: smoothingIters,
              blurSigma,
            });
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
        results.forEach((m) => { vis[m.name] = true; opa[m.name] = 1.0; });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- t creates a new ref each render; including it restarts the entire pipeline
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
          <p className="text-muted-foreground">{statusText || t("viewer3d.noMeshes")}</p>
          <Button className="mt-4" onClick={() => navigate(`/patient/${patientId}`)}>{t("viewer3d.back")}</Button>
        </div>
      </div>
    );
  }

  // ETDRS 3D grid origin
  const origin: [number, number, number] = [
    ((dims[2] - 1) / 2) * scalings[0],
    0,
    ((dims[0] - 1) / 2) * scalings[2],
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
              clipRange={clipRange}
              maxExtent={maxZ}
            />
          </Suspense>
        </Canvas>

        {/* Overlay info */}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-4 border border-border">
          <h2 className="text-lg font-semibold mb-2">{patient?.name}</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{t("viewer3d.dimensions")}: {dims[2]}x{dims[1]}x{dims[0]}</p>
            <p>{t("viewer3d.eye")}: {currentEye}</p>
            <p>{t("viewer3d.meshCount")}: {meshes.length}</p>
          </div>
        </div>

        {/* Controls help */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border text-xs text-muted-foreground">
          <p><strong>{t("viewer3d.leftClick")}</strong> {t("viewer3d.controlsRotate")}</p>
          <p><strong>{t("viewer3d.rightClick")}</strong> {t("viewer3d.controlsPan")}</p>
          <p><strong>{t("viewer3d.scroll")}</strong> {t("viewer3d.controlsZoom")}</p>
        </div>

        {/* Close button */}
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 right-4 bg-background/90"
          onClick={() => navigate(`/patient/${patientId}`)}
        >
          {t("viewer3d.close")}
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
          {t("viewer3d.layers")}
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
        etdrsThicknesses={etdrsThicknesses}
        thicknesses={thicknesses}
        eye={currentEye}
        clipRange={clipRange}
        setClipRange={setClipRange}
        maxExtent={maxZ}
        patientName={patient?.name ?? "patient"}
        scalings={scalings}
      />
    </div>
  );
}
