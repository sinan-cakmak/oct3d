import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { addImages } from "@/db";
import { toast } from "sonner";

interface ImageUploadZoneProps {
  patientId: string;
  type: "oct" | "mask";
  eye?: "OD" | "OS";
  onUploadComplete?: () => void;
}

export default function ImageUploadZone({
  patientId,
  type,
  eye = "OD",
  onUploadComplete,
}: ImageUploadZoneProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      try {
        await addImages(patientId, acceptedFiles, type, eye);
        toast.success(`Uploaded ${acceptedFiles.length} images`);
        onUploadComplete?.();
      } catch (err) {
        toast.error("Failed to upload images");
        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [patientId, type, eye, onUploadComplete]
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
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? "Drop files here..."
                : `Drag & drop ${type === "oct" ? "OCT" : "mask"} images, or click to browse`}
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
