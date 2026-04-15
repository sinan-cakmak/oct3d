import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";
import { addImages } from "@/db";
import { toast } from "sonner";
import useTranslation from "@/i18n/useTranslation";

interface ImageUploadZoneProps {
  patientId: string;
  type: "oct" | "mask";
  eye?: "OD" | "OS";
  hasImages?: boolean;
  onUploadComplete?: () => void;
}

export default function ImageUploadZone({
  patientId,
  type,
  eye = "OD",
  hasImages = false,
  onUploadComplete,
}: ImageUploadZoneProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      try {
        await addImages(patientId, acceptedFiles, type, eye);
        toast.success(t("toast.uploadedImages", { count: acceptedFiles.length }));
        onUploadComplete?.();
      } catch (err) {
        toast.error(t("toast.uploadImagesFailed"));
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
      className={`border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
        hasImages ? "p-3" : "p-8"
      } ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="size-4 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">{t("upload.uploading")}</p>
        </div>
      ) : hasImages ? (
        <div className="flex items-center justify-center gap-2">
          <Upload className="size-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? t("upload.dropFiles") : type === "oct" ? t("upload.addMoreOct") : t("upload.addMoreMasks")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? t("upload.dropFiles")
              : type === "oct" ? t("upload.dragDropOct") : t("upload.dragDropMasks")}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {t("upload.fileTypes")}
          </p>
        </div>
      )}
    </div>
  );
}
