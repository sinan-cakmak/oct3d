import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Eye, EyeOff, X, Grid3X3, Download } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import ETDRSCircularGrid from "./ETDRSCircularGrid";
import CrossSectionSlider from "./CrossSectionSlider";
import type { ETDRSVolumes } from "@/utils/etdrsCalculation";

interface MeshInfo {
  labelId: number;
  name: string;
  color: string;
  vertexCount: number;
  faceCount: number;
}

interface SliceInfo {
  index: number;
  filename: string;
  valid: boolean;
}

export default function Sidebar3D({
  meshes,
  visibilityMap,
  opacityMap,
  toggleVisibility,
  updateOpacity,
  showSidebar,
  setShowSidebar,
  showSliceGrid,
  setShowSliceGrid,
  slices,
  sliceVisibility,
  setSliceVisibility,
  volumes,
  thicknesses,
  eye,
  clipRange,
  setClipRange,
  maxExtent,
  patientName,
}: {
  meshes: MeshInfo[];
  visibilityMap: Record<string, boolean>;
  opacityMap: Record<string, number>;
  toggleVisibility: (name: string) => void;
  updateOpacity: (name: string, value: number) => void;
  showSidebar: boolean;
  setShowSidebar: (v: boolean) => void;
  showSliceGrid: boolean;
  setShowSliceGrid: (v: boolean) => void;
  slices: SliceInfo[];
  sliceVisibility: Record<number, boolean>;
  setSliceVisibility: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >;
  volumes: Record<string, ETDRSVolumes>;
  thicknesses: Record<string, number>;
  eye: string;
  clipRange: [number, number];
  setClipRange: (v: [number, number]) => void;
  maxExtent: number;
  patientName: string;
}) {
  const exportCSV = useCallback(() => {
    const ETDRS_KEYS = ["c1", "s3", "i3", "n3", "t3", "s6", "i6", "n6", "t6"] as const;

    // Header row
    const headers = [
      "Patient",
      "Eye",
      "Label",
      "Avg Thickness (um)",
      "Total Volume (nL)",
      ...ETDRS_KEYS.map((k) => `ETDRS ${k} (nL)`),
    ];

    const rows: string[][] = [];
    for (const mesh of meshes) {
      const vol = volumes[mesh.name];
      const thick = thicknesses[mesh.name];
      rows.push([
        patientName,
        eye,
        mesh.name,
        thick != null ? thick.toFixed(2) : "",
        vol ? vol.total.toFixed(4) : "",
        ...ETDRS_KEYS.map((k) => (vol ? vol[k].toFixed(4) : "")),
      ]);
    }

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${patientName.replace(/\s+/g, "_")}_${eye}_measurements.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [meshes, volumes, thicknesses, eye, patientName]);

  if (!showSidebar) return null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="w-96 border-l border-border bg-card/50 backdrop-blur-sm overflow-y-auto"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">3D Visualization</h1>
            <p className="text-sm text-muted-foreground mt-1">
              OCT Segmentation Layers
            </p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Export */}
        {Object.keys(volumes).length > 0 && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={exportCSV}
          >
            <Download className="h-4 w-4" />
            Export Measurements (CSV)
          </Button>
        )}

        {/* ETDRS Grid */}
        {Object.keys(volumes).length > 0 && (
          <Card className="gap-2 py-3">
            <CardContent>
              <ETDRSCircularGrid
                volumes={volumes}
                meshes={meshes}
                eye={eye}
                visibilityMap={visibilityMap}
              />
            </CardContent>
          </Card>
        )}

        {/* Average Thicknesses */}
        {Object.keys(thicknesses).length > 0 && (
          <Card className="gap-2 py-3">
            <CardHeader>
              <CardTitle className="text-sm">Average Thickness</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {meshes
                  .filter(
                    (m) =>
                      visibilityMap[m.name] !== false &&
                      thicknesses[m.name] != null,
                  )
                  .map((mesh) => (
                    <div
                      key={mesh.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ backgroundColor: mesh.color }}
                        />
                        <span className="text-xs font-medium">{mesh.name}</span>
                      </div>
                      <span className="text-xs font-mono font-medium">
                        {thicknesses[mesh.name].toFixed(1)} µm
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Volume Measurements */}
        {Object.keys(volumes).length > 0 && (
          <Card className="gap-2 py-3">
            <CardHeader>
              <CardTitle className="text-sm">Volume Measurements</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {meshes
                  .filter(
                    (m) => visibilityMap[m.name] !== false && volumes[m.name],
                  )
                  .map((mesh) => {
                    const vol = volumes[mesh.name];
                    return (
                      <div key={mesh.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2.5 h-2.5 rounded-sm"
                              style={{ backgroundColor: mesh.color }}
                            />
                            <span className="text-xs font-medium">
                              {mesh.name}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-medium">
                            {vol.total.toFixed(2)} nL
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Layers */}
        <Card className="gap-2 py-3">
          <CardHeader>
            <CardTitle className="text-sm">Layers ({meshes.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {meshes.map((mesh) => (
              <div key={mesh.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-border"
                      style={{ backgroundColor: mesh.color }}
                    />
                    <span className="text-sm font-medium">{mesh.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleVisibility(mesh.name)}
                    className="h-8 w-8 p-0"
                  >
                    {visibilityMap[mesh.name] ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Opacity</span>
                    <span>
                      {Math.round((opacityMap[mesh.name] ?? 1.0) * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[(opacityMap[mesh.name] ?? 1.0) * 100]}
                    onValueChange={(v) => updateOpacity(mesh.name, v[0] / 100)}
                    min={0}
                    max={100}
                    step={5}
                    disabled={!(visibilityMap[mesh.name] ?? true)}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {mesh.vertexCount.toLocaleString()} vertices
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Slices */}
        <Card className="gap-2 py-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Slices ({slices.filter((s) => s.valid).length}/{slices.length})
              </CardTitle>
              <Button
                size="sm"
                variant={showSliceGrid ? "default" : "outline"}
                onClick={() => setShowSliceGrid(!showSliceGrid)}
                className="h-7 gap-1.5 text-xs"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
                {showSliceGrid ? "Hide" : "Show"}
              </Button>
            </div>
          </CardHeader>
          {showSliceGrid && (
            <CardContent className="pt-0 space-y-2">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] flex-1"
                  onClick={() => {
                    const m: Record<number, boolean> = {};
                    slices.forEach((s) => (m[s.index] = true));
                    setSliceVisibility(m);
                  }}
                >
                  Show All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] flex-1"
                  onClick={() => {
                    const m: Record<number, boolean> = {};
                    slices.forEach((s) => (m[s.index] = false));
                    setSliceVisibility(m);
                  }}
                >
                  Hide All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] flex-1"
                  onClick={() => {
                    const m: Record<number, boolean> = {};
                    slices.forEach((s) => (m[s.index] = s.valid));
                    setSliceVisibility(m);
                  }}
                >
                  Valid Only
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-0.5">
                {slices.map((slice) => (
                  <div
                    key={slice.index}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 shrink-0"
                      onClick={() =>
                        setSliceVisibility((prev) => ({
                          ...prev,
                          [slice.index]: !(prev[slice.index] ?? true),
                        }))
                      }
                    >
                      {(sliceVisibility[slice.index] ?? true) ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${slice.valid ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <span className="font-mono truncate">
                      {slice.filename.replace(/\.[^.]+$/, "")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Cross-Section Clip */}
        {maxExtent > 0 && (
          <Card className="gap-2 py-3">
            <CardHeader>
              <CardTitle className="text-sm">Cross Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <CrossSectionSlider
                value={clipRange}
                onChange={setClipRange}
                min={0}
                max={maxExtent}
                step={maxExtent / 200}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>{clipRange[0].toFixed(1)} µm</span>
                <span>{clipRange[1].toFixed(1)} µm</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
