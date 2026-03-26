import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { updateLabelConfig } from "@/db";
import { DEFAULT_LABEL_COLORS } from "@/utils/colorPalette";
import type { Patient } from "@/db/types";

interface LabelConfigPanelProps {
  patient: Patient;
}

export default function LabelConfigPanel({ patient }: LabelConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(patient.labelConfig);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from patient prop when it changes externally
  useEffect(() => {
    setLocalConfig(patient.labelConfig);
  }, [patient.labelConfig]);

  const persistConfig = useCallback(
    (config: typeof localConfig) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        updateLabelConfig(patient.id, config);
      }, 300);
    },
    [patient.id]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const sortedLabelIds = Object.keys(localConfig)
    .map(Number)
    .sort((a, b) => a - b);

  const handleNameChange = (labelId: number, name: string) => {
    const updated = {
      ...localConfig,
      [labelId]: { ...localConfig[labelId], name },
    };
    setLocalConfig(updated);
    persistConfig(updated);
  };

  const handleColorCycle = (labelId: number) => {
    const currentColor = localConfig[labelId].color;
    // Find current color index in palette
    const currentIndex = DEFAULT_LABEL_COLORS.findIndex(
      (c) =>
        c[0] === currentColor[0] &&
        c[1] === currentColor[1] &&
        c[2] === currentColor[2]
    );
    const nextIndex = (currentIndex + 1) % DEFAULT_LABEL_COLORS.length;
    const nextColor = DEFAULT_LABEL_COLORS[nextIndex];

    const updated = {
      ...localConfig,
      [labelId]: { ...localConfig[labelId], color: nextColor },
    };
    setLocalConfig(updated);
    persistConfig(updated);
  };

  if (sortedLabelIds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Label Configuration</h3>
      <div className="space-y-2">
        {sortedLabelIds.map((labelId) => {
          const label = localConfig[labelId];
          const [r, g, b] = label.color;
          return (
            <div key={labelId} className="flex items-center gap-2">
              <span className="flex items-center justify-center size-6 rounded-full bg-muted text-[10px] font-bold shrink-0">
                {labelId}
              </span>
              <button
                type="button"
                onClick={() => handleColorCycle(labelId)}
                className="size-6 rounded shrink-0 border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                title="Click to cycle color"
              />
              <Input
                className="h-7 text-xs"
                value={label.name}
                onChange={(e) => handleNameChange(labelId, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
