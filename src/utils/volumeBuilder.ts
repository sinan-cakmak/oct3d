/**
 * Load mask pixels from a Blob via Canvas.
 * Returns the R channel as a Uint8Array (for grayscale PNGs, R=G=B=label value).
 */
export async function loadMaskPixels(
  blob: Blob
): Promise<{ data: Uint8Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error("No canvas context")); return; }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Extract R channel only
      const data = new Uint8Array(img.width * img.height);
      for (let i = 0; i < data.length; i++) {
        data[i] = pixels[i * 4]; // R channel
      }

      URL.revokeObjectURL(url);
      resolve({ data, width: img.width, height: img.height });
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
