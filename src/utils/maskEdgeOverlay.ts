/**
 * Compute a colored edge overlay from a mask PNG.
 *
 * Each pixel on a label boundary (any 4-neighbor has a different label) is
 * colored with that label's configured color. Background (label 0) is skipped.
 * Returns a PNG data URL where non-edge pixels are transparent.
 */
export async function computeMaskEdges(
  maskBlob: Blob,
  labelConfig: Record<number, { name: string; color: [number, number, number] }>
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(maskBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      // Read mask pixels via canvas
      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = w;
      srcCanvas.height = h;
      const srcCtx = srcCanvas.getContext("2d")!;
      srcCtx.drawImage(img, 0, 0);
      const srcPixels = srcCtx.getImageData(0, 0, w, h).data;

      // Extract label IDs from R channel
      const labels = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        labels[i] = srcPixels[i * 4];
      }

      // Build output with transparent background
      const outCanvas = document.createElement("canvas");
      outCanvas.width = w;
      outCanvas.height = h;
      const outCtx = outCanvas.getContext("2d")!;
      const outData = outCtx.createImageData(w, h);
      const out = outData.data; // all zeros = transparent

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const label = labels[y * w + x];
          if (label === 0) continue;

          const isEdge =
            (x > 0 && labels[y * w + (x - 1)] !== label) ||
            (x < w - 1 && labels[y * w + (x + 1)] !== label) ||
            (y > 0 && labels[(y - 1) * w + x] !== label) ||
            (y < h - 1 && labels[(y + 1) * w + x] !== label);

          if (isEdge) {
            const cfg = labelConfig[label];
            if (!cfg) continue;
            const idx = (y * w + x) * 4;
            out[idx] = cfg.color[0];
            out[idx + 1] = cfg.color[1];
            out[idx + 2] = cfg.color[2];
            out[idx + 3] = 255;
          }
        }
      }

      outCtx.putImageData(outData, 0, 0);
      resolve(outCanvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}
