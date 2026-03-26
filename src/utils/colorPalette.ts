export const DEFAULT_LABEL_COLORS: [number, number, number][] = [
  [46, 204, 113],   // Green
  [52, 152, 219],   // Blue
  [231, 76, 60],    // Red
  [241, 196, 15],   // Yellow
  [155, 89, 182],   // Purple
  [230, 126, 34],   // Orange
  [26, 188, 156],   // Teal
  [236, 240, 241],  // Light gray
];

export function getDefaultLabelName(labelId: number): string {
  return `Layer ${labelId}`;
}

export function getDefaultLabelColor(labelId: number): [number, number, number] {
  // Use labelId - 1 as index since label 0 is background (never shown)
  const idx = (labelId - 1) % DEFAULT_LABEL_COLORS.length;
  return DEFAULT_LABEL_COLORS[idx >= 0 ? idx : 0];
}
