import { Line, Html } from "@react-three/drei";

export default function ETDRSGrid({ origin, eye }: { origin: [number, number, number]; eye: string }) {
  const r1 = 500, r3 = 1500, r6 = 3000;
  const labelOffset = r6 + 300; // place labels just outside outer ring

  const createCircle = (radius: number, segments = 64): [number, number, number][] => {
    const points: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push([origin[0] + radius * Math.cos(angle), origin[1], origin[2] + radius * Math.sin(angle)]);
    }
    return points;
  };

  const createRadial = (angleDeg: number): [number, number, number][] => {
    const rad = (angleDeg * Math.PI) / 180;
    return [
      [origin[0] + r1 * Math.cos(rad), origin[1], origin[2] + r1 * Math.sin(rad)],
      [origin[0] + r6 * Math.cos(rad), origin[1], origin[2] + r6 * Math.sin(rad)],
    ];
  };

  // Axis mapping:
  // Axis mapping (matching reference project):
  //   THREE.x = width (within B-scan) = Temporal → Nasal (OD)
  //   THREE.z = depth (scan stacking)  = Superior → Inferior
  //
  // N/T labels go along THREE.x (within-scan horizontal axis)
  // S/I labels go along THREE.z (scan stacking axis)
  const nasalPos: [number, number, number] = eye === "OD"
    ? [origin[0] + labelOffset, origin[1], origin[2]]
    : [origin[0] - labelOffset, origin[1], origin[2]];
  const temporalPos: [number, number, number] = eye === "OD"
    ? [origin[0] - labelOffset, origin[1], origin[2]]
    : [origin[0] + labelOffset, origin[1], origin[2]];

  const labelStyle = {
    color: "#999",
    fontSize: "14px",
    fontWeight: "bold" as const,
    pointerEvents: "none" as const,
  };

  return (
    <group>
      <Line points={createCircle(r1)} color="#333333" lineWidth={2} />
      <Line points={createCircle(r3)} color="#333333" lineWidth={2} />
      <Line points={createCircle(r6)} color="#333333" lineWidth={2} />
      {[45, 135, 225, 315].map((a) => (
        <Line key={a} points={createRadial(a)} color="#333333" lineWidth={2} />
      ))}

      {/* N/T along THREE.z (within B-scan width) */}
      <Html position={nasalPos} center style={{ pointerEvents: "none" }}>
        <div style={labelStyle}>N</div>
      </Html>
      <Html position={temporalPos} center style={{ pointerEvents: "none" }}>
        <div style={labelStyle}>T</div>
      </Html>
      {/* S/I along THREE.z (scan stacking direction) */}
      <Html position={[origin[0], origin[1], origin[2] - labelOffset]} center style={{ pointerEvents: "none" }}>
        <div style={labelStyle}>S</div>
      </Html>
      <Html position={[origin[0], origin[1], origin[2] + labelOffset]} center style={{ pointerEvents: "none" }}>
        <div style={labelStyle}>I</div>
      </Html>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[origin[0], origin[1] - 10, origin[2]]} receiveShadow>
        <planeGeometry args={[20000, 20000]} />
        <meshStandardMaterial color="#1a1a1a" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}
