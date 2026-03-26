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
  const [, h, w] = dims;
  const zLen = w * scalings[0]; // width -> THREE.z
  const yLen = h * scalings[1]; // height -> THREE.y

  return (
    <group>
      {slices.map((slice) => {
        if (sliceVisibility[slice.index] === false) return null;
        const x = slice.index * scalings[2]; // depth -> THREE.x
        const color = slice.valid ? "#22c55e" : "#ef4444";
        const label = slice.filename.replace(/\.[^.]+$/, "");

        const points: [number, number, number][] = [
          [x, 0, 0], [x, 0, zLen], [x, yLen, zLen], [x, yLen, 0], [x, 0, 0],
        ];

        return (
          <group key={slice.index}>
            <Line points={points} color={color} lineWidth={1} opacity={0.6} transparent />
            <Html position={[x, -60, zLen / 2]} center style={{ pointerEvents: "none" }}>
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
