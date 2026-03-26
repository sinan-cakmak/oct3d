import { useState, useCallback } from "react";

const DEFAULT_ZOOM = 1.0;

let persistedZoomLevel: number | null = null;

export function useZoomPan() {
  const [zoomLevel, _setZoomLevel] = useState(persistedZoomLevel ?? DEFAULT_ZOOM);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });

  const setZoomLevel: React.Dispatch<React.SetStateAction<number>> = useCallback((value) => {
    _setZoomLevel((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      persistedZoomLevel = next;
      return next;
    });
  }, []);

  const handleZoomIn = () => setZoomLevel((p) => Math.min(p + 0.25, 5));
  const handleZoomOut = () => setZoomLevel((p) => Math.max(p - 0.25, 0.25));
  const handleFitToScreen = () => {
    setZoomLevel(DEFAULT_ZOOM);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((p) => Math.max(0.25, Math.min(5, p + delta)));
  };

  const handlePanStart = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setPanStartPos({ ...imagePosition });
    e.preventDefault();
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setImagePosition({
      x: panStartPos.x + (e.clientX - panStart.x),
      y: panStartPos.y + (e.clientY - panStart.y),
    });
  };

  const handlePanEnd = () => setIsPanning(false);

  return {
    zoomLevel,
    imagePosition,
    isPanning,
    handleZoomIn,
    handleZoomOut,
    handleFitToScreen,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  };
}
