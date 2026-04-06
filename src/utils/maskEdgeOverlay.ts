/**
 * Compute a colored edge overlay from a mask PNG.
 *
 * Each pixel on a label boundary is colored with that label's configured color.
 * `thickness` (1–5) controls dilation radius: radius = thickness - 1.
 * Background (label 0) is skipped. Returns a PNG data URL with transparent
 * background.
 */
export async function computeMaskEdges(
  maskBlob: Blob,
  labelConfig: Record<number, { name: string; color: [number, number, number] }>,
  thickness = 1
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

      // First pass: find 1-pixel-wide boundary pixels and their labels
      const edgeLabel = new Uint8Array(w * h); // 0 = not an edge
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const label = labels[y * w + x];
          if (label === 0) continue;
          const isEdge =
            (x > 0 && labels[y * w + (x - 1)] !== label) ||
            (x < w - 1 && labels[y * w + (x + 1)] !== label) ||
            (y > 0 && labels[(y - 1) * w + x] !== label) ||
            (y < h - 1 && labels[(y + 1) * w + x] !== label);
          if (isEdge) edgeLabel[y * w + x] = label;
        }
      }

      // Second pass: dilate by (thickness - 1) pixels
      const radius = thickness - 1;
      const outCanvas = document.createElement("canvas");
      outCanvas.width = w;
      outCanvas.height = h;
      const outCtx = outCanvas.getContext("2d")!;
      const outData = outCtx.createImageData(w, h);
      const out = outData.data; // all zeros = transparent

      if (radius === 0) {
        // No dilation — just copy edge pixels directly
        for (let i = 0; i < w * h; i++) {
          const label = edgeLabel[i];
          if (label === 0) continue;
          const cfg = labelConfig[label];
          if (!cfg) continue;
          out[i * 4] = cfg.color[0];
          out[i * 4 + 1] = cfg.color[1];
          out[i * 4 + 2] = cfg.color[2];
          out[i * 4 + 3] = 255;
        }
      } else {
        // Dilation: for each output pixel, check if any pixel within `radius`
        // is an edge pixel and borrow its color
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let found = 0;
            outer: for (let dy = -radius; dy <= radius; dy++) {
              const ny = y + dy;
              if (ny < 0 || ny >= h) continue;
              for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                if (nx < 0 || nx >= w) continue;
                const label = edgeLabel[ny * w + nx];
                if (label !== 0) { found = label; break outer; }
              }
            }
            if (found === 0) continue;
            const cfg = labelConfig[found];
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
