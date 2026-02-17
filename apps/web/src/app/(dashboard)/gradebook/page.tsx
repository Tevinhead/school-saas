"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import { getAssessmentColumns, type AssessmentRow } from "./columns";
import { AssessmentDialog } from "./assessment-dialog";
import { GradeEntry } from "./grade-entry";
import { Plus } from "lucide-react";

export default function GradebookPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentRow | null>(null);
  const [gradingAssessmentId, setGradingAssessmentId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: classList } = trpc.academic.listClasses.useQuery();
  const { data: sections } = trpc.academic.listClassSections.useQuery(
    { classId: selectedClassId },
    { enabled: !!selectedClassId }
  );
  const { data: assessments } = trpc.gradebook.listAssessments.useQuery(
    { classSectionId: selectedSectionId },
    { enabled: !!selectedSectionId }
  );

  const deleteMutation = trpc.gradebook.deleteAssessment.useMutation({
    onSuccess: () =>
      utils.gradebook.listAssessments.invalidate({ classSectionId: selectedSectionId }),
  });

  const columns = useMemo(
    () =>
      getAssessmentColumns({
        onEdit: (row) => {
          setEditingAssessment(row);
          setDialogOpen(true);
        },
        onDelete: (id) => deleteMutation.mutate({ id }),
        onGrade: (id) => setGradingAssessmentId(id),
      }),
    [deleteMutation]
  );

  if (gradingAssessmentId && selectedSectionId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gradebook</h1>
          <p className="text-muted-foreground">Enter grades for students.</p>
        </div>
        <GradeEntry
          assessmentId={gradingAssessmentId}
          classSectionId={selectedSectionId}
          onClose={() => setGradingAssessmentId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gradebook</h1>
        <p className="text-muted-foreground">
          Manage assessments and enter grades by class section.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <label className="mb-1 block text-sm font-medium">Class</label>
          <Select
            value={selectedClassId}
            onValueChange={(v) => {
              setSelectedClassId(v);
              setSelectedSectionId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classList?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <label className="mb-1 block text-sm font-medium">Section</label>
          <Select
            value={selectedSectionId}
            onValueChange={setSelectedSectionId}
            disabled={!selectedClassId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {sections?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSectionId && (
          <Button
            onClick={() => {
              setEditingAssessment(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Assessment
          </Button>
        )}
      </div>

      {selectedSectionId && assessments && (
        <DataTable columns={columns} data={assessments as AssessmentRow[]} />
      )}

      {selectedSectionId && (
        <AssessmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          classSectionId={selectedSectionId}
          editingAssessment={editingAssessment}
        />
      )}
    </div>
  );
}
