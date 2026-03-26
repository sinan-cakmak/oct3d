export interface Patient {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  eye: "OD" | "OS";
  labelConfig: Record<number, { name: string; color: [number, number, number] }>;
}

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
