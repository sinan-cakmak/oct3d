import { useMemo } from "react";
import * as THREE from "three";

interface MeshLayerProps {
  positions: Float32Array;
  indices: Uint32Array;
  color: string;
  visible: boolean;
  opacity: number;
  sliceVisibility: Record<number, boolean>;
  zSpacing: number;
  totalSlices: number;
}

export default function MeshLayer({
  positions,
  indices,
  color,
  visible,
  opacity,
  sliceVisibility,
  zSpacing,
  totalSlices,
}: MeshLayerProps) {
  const geometry = useMemo(() => {
    if (positions.length === 0) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [positions, indices]);

  const visibilityKey = JSON.stringify(sliceVisibility);

  const material = useMemo(() => {
    const hasHidden = totalSlices > 0 && Object.values(sliceVisibility).some((v) => v === false);
    const hiddenArray = new Float32Array(128);
    if (hasHidden) {
      for (let i = 0; i < Math.min(totalSlices, 128); i++) {
        if (sliceVisibility[i] === false) hiddenArray[i] = 1.0;
      }
    }

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      metalness: 0.3,
      roughness: 0.7,
      depthWrite: opacity >= 1.0,
    });

    if (hasHidden && zSpacing > 0) {
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uZSpacing = { value: zSpacing };
        shader.uniforms.uTotalSlices = { value: totalSlices };
        shader.uniforms.uHiddenSlices = { value: hiddenArray };

        shader.vertexShader = shader.vertexShader.replace(
          "#include <common>",
          `#include <common>\nvarying vec3 vWorldPos;`
        );
        shader.vertexShader = shader.vertexShader.replace(
          "#include <worldpos_vertex>",
          `#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;`
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <common>",
          `#include <common>\nvarying vec3 vWorldPos;\nuniform float uZSpacing;\nuniform int uTotalSlices;\nuniform float uHiddenSlices[128];`
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <dithering_fragment>",
          `int sliceIdx = int(floor(vWorldPos.x / uZSpacing));\nif (sliceIdx >= 0 && sliceIdx < uTotalSlices && uHiddenSlices[sliceIdx] > 0.5) discard;\n#include <dithering_fragment>`
        );
      };
    }

    return mat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, opacity, visibilityKey, zSpacing, totalSlices]);

  if (!geometry || !visible) return null;

  return <mesh geometry={geometry} material={material} />;
}
