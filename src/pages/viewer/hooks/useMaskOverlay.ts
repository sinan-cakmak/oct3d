import { useMemo, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { naturalSort } from "@/utils/naturalSort";
import { computeMaskEdges } from "@/utils/maskEdgeOverlay";

const stripExt = (f: string) => f.replace(/\.[^.]+$/, "");

export function useMaskOverlay(
  patientId: string,
  currentOctFilename: string | undefined,
  eye: "OD" | "OS"
) {
  const patient = useLiveQuery(
    () => db.patients.get(patientId),
    [patientId]
  );

  const masks = useLiveQuery(
    () => db.images.where("[patientId+type+eye]").equals([patientId, "mask", eye]).toArray(),
    [patientId, eye]
  );

  const sortedMasks = useMemo(
    () => (masks ? naturalSort(masks, (m) => m.filename) : []),
    [masks]
  );

  // Match by filename (without extension)
  const matchingMask = useMemo(() => {
    if (!currentOctFilename || sortedMasks.length === 0) return undefined;
    const octBase = stripExt(currentOctFilename);
    return sortedMasks.find((m) => stripExt(m.filename) === octBase);
  }, [currentOctFilename, sortedMasks]);

  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);

  const labelConfig = patient?.labelConfig ?? {};

  // Recompute edge overlay when mask or label config changes
  useEffect(() => {
    if (!matchingMask || Object.keys(labelConfig).length === 0) {
      setOverlayUrl(null);
      return;
    }

    let cancelled = false;
    setComputing(true);

    computeMaskEdges(matchingMask.blob, labelConfig).then((url) => {
      if (!cancelled) {
        setOverlayUrl(url);
        setComputing(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingMask?.id, JSON.stringify(labelConfig)]);

  return {
    overlayUrl,
    computing,
    hasMask: !!matchingMask,
    labelConfig,
  };
}
