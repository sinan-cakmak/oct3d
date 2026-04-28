export interface Patient {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  eye: "OD" | "OS";
  labelConfig: Record<number, { name: string; color: [number, number, number] }>;
  xSpacing: number;
  ySpacing: number;
  zSpacing: number;
}

export const DEFAULT_X_SPACING = 11.54;
export const DEFAULT_Y_SPACING = 3.87;
export const DEFAULT_Z_SPACING = 246.0;

export interface PatientImage {
  id: string;
  patientId: string;
  filename: string;
  type: "oct" | "mask";
  eye: "OD" | "OS";
  blob: Blob;
  width: number;
  height: number;
  sortIndex: number;
}
