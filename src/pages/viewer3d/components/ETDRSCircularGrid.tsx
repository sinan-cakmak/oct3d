/**
 * ETDRS circular volume diagram for the sidebar.
 * Shows 9 regions with volume values per visible mesh layer.
 *
 * Adapted from ano-lux/src/pages/projects/3d-view/ProjectViewer3D.tsx
 * ETDRSCircularGrid component.
 */

import type { ETDRSVolumes } from "@/utils/etdrsCalculation";

interface MeshInfo {
  name: string;
  color: string;
}

export default function ETDRSCircularGrid({
  volumes,
  meshes,
  eye,
  visibilityMap,
}: {
  volumes: Record<string, ETDRSVolumes>;
  meshes: MeshInfo[];
  eye: string;
  visibilityMap: Record<string, boolean>;
}) {
  // The label is always N/T — what changes per eye is which SIDE they appear on.
  // OD: N on right, T on left.  OS: N on left, T on right.
  // The n6/t6 positions already swap via the eye check below, so labels are fixed.
  const nasalLabel = "N";
  const temporalLabel = "T";

  const getRegionVolumes = (region: string) =>
    meshes
      .filter((m) => visibilityMap[m.name] !== false)
      .map((m) => ({
        name: m.name,
        value: (volumes[m.name]?.[region] ?? 0).toFixed(2),
        color: m.color,
      }));

  const VolumeText = ({ region }: { region: string }) => {
    const data = getRegionVolumes(region);
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
      <h3 className="text-sm font-semibold mb-4">ETDRS Volumes (nL)</h3>

      <div className="relative w-[360px] h-[360px]">
        {/* SVG Grid */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 360">
          <circle cx="180" cy="180" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          <circle cx="180" cy="180" r="105" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          <circle cx="180" cy="180" r="170" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          {[-45, 45, 135, -135].map((a) => (
            <line key={a} {...getLineCoords(a, 45, 170)} stroke="currentColor" strokeWidth="2" className="text-foreground" />
          ))}
        </svg>

        {/* Central C1 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <VolumeText region="c1" />
        </div>

        {/* Inner ring - Superior S3 */}
        <div className="absolute" style={{ left: "50%", top: "29.5%", transform: "translate(-50%, -50%)" }}>
          <VolumeText region="s3" />
        </div>

        {/* Inner ring - Inferior I3 */}
        <div className="absolute" style={{ left: "50%", top: "70.5%", transform: "translate(-50%, -50%)" }}>
          <VolumeText region="i3" />
        </div>

        {/* Inner ring - Nasal N3 */}
        <div className="absolute" style={
          eye === "OD"
            ? { left: "70.5%", top: "50%", transform: "translate(-50%, -50%)" }
            : { left: "29.5%", top: "50%", transform: "translate(-50%, -50%)" }
        }>
          <VolumeText region="n3" />
        </div>

        {/* Inner ring - Temporal T3 */}
        <div className="absolute" style={
          eye === "OD"
            ? { left: "29.5%", top: "50%", transform: "translate(-50%, -50%)" }
            : { left: "70.5%", top: "50%", transform: "translate(-50%, -50%)" }
        }>
          <VolumeText region="t3" />
        </div>

        {/* Outer ring - Superior S6 */}
        <div className="absolute" style={{ left: "50%", top: "12.5%", transform: "translate(-50%, -50%)" }}>
          <VolumeText region="s6" />
        </div>

        {/* Outer ring - Inferior I6 */}
        <div className="absolute" style={{ left: "50%", top: "87.5%", transform: "translate(-50%, -50%)" }}>
          <VolumeText region="i6" />
        </div>

        {/* Outer ring - Nasal N6 with label */}
        <div className="absolute" style={
          eye === "OD"
            ? { left: "87.5%", top: "50%", transform: "translate(-50%, -50%)" }
            : { left: "12.5%", top: "50%", transform: "translate(-50%, -50%)" }
        }>
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[10px] font-bold">{nasalLabel}</div>
            <VolumeText region="n6" />
          </div>
        </div>

        {/* Outer ring - Temporal T6 with label */}
        <div className="absolute" style={
          eye === "OD"
            ? { left: "12.5%", top: "50%", transform: "translate(-50%, -50%)" }
            : { left: "87.5%", top: "50%", transform: "translate(-50%, -50%)" }
        }>
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[10px] font-bold">{temporalLabel}</div>
            <VolumeText region="t6" />
          </div>
        </div>
      </div>

      {/* Legend */}
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
