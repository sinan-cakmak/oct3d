import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { addImages, updateLabelConfig } from "@/db";
import { analyzeAllMasks } from "@/utils/maskAnalysis";
import {
  getDefaultLabelName,
  getDefaultLabelColor,
} from "@/utils/colorPalette";
import type { Patient } from "@/db/types";
import { toast } from "sonner";

interface MaskUploadZoneProps {
  patientId: string;
  patient: Patient;
  eye?: "OD" | "OS";
}

export default function MaskUploadZone({
  patientId,
  patient,
  eye = "OD",
}: MaskUploadZoneProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      try {
        await addImages(patientId, acceptedFiles, "mask", eye);

        // Analyze masks to detect labels
        const detectedLabels = await analyzeAllMasks(acceptedFiles);

        // Merge detected labels into existing config — only add NEW labels
        const existingConfig = { ...patient.labelConfig };
        let newLabelsAdded = 0;
        for (const labelId of detectedLabels) {
          if (!(labelId in existingConfig)) {
            existingConfig[labelId] = {
              name: getDefaultLabelName(labelId),
              color: getDefaultLabelColor(labelId),
            };
            newLabelsAdded++;
          }
        }

        if (newLabelsAdded > 0 || Object.keys(existingConfig).length > 0) {
          await updateLabelConfig(patientId, existingConfig);
        }

        toast.success(`Uploaded ${acceptedFiles.length} masks`);
        if (newLabelsAdded > 0) {
          toast.info(`Detected ${newLabelsAdded} new label(s)`);
        }
      } catch (err) {
        toast.error("Failed to upload masks");
        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [patientId, patient.labelConfig]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        {uploading ? (
          <>
            <Loader2 className="size-8 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">
              Uploading & analyzing masks...
            </p>
          </>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? "Drop mask files here..."
                : "Drag & drop mask images, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground/60">
              PNG, JPG files accepted
            </p>
          </>
        )}
      </div>
    </div>
  );
}
