/**
 * Load mask pixels from a Blob via Canvas.
 * Returns the R channel as a Uint8Array (for grayscale PNGs, R=G=B=label value).
 */
/**
 * Load mask pixels from a Blob via Canvas, optionally downsampled.
 * Returns the R channel + dimensions + scale factor for adjusting spacings.
 *
 * @param maxDim  Downsample so neither dimension exceeds this (0 = no downsample).
 *                Uses nearest-neighbor to preserve integer label values.
 */
export async function loadMaskPixels(
  blob: Blob,
  maxDim: number = 0
): Promise<{ data: Uint8Array; width: number; height: number; scaleFactor: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("No canvas context")); return; }

      let w = img.width;
      let h = img.height;
      let scaleFactor = 1;

      if (maxDim > 0 && (w > maxDim || h > maxDim)) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
        scaleFactor = img.width / w; // e.g., 512/256 = 2
      }

      canvas.width = w;
      canvas.height = h;
      ctx.imageSmoothingEnabled = false; // nearest-neighbor for labels
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const pixels = imageData.data;

      const data = new Uint8Array(w * h);
      for (let i = 0; i < data.length; i++) {
        data[i] = pixels[i * 4];
      }

      URL.revokeObjectURL(url);
      resolve({ data, width: w, height: h, scaleFactor });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

/**
 * Stack mask pixel arrays into a flat 3D volume.
 * Volume layout: volume[z * H * W + y * W + x]
 * Y-axis is flipped so that image-top (ILM) maps to high Y in 3D space.
 *
 * @param slices Array of { data, width, height } sorted by slice order
 * @returns Flat Uint8Array volume + dimensions [depth, height, width] + unique labels
 */
export function stackVolume(
  slices: { data: Uint8Array; width: number; height: number }[]
): { volume: Uint8Array; dims: [number, number, number]; labels: number[] } {
  if (slices.length === 0) throw new Error("No slices");

  const { width, height } = slices[0];
  const depth = slices.length;
  const volume = new Uint8Array(depth * height * width);
  const labelSet = new Set<number>();

  for (let z = 0; z < depth; z++) {
    const slice = slices[z];
    // Resize check (skip mismatched slices — fill with 0)
    if (slice.width !== width || slice.height !== height) {
      continue;
    }
    for (let y = 0; y < height; y++) {
      // Flip Y: image row y maps to volume row (height - 1 - y)
      const srcRow = y;
      const dstRow = height - 1 - y;
      const srcOffset = srcRow * width;
      const dstOffset = z * height * width + dstRow * width;
      for (let x = 0; x < width; x++) {
        const val = slice.data[srcOffset + x];
        volume[dstOffset + x] = val;
        if (val > 0) labelSet.add(val);
      }
    }
  }

  return {
    volume,
    dims: [depth, height, width],
    labels: Array.from(labelSet).sort((a, b) => a - b),
  };
}

/**
 * Extract a binary volume for a single label.
 */
export function extractBinaryVolume(
  volume: Uint8Array,
  _dims: [number, number, number],
  label: number
): Uint8Array {
  const binary = new Uint8Array(volume.length);
  for (let i = 0; i < volume.length; i++) {
    binary[i] = volume[i] === label ? 1 : 0;
  }
  return binary;
}

/**
 * Linearly interpolate a binary volume along the Z (depth/slice) axis.
 *
 * Inserts `steps` intermediate slices between each pair of original slices.
 * For binary volumes the interpolated values are thresholded at 0.5, so
 * marching cubes sees a smooth diagonal transition instead of a hard step.
 *
 * Example: 25 slices with steps=4 → 25 + 24*4 = 121 slices.
 * Z spacing is divided by (steps + 1).
 *
 * @param binary     Binary volume (flat Uint8Array, D×H×W)
 * @param dims       [depth, height, width]
 * @param steps      Number of intermediate slices to insert between each pair
 * @returns          { volume, dims } with the upsampled volume
 */
export function interpolateZAxis(
  binary: Uint8Array,
  dims: [number, number, number],
  steps: number
): { volume: Float32Array; dims: [number, number, number] } {
  const [depth, height, width] = dims;
  const sliceSize = height * width;

  if (steps <= 0) {
    const floatVol = new Float32Array(binary.length);
    for (let i = 0; i < binary.length; i++) floatVol[i] = binary[i];
    return { volume: floatVol, dims };
  }

  const newDepth = depth + (depth - 1) * steps;
  const result = new Float32Array(newDepth * sliceSize);

  for (let z = 0; z < depth - 1; z++) {
    const srcA = z * sliceSize;
    const srcB = (z + 1) * sliceSize;

    // Copy original slice A (values will be 0.0 or 1.0)
    const dstBase = z * (steps + 1) * sliceSize;
    for (let i = 0; i < sliceSize; i++) {
      result[dstBase + i] = binary[srcA + i];
    }

    // Generate intermediate slices via linear blend (no thresholding — keep
    // smooth gradients so marching cubes can interpolate vertices properly)
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1); // 0 < t < 1
      const dstOffset = (z * (steps + 1) + s) * sliceSize;
      for (let i = 0; i < sliceSize; i++) {
        result[dstOffset + i] = binary[srcA + i] * (1 - t) + binary[srcB + i] * t;
      }
    }
  }

  // Copy last original slice
  const lastSrc = (depth - 1) * sliceSize;
  const lastDst = (newDepth - 1) * sliceSize;
  for (let i = 0; i < sliceSize; i++) {
    result[lastDst + i] = binary[lastSrc + i];
  }

  return {
    volume: result,
    dims: [newDepth, height, width],
  };
}

/**
 * Separable 3D Gaussian blur on a Float32Array volume.
 *
 * Smooths hard pixel boundaries into gradients so marching cubes
 * can place vertices at interpolated positions, eliminating
 * staircase artifacts.
 *
 * @param vol   Float32Array volume (flat, D×H×W)
 * @param dims  [depth, height, width]
 * @param sigma Gaussian sigma in voxels
 */
export function gaussianBlur3D(
  vol: Float32Array,
  dims: [number, number, number],
  sigma: number = 1.0
): Float32Array {
  const [depth, height, width] = dims;

  // Build 1D Gaussian kernel
  const radius = Math.ceil(sigma * 2.5);
  const kSize = 2 * radius + 1;
  const kernel = new Float32Array(kSize);
  let sum = 0;
  for (let i = 0; i < kSize; i++) {
    const d = i - radius;
    kernel[i] = Math.exp(-(d * d) / (2 * sigma * sigma));
    sum += kernel[i];
  }
  for (let i = 0; i < kSize; i++) kernel[i] /= sum;

  let src = new Float32Array(vol);
  let dst = new Float32Array(vol.length);

  // Pass 1: blur along X (width)
  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      const base = z * height * width + y * width;
      for (let x = 0; x < width; x++) {
        let acc = 0;
        for (let k = -radius; k <= radius; k++) {
          const sx = Math.min(Math.max(x + k, 0), width - 1);
          acc += src[base + sx] * kernel[k + radius];
        }
        dst[base + x] = acc;
      }
    }
  }
  [src, dst] = [dst, new Float32Array(vol.length)];

  // Pass 2: blur along Y (height)
  for (let z = 0; z < depth; z++) {
    const sBase = z * height * width;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let acc = 0;
        for (let k = -radius; k <= radius; k++) {
          const sy = Math.min(Math.max(y + k, 0), height - 1);
          acc += src[sBase + sy * width + x] * kernel[k + radius];
        }
        dst[sBase + y * width + x] = acc;
      }
    }
  }
  [src, dst] = [dst, new Float32Array(vol.length)];

  // Pass 3: blur along Z (depth)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        let acc = 0;
        for (let k = -radius; k <= radius; k++) {
          const sz = Math.min(Math.max(z + k, 0), depth - 1);
          acc += src[sz * height * width + y * width + x] * kernel[k + radius];
        }
        dst[z * height * width + y * width + x] = acc;
      }
    }
  }

  return dst;
}
