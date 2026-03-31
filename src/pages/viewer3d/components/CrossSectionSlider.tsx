import { useRef, useCallback, useState } from "react";

interface CrossSectionSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
}

/**
 * Dual-thumb range slider with draggable range bar.
 * - Drag left thumb: adjust left boundary
 * - Drag right thumb: adjust right boundary
 * - Drag the bar between thumbs: slide the whole range
 */
export default function CrossSectionSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
}: CrossSectionSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"left" | "right" | "range" | null>(null);
  const dragStartRef = useRef({ x: 0, value: [0, 0] as [number, number] });

  const range = max - min;
  const leftPct = ((value[0] - min) / range) * 100;
  const rightPct = ((value[1] - min) / range) * 100;

  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const snap = (v: number) => Math.round(v / step) * step;

  const getValueFromX = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = (clientX - rect.left) / rect.width;
      return snap(clamp(min + pct * range));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, range, step]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, target: "left" | "right" | "range") => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(target);
      dragStartRef.current = { x: e.clientX, value: [...value] as [number, number] };
    },
    [value]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !trackRef.current) return;

      if (dragging === "left") {
        const v = getValueFromX(e.clientX);
        onChange([Math.min(v, value[1] - step), value[1]]);
      } else if (dragging === "right") {
        const v = getValueFromX(e.clientX);
        onChange([value[0], Math.max(v, value[0] + step)]);
      } else if (dragging === "range") {
        const rect = trackRef.current.getBoundingClientRect();
        const dx = e.clientX - dragStartRef.current.x;
        const dVal = (dx / rect.width) * range;
        const origLeft = dragStartRef.current.value[0];
        const origRight = dragStartRef.current.value[1];
        const gap = origRight - origLeft;

        let newLeft = snap(origLeft + dVal);
        let newRight = newLeft + gap;

        // Clamp both ends
        if (newLeft < min) {
          newLeft = min;
          newRight = min + gap;
        }
        if (newRight > max) {
          newRight = max;
          newLeft = max - gap;
        }

        onChange([clamp(newLeft), clamp(newRight)]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragging, value, getValueFromX, onChange, range, step, min, max]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div
      ref={trackRef}
      className="relative h-8 flex items-center select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Track background */}
      <div className="absolute h-2 w-full rounded-full bg-secondary" />

      {/* Active range bar (draggable) */}
      <div
        className="absolute h-2 rounded-full bg-primary cursor-grab active:cursor-grabbing"
        style={{
          left: `${leftPct}%`,
          width: `${rightPct - leftPct}%`,
        }}
        onPointerDown={(e) => handlePointerDown(e, "range")}
      />

      {/* Left thumb */}
      <div
        className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background cursor-ew-resize z-10 -translate-x-1/2"
        style={{ left: `${leftPct}%` }}
        onPointerDown={(e) => handlePointerDown(e, "left")}
      />

      {/* Right thumb */}
      <div
        className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background cursor-ew-resize z-10 -translate-x-1/2"
        style={{ left: `${rightPct}%` }}
        onPointerDown={(e) => handlePointerDown(e, "right")}
      />
    </div>
  );
}
