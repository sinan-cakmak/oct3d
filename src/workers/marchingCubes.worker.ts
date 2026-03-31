import { marchingCubes, taubinSmooth, gaussianBlur3D } from "./marchingCubesImpl";

export interface WorkerInput {
  type: "generateMesh";
  volume: Float32Array;
  dims: [number, number, number];
  spacing: [number, number, number];
  labelId: number;
  smoothingIterations: number;
}

export interface WorkerOutput {
  type: "meshResult";
  labelId: number;
  positions: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  faceCount: number;
}

export interface WorkerError {
  type: "error";
  labelId: number;
  message: string;
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { volume, dims, spacing, labelId, smoothingIterations } = e.data;

  try {
    // Anisotropic Gaussian blur: light XY smoothing for pixel aliasing,
    // strong Z smoothing to bridge the large inter-slice gaps (~246μm).
    // sigma is in voxel units: [sigmaX, sigmaY, sigmaZ]
    const smoothedVolume = gaussianBlur3D(volume, dims, [1.5, 1.0, 3.0]);
    let { positions, indices } = marchingCubes(smoothedVolume, dims, spacing, 0.5);

    if (positions.length === 0) {
      const result: WorkerOutput = {
        type: "meshResult",
        labelId,
        positions: new Float32Array(0),
        indices: new Uint32Array(0),
        vertexCount: 0,
        faceCount: 0,
      };
      (self as unknown as Worker).postMessage(result);
      return;
    }

    if (smoothingIterations > 0) {
      positions = taubinSmooth(positions, indices, smoothingIterations, 0.33, -0.34);
    }

    const result: WorkerOutput = {
      type: "meshResult",
      labelId,
      positions,
      indices,
      vertexCount: positions.length / 3,
      faceCount: indices.length / 3,
    };

    // Transfer ownership of typed arrays (zero-copy)
    (self as unknown as Worker).postMessage(result, [positions.buffer, indices.buffer]);
  } catch (err) {
    const error: WorkerError = {
      type: "error",
      labelId,
      message: err instanceof Error ? err.message : String(err),
    };
    (self as unknown as Worker).postMessage(error);
  }
};
