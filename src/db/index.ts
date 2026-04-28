import Dexie, { type EntityTable } from "dexie";
import {
  type Patient,
  type PatientImage,
  DEFAULT_X_SPACING,
  DEFAULT_Y_SPACING,
  DEFAULT_Z_SPACING,
} from "./types";

const db = new Dexie("oct3d") as Dexie & {
  patients: EntityTable<Patient, "id">;
  images: EntityTable<PatientImage, "id">;
};

db.version(1).stores({
  patients: "id, createdAt",
  images: "id, patientId, [patientId+type], [patientId+type+eye]",
});

// v2: added eye field to images
db.version(2).stores({
  patients: "id, createdAt",
  images: "id, patientId, [patientId+type], [patientId+type+eye]",
}).upgrade((tx) => {
  // Backfill existing images with the patient's eye
  return tx.table("images").toCollection().modify(async (img) => {
    if (!img.eye) {
      const patient = await tx.table("patients").get(img.patientId);
      img.eye = patient?.eye || "OD";
    }
  });
});

// v3: added per-patient X/Y/Z spacings (µm/px, µm/px, µm/slice)
db.version(3).stores({
  patients: "id, createdAt",
  images: "id, patientId, [patientId+type], [patientId+type+eye]",
}).upgrade((tx) => {
  return tx.table("patients").toCollection().modify((p) => {
    if (p.xSpacing == null) p.xSpacing = DEFAULT_X_SPACING;
    if (p.ySpacing == null) p.ySpacing = DEFAULT_Y_SPACING;
    if (p.zSpacing == null) p.zSpacing = DEFAULT_Z_SPACING;
  });
});

export { db };

// ---- Patient CRUD ----

export async function createPatient(name: string, eye: "OD" | "OS" = "OD"): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  await db.patients.add({
    id,
    name,
    createdAt: now,
    updatedAt: now,
    eye,
    labelConfig: {},
    xSpacing: DEFAULT_X_SPACING,
    ySpacing: DEFAULT_Y_SPACING,
    zSpacing: DEFAULT_Z_SPACING,
  });
  return id;
}

export async function updatePatientSpacings(
  id: string,
  spacings: { xSpacing?: number; ySpacing?: number; zSpacing?: number }
): Promise<void> {
  await db.patients.update(id, { ...spacings, updatedAt: Date.now() });
}

export async function renamePatient(id: string, newName: string): Promise<void> {
  await db.patients.update(id, { name: newName, updatedAt: Date.now() });
}

export async function updatePatientEye(id: string, eye: "OD" | "OS"): Promise<void> {
  await db.patients.update(id, { eye, updatedAt: Date.now() });
}

export async function deletePatient(id: string): Promise<void> {
  await db.transaction("rw", db.patients, db.images, async () => {
    await db.images.where("patientId").equals(id).delete();
    await db.patients.delete(id);
  });
}

export async function updateLabelConfig(
  patientId: string,
  config: Record<number, { name: string; color: [number, number, number] }>
): Promise<void> {
  await db.patients.update(patientId, { labelConfig: config, updatedAt: Date.now() });
}

// ---- Image CRUD ----

function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export async function addImages(
  patientId: string,
  files: File[],
  type: "oct" | "mask",
  eye: "OD" | "OS" = "OD"
): Promise<string[]> {
  const ids: string[] = [];
  for (const file of files) {
    const id = crypto.randomUUID();
    const { width, height } = await getImageDimensions(file);
    await db.images.add({
      id,
      patientId,
      filename: file.name,
      type,
      eye,
      blob: file,
      width,
      height,
      sortIndex: 0,
    });
    ids.push(id);
  }
  await db.patients.update(patientId, { updatedAt: Date.now() });
  return ids;
}

export async function removeImage(id: string): Promise<void> {
  const img = await db.images.get(id);
  if (img) {
    await db.images.delete(id);
    await db.patients.update(img.patientId, { updatedAt: Date.now() });
  }
}

export async function renameImage(id: string, newFilename: string): Promise<void> {
  await db.images.update(id, { filename: newFilename });
}

export function getPatientImages(patientId: string, type?: "oct" | "mask") {
  if (type) {
    return db.images.where("[patientId+type]").equals([patientId, type]).toArray();
  }
  return db.images.where("patientId").equals(patientId).toArray();
}
