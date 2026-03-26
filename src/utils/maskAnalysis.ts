/**
 * Analyze a mask PNG file to extract unique label values.
 * Reads the R channel of each pixel (for grayscale PNGs, R=G=B).
 * Returns sorted array of unique non-zero label values.
 */
export async function analyzeMaskFile(file: File | Blob): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const uniqueValues = new Set<number>();
        for (let i = 0; i < data.length; i += 4) {
          const value = data[i]; // R channel
          if (value > 0) {
            uniqueValues.add(value);
          }
        }

        resolve(Array.from(uniqueValues).sort((a, b) => a - b));
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load mask image"));
    };

    img.src = url;
  });
}

/**
 * Analyze multiple mask files and return the union of all unique labels.
 */
export async function analyzeAllMasks(files: (File | Blob)[]): Promise<number[]> {
  const allLabels = new Set<number>();
  for (const file of files) {
    const labels = await analyzeMaskFile(file);
    labels.forEach((l) => allLabels.add(l));
  }
  return Array.from(allLabels).sort((a, b) => a - b);
}
