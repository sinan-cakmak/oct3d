import { marchingCubes, taubinSmooth, gaussianBlur3D } from "./marchingCubesImpl";

export interface WorkerInput {
  type: "generateMesh";
  volume: Uint8Array;           // raw multi-class volume
  dims: [number, number, number];
  spacing: [number, number, number]; // [xSpacing, ySpacing, zSpacing] — original scalings
  labelId: number;
  interpSteps: number;
  smoothingIterations: number;
  blurSigma: number;
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

// ---------- helpers inlined to avoid importing from main-thread modules ----------

function extractBinary(volume: Uint8Array, label: number): Uint8Array {
  const out = new Uint8Array(volume.length);
  for (let i = 0; i < volume.length; i++) {
    out[i] = volume[i] === label ? 1 : 0;
  }
  return out;
}

function interpolateZ(
  binary: Uint8Array,
  dims: [number, number, number],
  steps: number
): { volume: Float32Array; dims: [number, number, number] } {
  const [depth, height, width] = dims;
  const sliceSize = height * width;

  if (steps <= 0) {
    const f = new Float32Array(binary.length);
    for (let i = 0; i < binary.length; i++) f[i] = binary[i];
    return { volume: f, dims };
  }

  const newDepth = depth + (depth - 1) * steps;
  const result = new Float32Array(newDepth * sliceSize);

  for (let z = 0; z < depth - 1; z++) {
    const srcA = z * sliceSize;
    const srcB = (z + 1) * sliceSize;
    const dstBase = z * (steps + 1) * sliceSize;

    for (let i = 0; i < sliceSize; i++) {
      result[dstBase + i] = binary[srcA + i];
    }

    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      const dstOffset = (z * (steps + 1) + s) * sliceSize;
      for (let i = 0; i < sliceSize; i++) {
        result[dstOffset + i] = binary[srcA + i] * (1 - t) + binary[srcB + i] * t;
      }
    }
  }

  const lastSrc = (depth - 1) * sliceSize;
  const lastDst = (newDepth - 1) * sliceSize;
  for (let i = 0; i < sliceSize; i++) {
    result[lastDst + i] = binary[lastSrc + i];
  }

  return { volume: result, dims: [newDepth, height, width] };
}

// ---------- worker message handler ----------

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { volume, dims, spacing, labelId, interpSteps, smoothingIterations, blurSigma } = e.data;

  try {
    // Step 1: Extract binary volume for this label
    const binary = extractBinary(volume, labelId);

    // Step 2: Z-axis interpolation (continuous floats)
    const interp = interpolateZ(binary, dims, interpSteps);

    // Step 3: Gaussian blur
    const blurred = gaussianBlur3D(interp.volume, interp.dims, blurSigma);

    // Step 4: Marching cubes with adjusted spacing
    const mcSpacing: [number, number, number] = [
      spacing[2] / (interpSteps > 0 ? interpSteps + 1 : 1), // Z spacing
      spacing[1],                                             // Y spacing
      spacing[0],                                             // X spacing
    ];
    let { positions, indices } = marchingCubes(blurred, interp.dims, mcSpacing, 0.5);

    if (positions.length === 0) {
      (self as unknown as Worker).postMessage({
        type: "meshResult",
        labelId,
        positions: new Float32Array(0),
        indices: new Uint32Array(0),
        vertexCount: 0,
        faceCount: 0,
      } as WorkerOutput);
      return;
    }

    // Step 5: Taubin smoothing
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

    (self as unknown as Worker).postMessage(result, [positions.buffer, indices.buffer]);
  } catch (err) {
    (self as unknown as Worker).postMessage({
      type: "error",
      labelId,
      message: err instanceof Error ? err.message : String(err),
    } as WorkerError);
  }
};
