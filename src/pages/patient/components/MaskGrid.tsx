import { useMemo, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeImage } from "@/db";
import type { PatientImage } from "@/db/types";
import { toast } from "sonner";

interface MaskGridProps {
  images: PatientImage[];
  patientId: string;
}

/**
 * Draw a brightened version of a mask to a canvas.
 * Mask pixel values are 0-5, so multiply by 51 for visibility.
 */
function brightenMask(
  canvas: HTMLCanvasElement,
  blob: Blob
): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("No canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const val = data[i]; // R channel (grayscale, R=G=B)
        const brightened = Math.min(val * 51, 255);
        data[i] = brightened;
        data[i + 1] = brightened;
        data[i + 2] = brightened;
        // alpha stays the same
      }
      ctx.putImageData(imageData, 0, 0);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load mask image"));
    };
    img.src = url;
  });
}

function MaskThumbnail({
  image,
  onDelete,
}: {
  image: PatientImage;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderMask = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      await brightenMask(canvasRef.current, image.blob);
    } catch (err) {
      console.error("Failed to render mask thumbnail:", err);
    }
  }, [image.blob]);

  useEffect(() => {
    renderMask();
  }, [renderMask]);

  return (
    <div className="group relative rounded-md overflow-hidden border bg-muted/30 hover:ring-2 hover:ring-primary/50 transition-all">
      <div className="aspect-square bg-black">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
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
        onClick={onDelete}
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}

export default function MaskGrid({ images, patientId }: MaskGridProps) {
  const handleDelete = async (e: React.MouseEvent, image: PatientImage) => {
    e.stopPropagation();
    try {
      await removeImage(image.id);
      toast.success(`Removed ${image.filename}`);
    } catch (err) {
      toast.error("Failed to remove mask");
      console.error(err);
    }
  };

  if (images.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No masks uploaded yet
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
      {images.map((image) => (
        <MaskThumbnail
          key={image.id}
          image={image}
          onDelete={(e) => handleDelete(e, image)}
        />
      ))}
    </div>
  );
}
