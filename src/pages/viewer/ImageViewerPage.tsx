import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X, ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { useZoomPan } from "./hooks/useZoomPan";
import { useImageNavigation } from "./hooks/useImageNavigation";
import { useMaskOverlay } from "./hooks/useMaskOverlay";

const THICKNESS_KEY = "oct3d-edge-thickness";

export default function ImageViewerPage() {
  const { id: patientId, eye, imageIndex: indexStr } = useParams();
  const navigate = useNavigate();
  const currentIndex = parseInt(indexStr || "0", 10);
  const currentEye = (eye as "OD" | "OS") || "OD";

  const [showOverlay, setShowOverlay] = useState(true);
  const [thickness, setThickness] = useState(() => {
    const saved = localStorage.getItem(THICKNESS_KEY);
    return saved ? Math.max(1, Math.min(5, parseInt(saved, 10))) : 1;
  });

  const {
    sortedImages,
    currentImage,
    hasPrev,
    hasNext,
    total,
    goToPrev,
    goToNext,
    navigateTo,
  } = useImageNavigation(patientId!, currentIndex, "oct", currentEye);

  const {
    zoomLevel,
    imagePosition,
    isPanning: _isPanning,
    handleZoomIn,
    handleZoomOut,
    handleFitToScreen,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  } = useZoomPan();

  const { overlayUrl, hasMask, labelConfig } = useMaskOverlay(
    patientId!,
    currentImage?.filename,
    currentEye,
    thickness
  );

  // Visible labels (non-zero, have config)
  const visibleLabels = useMemo(
    () =>
      Object.entries(labelConfig)
        .map(([id, cfg]) => ({ id: Number(id), ...cfg }))
        .filter((l) => l.id !== 0)
        .sort((a, b) => a.id - b.id),
    [labelConfig]
  );

  // Create object URL for current image
  const imageUrl = useMemo(() => {
    if (!currentImage?.blob) return null;
    return URL.createObjectURL(currentImage.blob);
  }, [currentImage]);

  // Cleanup object URL
  useEffect(() => {
    return () => { if (imageUrl) URL.revokeObjectURL(imageUrl); };
  }, [imageUrl]);

  // Thumbnail object URLs
  const thumbnailUrls = useMemo(() => {
    return sortedImages.map((img) => URL.createObjectURL(img.blob));
  }, [sortedImages]);

  useEffect(() => {
    return () => thumbnailUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [thumbnailUrls]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept arrows when the slider thumb has focus
      if ((e.target as HTMLElement)?.getAttribute("role") === "slider") return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goToPrev(); }
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goToNext(); }
      else if (e.key === "Escape") navigate(`/patient/${patientId}`);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext, navigate, patientId]);

  if (!currentImage || !imageUrl) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 text-white hover:bg-white/10"
        onClick={() => navigate(`/patient/${patientId}`)}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Filename */}
      <div className="absolute top-4 left-4 z-50 text-white/80 text-sm font-mono">
        {currentImage.filename}
      </div>

      {/* Main image area */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onWheel={handleWheel}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoomLevel})`,
            transformOrigin: "center center",
            lineHeight: 0,
          }}
        >
          <img
            src={imageUrl}
            alt={currentImage.filename}
            className="max-w-none select-none block"
            draggable={false}
          />
          {showOverlay && overlayUrl && (
            <img
              src={overlayUrl}
              alt="mask edges"
              className="absolute inset-0 w-full h-full select-none pointer-events-none"
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* Zoom controls + overlay toggle — bottom left */}
      <div className="absolute bottom-20 left-4 z-50 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg p-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-white/80 text-xs w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={handleFitToScreen}>
          <Maximize className="h-4 w-4" />
        </Button>

        {hasMask && visibleLabels.length > 0 && (
          <>
            <div className="w-px h-5 bg-white/20 mx-0.5" />
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 hover:bg-white/10 ${showOverlay ? "text-white" : "text-white/30"}`}
              onClick={() => setShowOverlay((v) => !v)}
              title={showOverlay ? "Hide edges" : "Show edges"}
            >
              <Layers className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Navigation — bottom center */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg p-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={goToPrev} disabled={!hasPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-white/80 text-sm px-2">{currentIndex + 1} / {total}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={goToNext} disabled={!hasNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend — bottom right (above thumbnail strip) */}
      {hasMask && showOverlay && visibleLabels.length > 0 && (
        <div className="absolute bottom-20 right-4 z-50 bg-black/60 backdrop-blur-sm rounded-lg p-3 space-y-2 min-w-[150px]">
          {/* Thickness slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-[10px] uppercase tracking-wide">Edge width</span>
              <span className="text-white/80 text-[10px] font-mono">{thickness}px</span>
            </div>
            <Slider
              value={[thickness]}
              onValueChange={(v) => {
                setThickness(v[0]);
                localStorage.setItem(THICKNESS_KEY, String(v[0]));
              }}
              onValueCommit={() => (document.activeElement as HTMLElement)?.blur()}
              min={1}
              max={5}
              step={1}
              className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-0"
            />
          </div>
          <div className="h-px bg-white/15" />
          {/* Label swatches */}
          {visibleLabels.map((label) => (
            <div key={label.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: `rgb(${label.color[0]},${label.color[1]},${label.color[2]})` }}
              />
              <span className="text-white/80 text-xs">{label.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Thumbnail strip — bottom */}
      <div className="h-16 bg-black/80 backdrop-blur-sm border-t border-white/10 flex items-center gap-1 px-4 overflow-x-auto">
        {sortedImages.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => navigateTo(idx)}
            className={`h-12 w-12 shrink-0 rounded border-2 overflow-hidden transition-all ${
              idx === currentIndex
                ? "border-white ring-1 ring-white/50"
                : "border-transparent opacity-50 hover:opacity-80"
            }`}
          >
            <img
              src={thumbnailUrls[idx]}
              alt={img.filename}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
