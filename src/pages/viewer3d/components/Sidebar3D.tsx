import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Eye, EyeOff, X, Grid3X3, Download } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LocaleToggle from "@/components/LocaleToggle";
import { motion } from "framer-motion";
import ETDRSCircularGrid from "./ETDRSCircularGrid";
import CrossSectionSlider from "./CrossSectionSlider";
import type { ETDRSVolumes } from "@/utils/etdrsCalculation";
import useTranslation from "@/i18n/useTranslation";

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
  etdrsThicknesses,
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
  etdrsThicknesses: Record<string, ETDRSVolumes>;
  thicknesses: Record<string, number>;
  eye: string;
  clipRange: [number, number];
  setClipRange: (v: [number, number]) => void;
  maxExtent: number;
  patientName: string;
}) {
  const { t } = useTranslation();
  const [volumeUnit, setVolumeUnit] = useState<"nL" | "mm3">("nL");
  const [sumVolume, setSumVolume] = useState(false);
  const [sumThickness, setSumThickness] = useState(false);

  // 1 nL = 0.001 mm³
  const formatVolume = (nL: number) => {
    const v = volumeUnit === "mm3" ? nL / 1000 : nL;
    return v.toFixed(volumeUnit === "mm3" ? 4 : 2);
  };
  const formatThickness = (um: number) => um.toFixed(1);

  const exportCSV = useCallback(() => {
    const ETDRS_KEYS = ["c1", "s3", "i3", "n3", "t3", "s6", "i6", "n6", "t6"] as const;

    const headers = [
      "Patient",
      "Eye",
      "Label",
      "Avg Thickness (um)",
      "Total Volume (nL)",
      ...ETDRS_KEYS.map((k) => `ETDRS ${k} Volume (nL)`),
      ...ETDRS_KEYS.map((k) => `ETDRS ${k} Thickness (um)`),
    ];

    const rows: string[][] = [];
    for (const mesh of meshes) {
      const vol = volumes[mesh.name];
      const thick = thicknesses[mesh.name];
      const sectThick = etdrsThicknesses[mesh.name];
      rows.push([
        patientName,
        eye,
        mesh.name,
        thick != null ? thick.toFixed(2) : "",
        vol ? vol.total.toFixed(4) : "",
        ...ETDRS_KEYS.map((k) => (vol ? vol[k].toFixed(4) : "")),
        ...ETDRS_KEYS.map((k) => (sectThick ? sectThick[k].toFixed(2) : "")),
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
  }, [meshes, volumes, thicknesses, etdrsThicknesses, eye, patientName]);

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
            <h1 className="text-2xl font-bold">{t("sidebar.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("sidebar.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <LocaleToggle />
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
            {t("sidebar.export")}
          </Button>
        )}

        {/* ETDRS Volume Grid */}
        {Object.keys(volumes).length > 0 && (
          <Card className="gap-2 py-3">
            <CardContent>
              <ETDRSCircularGrid
                title={`${t("etdrs.titleVolume")} (${volumeUnit === "mm3" ? "mm³" : "nL"})`}
                values={volumes}
                meshes={meshes}
                eye={eye}
                visibilityMap={visibilityMap}
                formatValue={formatVolume}
                sumMode={sumVolume}
                headerAction={
                  <div className="flex items-center gap-1">
                    <button
                      className={`px-2 py-0.5 rounded-md border border-border text-[11px] ${sumVolume ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}
                      onClick={() => setSumVolume((v) => !v)}
                      title="Toggle sum across visible layers"
                    >
                      Σ
                    </button>
                    <div className="inline-flex rounded-md border border-border overflow-hidden text-[11px]">
                      <button
                        className={`px-2 py-0.5 ${volumeUnit === "nL" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}
                        onClick={() => setVolumeUnit("nL")}
                      >
                        nL
                      </button>
                      <button
                        className={`px-2 py-0.5 ${volumeUnit === "mm3" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}
                        onClick={() => setVolumeUnit("mm3")}
                      >
                        mm³
                      </button>
                    </div>
                  </div>
                }
              />
            </CardContent>
          </Card>
        )}

        {/* ETDRS Thickness Grid */}
        {Object.keys(etdrsThicknesses).length > 0 && (
          <Card className="gap-2 py-3">
            <CardContent>
              <ETDRSCircularGrid
                title={`${t("etdrs.titleThickness")} (µm)`}
                values={etdrsThicknesses}
                meshes={meshes}
                eye={eye}
                visibilityMap={visibilityMap}
                formatValue={formatThickness}
                sumMode={sumThickness}
                headerAction={
                  <button
                    className={`px-2 py-0.5 rounded-md border border-border text-[11px] ${sumThickness ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"}`}
                    onClick={() => setSumThickness((v) => !v)}
                    title="Toggle sum across visible layers"
                  >
                    Σ
                  </button>
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Layers */}
        <Card className="gap-2 py-3">
          <CardHeader>
            <CardTitle className="text-sm">{t("sidebar.layersCount", { count: meshes.length })}</CardTitle>
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
                    <span>{t("sidebar.opacity")}</span>
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
                  {t("sidebar.vertices", { count: mesh.vertexCount.toLocaleString() })}
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
                {t("sidebar.slicesCount", { valid: slices.filter((s) => s.valid).length, total: slices.length })}
              </CardTitle>
              <Button
                size="sm"
                variant={showSliceGrid ? "default" : "outline"}
                onClick={() => setShowSliceGrid(!showSliceGrid)}
                className="h-7 gap-1.5 text-xs"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
                {showSliceGrid ? t("sidebar.hide") : t("sidebar.show")}
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
                  {t("sidebar.showAll")}
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
                  {t("sidebar.hideAll")}
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
                  {t("sidebar.validOnly")}
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
              <CardTitle className="text-sm">{t("sidebar.crossSection")}</CardTitle>
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
