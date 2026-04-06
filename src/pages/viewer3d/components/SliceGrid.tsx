import { Line, Html } from "@react-three/drei";

interface SliceInfo {
  index: number;
  filename: string;
  valid: boolean;
}

export default function SliceGrid({
  slices,
  scalings,
  dims,
  sliceVisibility,
}: {
  slices: SliceInfo[];
  scalings: [number, number, number]; // [X, Y, Z]
  dims: [number, number, number]; // [depth, height, width]
  sliceVisibility: Record<number, boolean>;
}) {
  // Axis mapping (matching reference project + MC output):
  //   THREE.x = width (within B-scan, x * xSpacing)
  //   THREE.y = height (axial, y * ySpacing)
  //   THREE.z = depth (stacking, z * zSpacing)
  const [, h, w] = dims;
  const xLen = w * scalings[0]; // width → THREE.x
  const yLen = h * scalings[1]; // height → THREE.y

  return (
    <group>
      {slices.map((slice) => {
        if (sliceVisibility[slice.index] === false) return null;
        const z = slice.index * scalings[2]; // depth → THREE.z
        const color = slice.valid ? "#22c55e" : "#ef4444";
        const label = slice.filename.replace(/\.[^.]+$/, "");

        // Rectangle in XY plane at constant Z
        const points: [number, number, number][] = [
          [0, 0, z], [xLen, 0, z], [xLen, yLen, z], [0, yLen, z], [0, 0, z],
        ];

        return (
          <group key={slice.index}>
            <Line points={points} color={color} lineWidth={1} opacity={0.6} transparent />
            <Html position={[xLen / 2, -60, z]} center style={{ pointerEvents: "none" }}>
              <div style={{
                background: slice.valid ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.85)",
                color: "#fff", fontSize: "10px", fontFamily: "monospace",
                padding: "1px 5px", borderRadius: "3px", whiteSpace: "nowrap",
              }}>
                {label}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
