import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Box, Image, Layers, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { db, renamePatient, updatePatientEye } from "@/db";
import { naturalSort } from "@/utils/naturalSort";
import ImageUploadZone from "./components/ImageUploadZone";
import MaskUploadZone from "./components/MaskUploadZone";
import ImageGrid from "./components/ImageGrid";
import MaskGrid from "./components/MaskGrid";
import LabelConfigPanel from "./components/LabelConfigPanel";
import useTranslation from "@/i18n/useTranslation";

export default function PatientDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"oct" | "mask">("oct");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const patient = useLiveQuery(() => {
    if (!id) return undefined;
    return db.patients.get(id);
  }, [id]);

  const selectedEye = patient?.eye ?? "OD";

  const octImages = useLiveQuery(() => {
    if (!id) return [];
    return db.images.where("[patientId+type+eye]").equals([id, "oct", selectedEye]).toArray();
  }, [id, selectedEye]);

  const maskImages = useLiveQuery(() => {
    if (!id) return [];
    return db.images.where("[patientId+type+eye]").equals([id, "mask", selectedEye]).toArray();
  }, [id, selectedEye]);

  if (!id) return null;

  // While loading
  if (patient === undefined || octImages === undefined || maskImages === undefined) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{t("patient.loading")}</p>
      </div>
    );
  }

  // Patient not found
  if (patient === null) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{t("patient.notFound")}</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
          <ArrowLeft className="size-4" />
          {t("patient.backToPatients")}
        </Button>
      </div>
    );
  }

  const sortedOctImages = naturalSort(octImages ?? [], (img) => img.filename);
  const sortedMaskImages = naturalSort(maskImages ?? [], (img) => img.filename);
  const hasMasks = sortedMaskImages.length > 0;
  const hasLabels = Object.keys(patient.labelConfig).length > 0;

  const startEditingName = () => {
    setNameValue(patient.name);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const saveName = async () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== patient.name) {
      await renamePatient(id, trimmed);
    }
    setEditingName(false);
  };

  const handleEyeToggle = () => {
    const newEye = patient.eye === "OD" ? "OS" : "OD";
    updatePatientEye(id, newEye);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          title={t("patient.backToPatients")}
        >
          <ArrowLeft className="size-5" />
        </Button>

        {editingName ? (
          <Input
            ref={nameInputRef}
            className="h-9 w-60 text-lg font-bold"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") setEditingName(false);
            }}
          />
        ) : (
          <button
            type="button"
            className="flex items-center gap-2 text-2xl font-bold hover:text-primary transition-colors cursor-pointer"
            onClick={startEditingName}
          >
            {patient.name}
            <Pencil className="size-4 text-muted-foreground" />
          </button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="font-mono text-xs"
          onClick={handleEyeToggle}
          title={t("patient.toggleEye")}
        >
          {patient.eye}
        </Button>

        <div className="flex-1" />

        <Button
          variant="default"
          size="sm"
          onClick={() => navigate(`/patient/${id}/3d/${selectedEye}`)}
          disabled={!hasMasks}
          title={hasMasks ? t("patient.viewIn3D") : t("patient.uploadMasksFirst")}
        >
          <Box className="size-4" />
          {t("patient.viewIn3D")}
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* Tab switcher */}
          <div className="flex gap-1 mb-4">
            <Button
              variant={activeTab === "oct" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("oct")}
            >
              <Image className="size-4" />
              {t("patient.octImages")}
              {sortedOctImages.length > 0 && (
                <span className="ml-1 text-xs opacity-70">
                  ({sortedOctImages.length})
                </span>
              )}
            </Button>
            <Button
              variant={activeTab === "mask" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("mask")}
            >
              <Layers className="size-4" />
              {t("patient.masks")}
              {sortedMaskImages.length > 0 && (
                <span className="ml-1 text-xs opacity-70">
                  ({sortedMaskImages.length})
                </span>
              )}
            </Button>
          </div>

          {/* Tab content */}
          {activeTab === "oct" ? (
            <div className="space-y-4">
              <ImageGrid
                images={sortedOctImages}
                patientId={id}
                onImageClick={(index) =>
                  navigate(`/patient/${id}/view/${selectedEye}/${index}`)
                }
              />
              <ImageUploadZone patientId={id} type="oct" eye={selectedEye} hasImages={sortedOctImages.length > 0} />
            </div>
          ) : (
            <div className="space-y-4">
              <MaskGrid images={sortedMaskImages} patientId={id} />
              <MaskUploadZone patientId={id} patient={patient} eye={selectedEye} hasImages={sortedMaskImages.length > 0} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        {hasMasks && hasLabels && (
          <div className="w-full lg:w-80 shrink-0">
            <Card>
              <CardContent>
                <LabelConfigPanel patient={patient} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
