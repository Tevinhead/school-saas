"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Copy, Trash2, Printer } from "lucide-react";

interface TimetableToolbarProps {
  termId: string;
  classId: string;
  terms: { id: string; name: string }[];
}

export function TimetableToolbar({ termId, classId, terms }: TimetableToolbarProps) {
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [targetTermId, setTargetTermId] = useState("");

  const utils = trpc.useUtils();

  const duplicateMutation = trpc.timetable.duplicateTimetable.useMutation({
    onSuccess: (result) => {
      toast.success(`Duplicated ${result.duplicatedCount} entries`);
      setDuplicateOpen(false);
      utils.timetable.listEntries.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const clearMutation = trpc.timetable.clearClassTimetable.useMutation({
    onSuccess: (result) => {
      toast.success(`Cleared ${result.deletedCount} entries`);
      setClearOpen(false);
      utils.timetable.listEntries.invalidate({ termId, classId });
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <>
      <div className="flex items-center gap-2 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDuplicateOpen(true)}
        >
          <Copy className="mr-2 h-4 w-4" />
          Duplicate to Term
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setClearOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Timetable
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Timetable</DialogTitle>
            <DialogDescription>
              Copy all timetable entries from the current term to another term.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Select value={targetTermId} onValueChange={setTargetTermId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target term" />
              </SelectTrigger>
              <SelectContent>
                {terms
                  .filter((t) => t.id !== termId)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                duplicateMutation.mutate({
                  fromTermId: termId,
                  toTermId: targetTermId,
                  classId,
                })
              }
              disabled={!targetTermId || duplicateMutation.isPending}
            >
              {duplicateMutation.isPending ? "Duplicating..." : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Dialog */}
      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Timetable</DialogTitle>
            <DialogDescription>
              This will remove all timetable entries for this class in the selected term. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => clearMutation.mutate({ termId, classId })}
              disabled={clearMutation.isPending}
            >
              {clearMutation.isPending ? "Clearing..." : "Clear All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
