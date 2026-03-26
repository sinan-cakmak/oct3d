import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { naturalSort } from "@/utils/naturalSort";

export function useImageNavigation(
  patientId: string,
  currentIndex: number,
  type: "oct" | "mask" = "oct",
  eye: "OD" | "OS" = "OD"
) {
  const navigate = useNavigate();

  const images = useLiveQuery(
    () => db.images.where("[patientId+type+eye]").equals([patientId, type, eye]).toArray(),
    [patientId, type, eye]
  );

  const sortedImages = useMemo(
    () => (images ? naturalSort(images, (img) => img.filename) : []),
    [images]
  );

  const currentImage = sortedImages[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < sortedImages.length - 1;
  const total = sortedImages.length;

  const navigateTo = (index: number) => {
    navigate(`/patient/${patientId}/view/${eye}/${index}`);
  };

  const goToPrev = () => { if (hasPrev) navigateTo(currentIndex - 1); };
  const goToNext = () => { if (hasNext) navigateTo(currentIndex + 1); };

  return {
    sortedImages,
    currentImage,
    currentIndex,
    hasPrev,
    hasNext,
    total,
    goToPrev,
    goToNext,
    navigateTo,
  };
}
