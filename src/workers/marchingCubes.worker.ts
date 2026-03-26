import { marchingCubes, taubinSmooth } from "./marchingCubesImpl";

export interface WorkerInput {
  type: "generateMesh";
  volume: Uint8Array;
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
    let { positions, indices } = marchingCubes(volume, dims, spacing);

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
