/**
 * ETDRS (Early Treatment Diabetic Retinopathy Study) volume calculations.
 *
 * Classifies each voxel into one of 9 ETDRS regions based on distance
 * and angle from the foveal center, then accumulates volume per region
 * per label.
 *
 * Adapted from optimized_oct_viz/core/metrics.py
 */

export const ETDRS_REGIONS = ["c1", "s3", "i3", "n3", "t3", "s6", "i6", "n6", "t6"] as const;
export type ETDRSRegion = (typeof ETDRS_REGIONS)[number];

export interface ETDRSVolumes {
  [region: string]: number; // region → volume in nL
  total: number;
}

/**
 * Classify a point into an ETDRS region based on distance and angle from
 * the foveal center.
 *
 * Matches optimized_oct_viz/core/metrics.py get_etdrs_region()
 *
 * @param dist  Distance from foveal center (µm)
 * @param angle Angle from horizontal (degrees, atan2 convention)
 * @param eye   "OD" or "OS"
 * @returns Region index 0-8, or -1 if outside the 6mm grid
 */
function getETDRSRegion(dist: number, angle: number, eye: string): number {
  if (dist <= 500) return 0; // c1

  if (dist <= 1500) {
    if (angle >= 45 && angle <= 135) return 1; // s3
    if (angle >= -135 && angle <= -45) return 2; // i3
    if (angle >= -45 && angle <= 45) return eye === "OD" ? 3 : 4; // n3 or t3
    return eye === "OD" ? 4 : 3; // t3 or n3 (angle > 135 or < -135)
  }

  if (dist <= 3000) {
    if (angle >= 45 && angle <= 135) return 5; // s6
    if (angle >= -135 && angle <= -45) return 6; // i6
    if (angle >= -45 && angle <= 45) return eye === "OD" ? 7 : 8; // n6 or t6
    return eye === "OD" ? 8 : 7; // t6 or n6
  }

  return -1; // outside grid
}

/**
 * Calculate ETDRS volumes for a single label's binary volume.
 *
 * Coordinate mapping:
 *   volume[z * H * W + y * W + x]
 *     x = image column (physical X = x * scalings[0])
 *     y = image row (flipped, physical Y = y * scalings[1])
 *     z = slice index (physical Z = z * scalings[2])
 *
 * ETDRS distance/angle uses physical X and Z only (ignores Y):
 *   dx = x * scalings[0] - origin[0]
 *   dz = z * scalings[2] - origin[1]   (origin[1] here is physical Z center)
 *
 * @param volume    Binary volume (flat Uint8Array, D×H×W)
 * @param dims      [depth, height, width]
 * @param scalings  [xSpacing, ySpacing, zSpacing] in µm
 * @param origin    [physicalX, physicalZ] of foveal center in µm
 * @param eye       "OD" or "OS"
 */
export function calculateETDRSVolumes(
  volume: Uint8Array,
  dims: [number, number, number],
  scalings: [number, number, number],
  origin: [number, number],
  eye: string
): ETDRSVolumes {
  const [depth, height, width] = dims;
  const [xSpacing, ySpacing, zSpacing] = scalings;
  const voxelVolume = xSpacing * ySpacing * zSpacing; // µm³

  const stats = new Float64Array(9); // one per ETDRS region

  for (let z = 0; z < depth; z++) {
    const realZ = z * zSpacing;
    // Negate dz: z=0 is the most SUPERIOR scan, z increases toward INFERIOR.
    // atan2(negative, dx) → negative angle → classified as inferior. Correct.
    const dz = -(realZ - origin[1]);
    const zOffset = z * height * width;

    for (let x = 0; x < width; x++) {
      const realX = x * xSpacing;
      const dx = realX - origin[0];
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Skip if definitely outside outer ring (fast path)
      if (dist > 3000) continue;

      const angle = (Math.atan2(dz, dx) * 180) / Math.PI;
      const regionIdx = getETDRSRegion(dist, angle, eye);
      if (regionIdx < 0) continue;

      // Count non-zero voxels in this column (all Y values at this x,z)
      for (let y = 0; y < height; y++) {
        if (volume[zOffset + y * width + x] > 0) {
          stats[regionIdx] += voxelVolume;
        }
      }
    }
  }

  // Convert µm³ to nL (1 nL = 1e6 µm³)
  const result: ETDRSVolumes = { total: 0 };
  let total = 0;
  for (let i = 0; i < 9; i++) {
    const nL = stats[i] / 1e6;
    result[ETDRS_REGIONS[i]] = nL;
    total += nL;
  }
  result.total = total;

  return result;
}

/**
 * Calculate ETDRS volumes for all labels in a multi-class volume.
 */
export function calculateAllETDRSVolumes(
  volume: Uint8Array,
  dims: [number, number, number],
  labels: number[],
  labelNames: Record<number, string>,
  scalings: [number, number, number],
  origin: [number, number],
  eye: string
): Record<string, ETDRSVolumes> {
  const result: Record<string, ETDRSVolumes> = {};

  for (const label of labels) {
    // Create binary volume for this label
    const binary = new Uint8Array(volume.length);
    for (let i = 0; i < volume.length; i++) {
      binary[i] = volume[i] === label ? 1 : 0;
    }

    const name = labelNames[label] || `Layer ${label}`;
    result[name] = calculateETDRSVolumes(binary, dims, scalings, origin, eye);
  }

  return result;
}
