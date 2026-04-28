import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { updatePatientSpacings } from "@/db";
import {
  type Patient,
  DEFAULT_X_SPACING,
  DEFAULT_Y_SPACING,
  DEFAULT_Z_SPACING,
} from "@/db/types";
import useTranslation from "@/i18n/useTranslation";

interface SpacingsPanelProps {
  patient: Patient;
}

type Axis = "x" | "y" | "z";

const FIELDS = [
  { axis: "x", key: "xSpacing", default: DEFAULT_X_SPACING, unitKey: "spacings.unitPerPixel" },
  { axis: "y", key: "ySpacing", default: DEFAULT_Y_SPACING, unitKey: "spacings.unitPerPixel" },
  { axis: "z", key: "zSpacing", default: DEFAULT_Z_SPACING, unitKey: "spacings.unitPerSlice" },
] as const satisfies ReadonlyArray<{
  axis: Axis;
  key: keyof Pick<Patient, "xSpacing" | "ySpacing" | "zSpacing">;
  default: number;
  unitKey: "spacings.unitPerPixel" | "spacings.unitPerSlice";
}>;

export default function SpacingsPanel({ patient }: SpacingsPanelProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState({
    x: String(patient.xSpacing ?? DEFAULT_X_SPACING),
    y: String(patient.ySpacing ?? DEFAULT_Y_SPACING),
    z: String(patient.zSpacing ?? DEFAULT_Z_SPACING),
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft({
      x: String(patient.xSpacing ?? DEFAULT_X_SPACING),
      y: String(patient.ySpacing ?? DEFAULT_Y_SPACING),
      z: String(patient.zSpacing ?? DEFAULT_Z_SPACING),
    });
  }, [patient.xSpacing, patient.ySpacing, patient.zSpacing]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const persist = useCallback(
    (axis: Axis, value: string) => {
      const num = Number(value);
      if (!Number.isFinite(num) || num <= 0) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const key = ({ x: "xSpacing", y: "ySpacing", z: "zSpacing" } as const)[axis];
        updatePatientSpacings(patient.id, { [key]: num });
      }, 400);
    },
    [patient.id]
  );

  const handleChange = (axis: Axis, value: string) => {
    setDraft((prev) => ({ ...prev, [axis]: value }));
    persist(axis, value);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{t("spacings.title")}</h3>
      <div className="space-y-2">
        {FIELDS.map((f) => (
          <div key={f.axis} className="flex items-center gap-2">
            <span className="flex items-center justify-center size-6 rounded-full bg-muted text-[10px] font-bold uppercase shrink-0">
              {f.axis}
            </span>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="h-7 text-xs"
              value={draft[f.axis]}
              onChange={(e) => handleChange(f.axis, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {t(f.unitKey)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">
        {t("spacings.help")}
      </p>
    </div>
  );
}
