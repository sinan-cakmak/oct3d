import { PerspectiveCamera } from "@react-three/drei";
import CameraController from "./CameraController";
import ETDRSGrid from "./ETDRSGrid";
import SliceGrid from "./SliceGrid";
import MeshLayer from "./MeshLayer";

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

export default function Scene({
  meshes,
  visibilityMap,
  opacityMap,
  resetTrigger,
  origin,
  eye,
  showSliceGrid,
  slices,
  scalings,
  dims,
  sliceVisibility,
  clipRange,
  maxExtent,
}: {
  meshes: MeshData[];
  visibilityMap: Record<string, boolean>;
  opacityMap: Record<string, number>;
  resetTrigger: number;
  origin: [number, number, number];
  eye: string;
  showSliceGrid: boolean;
  slices: SliceInfo[];
  scalings: [number, number, number];
  dims: [number, number, number];
  sliceVisibility: Record<number, boolean>;
  clipRange: [number, number];
  maxExtent: number;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[3000, 2000, 3000]} fov={60} near={1} far={50000} />
      <CameraController resetTrigger={resetTrigger} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5000, 5000, 5000]} intensity={0.8} castShadow />
      <directionalLight position={[-5000, -5000, -5000]} intensity={0.4} />
      <pointLight position={[0, 5000, 0]} intensity={0.3} />

      <ETDRSGrid origin={origin} eye={eye} />

      {meshes.map((mesh) => (
        <MeshLayer
          key={mesh.labelId}
          positions={mesh.positions}
          indices={mesh.indices}
          color={mesh.color}
          visible={visibilityMap[mesh.name] ?? true}
          opacity={opacityMap[mesh.name] ?? 1.0}
          sliceVisibility={sliceVisibility}
          zSpacing={scalings[2]}
          totalSlices={slices.length}
          clipRange={clipRange}
          maxExtent={maxExtent}
        />
      ))}

      {showSliceGrid && slices.length > 0 && (
        <SliceGrid slices={slices} scalings={scalings} dims={dims} sliceVisibility={sliceVisibility} />
      )}
    </>
  );
}
