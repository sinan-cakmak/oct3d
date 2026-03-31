import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export default function CameraController({
  resetTrigger,
}: {
  resetTrigger: number;
}) {
  const { camera, scene } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const box = new THREE.Box3();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        box.union(new THREE.Box3().setFromObject(object));
      }
    });

    if (!box.isEmpty()) {
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      const dist = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 0.45;

      camera.position.set(
        center.x + dist * 0.6,
        center.y + dist * 0.4,
        center.z + dist * 0.6,
      );
      camera.lookAt(center);

      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }
    }
  }, [camera, scene, resetTrigger]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={1.2}
      minDistance={100}
      maxDistance={20000}
    />
  );
}
