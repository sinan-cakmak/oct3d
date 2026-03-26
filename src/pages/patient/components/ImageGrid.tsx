import { useMemo, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeImage } from "@/db";
import type { PatientImage } from "@/db/types";
import { toast } from "sonner";

interface ImageGridProps {
  images: PatientImage[];
  patientId: string;
  onImageClick?: (index: number) => void;
}

export default function ImageGrid({
  images,
  patientId,
  onImageClick,
}: ImageGridProps) {
  const objectUrls = useMemo(() => {
    return images.map((img) => URL.createObjectURL(img.blob));
  }, [images]);

  useEffect(() => {
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [objectUrls]);

  const handleDelete = async (e: React.MouseEvent, image: PatientImage) => {
    e.stopPropagation();
    try {
      await removeImage(image.id);
      toast.success(`Removed ${image.filename}`);
    } catch (err) {
      toast.error("Failed to remove image");
      console.error(err);
    }
  };

  if (images.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No images uploaded yet
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
      {images.map((image, index) => (
        <div
          key={image.id}
          className="group relative cursor-pointer rounded-md overflow-hidden border bg-muted/30 hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={() => onImageClick?.(index)}
        >
          <div className="aspect-square">
            <img
              src={objectUrls[index]}
              alt={image.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="px-1 py-0.5">
            <p className="text-[10px] text-muted-foreground truncate">
              {image.filename}
            </p>
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 size-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => handleDelete(e, image)}
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
