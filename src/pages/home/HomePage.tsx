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
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" },
  }),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomePage() {
  const navigate = useNavigate();

  // ---- Data ----
  const patients = useLiveQuery(
    () => db.patients.orderBy("createdAt").reverse().toArray(),
    [],
  );
  // Sort by updatedAt descending after fetching (createdAt index used for broad ordering)
  const sortedPatients = patients
    ? [...patients].sort((a, b) => b.updatedAt - a.updatedAt)
    : undefined;

  const imageCounts = useImageCounts(sortedPatients?.map((p) => p.id));

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
      toast.success("Patient created");
      setNewOpen(false);
      setNewName("");
      setNewEye("OD");
      navigate(`/patient/${id}`);
    } catch (err) {
      toast.error("Failed to create patient");
      console.error(err);
    } finally {
      setCreating(false);
    }
  }, [newName, newEye, navigate]);

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
      toast.success("Patient renamed");
      setRenameOpen(false);
      setRenameTarget(null);
    } catch (err) {
      toast.error("Failed to rename patient");
      console.error(err);
    } finally {
      setRenaming(false);
    }
  }, [renameTarget, renameName]);

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
      toast.success("Patient deleted");
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete patient");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  // ---- Loading state ----
  if (sortedPatients === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // ---- Render ----
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {sortedPatients.length}
          </span>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="size-4" />
          New Patient
        </Button>
      </div>

      {/* Empty state */}
      {sortedPatients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <User className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            No patients yet
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first patient to start uploading and viewing OCT scans.
          </p>
          <Button className="mt-6" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" />
            New Patient
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
                          <span className="sr-only">Actions</span>
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
                          Rename
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
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardAction>
                  <CardDescription className="flex items-center gap-4 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" />
                      {patient.eye}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="size-3.5" />
                      {imageCounts?.[patient.id] ?? 0} images
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    Created {formatDate(patient.createdAt)}
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
            <DialogTitle>New Patient</DialogTitle>
            <DialogDescription>
              Enter a name and select the eye for this patient.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label
                htmlFor="new-patient-name"
                className="text-sm font-medium text-foreground"
              >
                Name
              </label>
              <Input
                id="new-patient-name"
                placeholder="e.g. John Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Eye</label>
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
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Rename Dialog ---- */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Patient</DialogTitle>
            <DialogDescription>
              Enter a new name for this patient.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Patient name"
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
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!renameName.trim() || renaming}
            >
              {renaming ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Alert Dialog ---- */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              ? This will permanently remove the patient and all associated
              images. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
