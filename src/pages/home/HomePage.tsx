import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  User,
  ImageIcon,
  Calendar,
} from "lucide-react";

import { db, createPatient, renamePatient, deletePatient } from "@/db";
import type { Patient } from "@/db/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import useTranslation from "@/i18n/useTranslation";

// ---------------------------------------------------------------------------
// Image count hook – returns a map of patientId → count
// ---------------------------------------------------------------------------

function useImageCounts(patientIds: string[] | undefined) {
  return useLiveQuery(async () => {
    if (!patientIds || patientIds.length === 0) return {} as Record<string, number>;
    const counts: Record<string, number> = {};
    for (const pid of patientIds) {
      counts[pid] = await db.images.where("patientId").equals(pid).count();
    }
    return counts;
  }, [patientIds?.join(",")]);
}

function usePatientEyes(patientIds: string[] | undefined) {
  return useLiveQuery(async () => {
    if (!patientIds || patientIds.length === 0) return {} as Record<string, ("OD" | "OS")[]>;
    const result: Record<string, ("OD" | "OS")[]> = {};
    for (const pid of patientIds) {
      const eyes = new Set<"OD" | "OS">();
      await db.images.where("patientId").equals(pid).each((img) => {
        if (img.eye === "OD" || img.eye === "OS") eyes.add(img.eye);
      });
      result[pid] = ["OD", "OS"].filter((e) => eyes.has(e as "OD" | "OS")) as ("OD" | "OS")[];
    }
    return result;
  }, [patientIds?.join(",")]);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" as const },
  }),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ---- Data ----
  const patients = useLiveQuery(
    () => db.patients.orderBy("createdAt").reverse().toArray(),
    [],
  );
  const sortedPatients = patients
    ? [...patients].sort((a, b) => b.updatedAt - a.updatedAt)
    : undefined;

  const imageCounts = useImageCounts(sortedPatients?.map((p) => p.id));
  const patientEyes = usePatientEyes(sortedPatients?.map((p) => p.id));

  // ---- New patient dialog state ----
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEye, setNewEye] = useState<"OD" | "OS">("OD");
  const [creating, setCreating] = useState(false);

  const handleCreate = useCallback(async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const id = await createPatient(trimmed, newEye);
      toast.success(t("toast.patientCreated"));
      setNewOpen(false);
      setNewName("");
      setNewEye("OD");
      navigate(`/patient/${id}`);
    } catch (err) {
      toast.error(t("toast.patientCreateFailed"));
      console.error(err);
    } finally {
      setCreating(false);
    }
  }, [newName, newEye, navigate, t]);

  // ---- Rename dialog state ----
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Patient | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);

  const openRename = useCallback((patient: Patient) => {
    setRenameTarget(patient);
    setRenameName(patient.name);
    setRenameOpen(true);
  }, []);

  const handleRename = useCallback(async () => {
    if (!renameTarget) return;
    const trimmed = renameName.trim();
    if (!trimmed) return;
    setRenaming(true);
    try {
      await renamePatient(renameTarget.id, trimmed);
      toast.success(t("toast.patientRenamed"));
      setRenameOpen(false);
      setRenameTarget(null);
    } catch (err) {
      toast.error(t("toast.patientRenameFailed"));
      console.error(err);
    } finally {
      setRenaming(false);
    }
  }, [renameTarget, renameName, t]);

  // ---- Delete alert dialog state ----
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openDelete = useCallback((patient: Patient) => {
    setDeleteTarget(patient);
    setDeleteOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePatient(deleteTarget.id);
      toast.success(t("toast.patientDeleted"));
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(t("toast.patientDeleteFailed"));
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, t]);

  // ---- Loading state ----
  if (sortedPatients === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{t("home.loading")}</p>
      </div>
    );
  }

  // ---- Render ----
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{t("home.title")}</h1>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {sortedPatients.length}
          </span>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="size-4" />
          {t("home.newPatient")}
        </Button>
      </div>

      {/* Empty state */}
      {sortedPatients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <User className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("home.empty.title")}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("home.empty.description")}
          </p>
          <Button className="mt-6" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" />
            {t("home.newPatient")}
          </Button>
        </div>
      )}

      {/* Patient grid */}
      {sortedPatients.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPatients.map((patient, i) => (
            <motion.div
              key={patient.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card
                className="group cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/patient/${patient.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 truncate">
                    <User className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{patient.name}</span>
                  </CardTitle>
                  <CardAction>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="size-4" />
                          <span className="sr-only">{t("home.actions")}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openRename(patient);
                          }}
                        >
                          <Pencil className="size-4" />
                          {t("home.rename")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDelete(patient);
                          }}
                        >
                          <Trash2 className="size-4" />
                          {t("home.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardAction>
                  <CardDescription className="flex items-center gap-4 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" />
                      {patientEyes?.[patient.id]?.length
                        ? patientEyes[patient.id].join(", ")
                        : patient.eye}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="size-3.5" />
                      {imageCounts?.[patient.id] ?? 0} {t("home.images")}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {t("home.created")} {formatDate(patient.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ---- New Patient Dialog ---- */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("home.dialog.new.title")}</DialogTitle>
            <DialogDescription>
              {t("home.dialog.new.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label
                htmlFor="new-patient-name"
                className="text-sm font-medium text-foreground"
              >
                {t("home.dialog.new.nameLabel")}
              </label>
              <Input
                id="new-patient-name"
                placeholder={t("home.dialog.new.namePlaceholder")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("home.dialog.new.eyeLabel")}</label>
              <div className="flex gap-2">
                {(["OD", "OS"] as const).map((eye) => (
                  <Button
                    key={eye}
                    type="button"
                    variant={newEye === eye ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewEye(eye)}
                    className="flex-1"
                  >
                    <Eye className="size-4" />
                    {eye}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>
              {t("home.dialog.new.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
            >
              {creating ? t("home.dialog.new.creating") : t("home.dialog.new.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Rename Dialog ---- */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("home.dialog.rename.title")}</DialogTitle>
            <DialogDescription>
              {t("home.dialog.rename.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder={t("home.dialog.rename.placeholder")}
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              {t("home.dialog.rename.cancel")}
            </Button>
            <Button
              onClick={handleRename}
              disabled={!renameName.trim() || renaming}
            >
              {renaming ? t("home.dialog.rename.saving") : t("home.dialog.rename.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Alert Dialog ---- */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("home.dialog.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("home.dialog.delete.description")}{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              {t("home.dialog.delete.warning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("home.dialog.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? t("home.dialog.delete.deleting") : t("home.dialog.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
