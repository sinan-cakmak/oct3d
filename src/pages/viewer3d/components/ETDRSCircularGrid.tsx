/**
 * ETDRS circular diagram for the sidebar. 9 regions with one value per visible
 * mesh layer. Generic over the metric: pass `values` (meshName -> region ->
 * number) plus `title` and `formatValue`; the caller decides unit conversion
 * and precision.
 */

import useTranslation from "@/i18n/useTranslation";

interface MeshInfo {
  name: string;
  color: string;
}

const REGIONS = ["c1", "s3", "i3", "n3", "t3", "s6", "i6", "n6", "t6"] as const;
type RegionKey = (typeof REGIONS)[number];

export default function ETDRSCircularGrid({
  title,
  values,
  meshes,
  eye,
  visibilityMap,
  formatValue,
  headerAction,
  sumMode = false,
}: {
  title: string;
  values: Record<string, Record<string, number>>;
  meshes: MeshInfo[];
  eye: string;
  visibilityMap: Record<string, boolean>;
  formatValue: (v: number) => string;
  headerAction?: React.ReactNode;
  sumMode?: boolean;
}) {
  const { t } = useTranslation();
  const nasalLabel = t("etdrs.nasal");
  const temporalLabel = t("etdrs.temporal");

  const visibleMeshes = meshes.filter((m) => visibilityMap[m.name] !== false);

  const getRegionValues = (region: RegionKey) =>
    visibleMeshes.map((m) => ({
      name: m.name,
      value: formatValue(values[m.name]?.[region] ?? 0),
      color: m.color,
    }));

  const getRegionSum = (region: RegionKey) =>
    visibleMeshes.reduce((acc, m) => acc + (values[m.name]?.[region] ?? 0), 0);

  const ValueText = ({ region }: { region: RegionKey }) => {
    if (sumMode) {
      return (
        <div className="text-[11px] font-semibold leading-tight text-foreground">
          {formatValue(getRegionSum(region))}
        </div>
      );
    }
    const data = getRegionValues(region);
    return (
      <div className="flex flex-col items-center gap-0.5">
        {data.map((d) => (
          <div key={d.name} className="text-[10px] font-medium leading-tight" style={{ color: d.color }}>
            {d.value}
          </div>
        ))}
      </div>
    );
  };

  const getLineCoords = (angleDeg: number, innerR: number, outerR: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x1: 180 + innerR * Math.cos(rad),
      y1: 180 + innerR * Math.sin(rad),
      x2: 180 + outerR * Math.cos(rad),
      y2: 180 + outerR * Math.sin(rad),
    };
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {headerAction}
      </div>

      <div className="relative w-[360px] h-[360px]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 360">
          <circle cx="180" cy="180" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          <circle cx="180" cy="180" r="105" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          <circle cx="180" cy="180" r="170" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          {[-45, 45, 135, -135].map((a) => (
            <line key={a} {...getLineCoords(a, 45, 170)} stroke="currentColor" strokeWidth="2" className="text-foreground" />
          ))}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <ValueText region="c1" />
        </div>

        <div className="absolute" style={{ left: "50%", top: "29.5%", transform: "translate(-50%, -50%)" }}>
          <ValueText region="s3" />
        </div>
        <div className="absolute" style={{ left: "50%", top: "70.5%", transform: "translate(-50%, -50%)" }}>
          <ValueText region="i3" />
        </div>

        <div className="absolute" style={
          eye === "OD"
            ? { left: "70.5%", top: "50%", transform: "translate(-50%, -50%)" }
            : { left: "29.5%", top: "50%", transform: "translate(-50%, -50%)" }
        }>
          <ValueText region="n3" />
        </div>
        <div className="absolute" style={
          eye === "OD"
            ? { left: "29.5%", top: "50%", transform: "translate(-50%, -50%)" }
            : { left: "70.5%", top: "50%", transform: "translate(-50%, -50%)" }
        }>
          <ValueText region="t3" />
        </div>

        <div className="absolute" style={{ left: "50%", top: "12.5%", transform: "translate(-50%, -50%)" }}>
          <ValueText region="s6" />
        </div>
        <div className="absolute" style={{ left: "50%", top: "87.5%", transform: "translate(-50%, -50%)" }}>
          <ValueText region="i6" />
        </div>

        <div className="absolute" style={
          eye === "OD"
            ? { left: "87.5%", top: "50%", transform: "translate(-50%, -50%)" }
            : { left: "12.5%", top: "50%", transform: "translate(-50%, -50%)" }
        }>
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[10px] font-bold">{nasalLabel}</div>
            <ValueText region="n6" />
          </div>
        </div>
        <div className="absolute" style={
          eye === "OD"
            ? { left: "12.5%", top: "50%", transform: "translate(-50%, -50%)" }
            : { left: "87.5%", top: "50%", transform: "translate(-50%, -50%)" }
        }>
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[10px] font-bold">{temporalLabel}</div>
            <ValueText region="t6" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {meshes.map((m) => (
          <div key={m.name} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: m.color }} />
            <span className="text-xs">{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
