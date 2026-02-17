"use client";

import { useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GradeEntryRow } from "./grade-entry-row";

interface FormValues {
  entries: Array<{
    studentId: string;
    studentName: string;
    studentNumber: string;
    score: string;
    letterGrade: string;
    comments: string;
  }>;
}

interface GradeEntryProps {
  assessmentId: string;
  classSectionId: string;
  onClose: () => void;
}

export function GradeEntry({ assessmentId, classSectionId, onClose }: GradeEntryProps) {
  const utils = trpc.useUtils();

  const { data: students } = trpc.academic.getStudentsByClassSection.useQuery({
    classSectionId,
  });
  const { data: existingGrades } = trpc.gradebook.getGrades.useQuery({
    assessmentId,
  });

  const submitMutation = trpc.gradebook.submitGrades.useMutation({
    onSuccess: () => {
      utils.gradebook.getGrades.invalidate({ assessmentId });
      onClose();
    },
  });

  const form = useForm<FormValues>({
    defaultValues: { entries: [] },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "entries",
  });

  useEffect(() => {
    if (!students) return;

    const entries = students.map((student) => {
      const existing = existingGrades?.find((g) => g.studentId === student.id);
      return {
        studentId: student.id,
        studentName: `${student.lastName}, ${student.firstName}`,
        studentNumber: student.studentNumber,
        score: existing?.score ?? "",
        letterGrade: existing?.letterGrade ?? "",
        comments: existing?.comments ?? "",
      };
    });

    form.reset({ entries });
  }, [students, existingGrades, form]);

  const handleScoreChange = useCallback(
    (index: number, value: string) => {
      form.setValue(`entries.${index}.score`, value);
    },
    [form]
  );

  const handleLetterGradeChange = useCallback(
    (index: number, value: string) => {
      form.setValue(`entries.${index}.letterGrade`, value);
    },
    [form]
  );

  const handleCommentsChange = useCallback(
    (index: number, value: string) => {
      form.setValue(`entries.${index}.comments`, value);
    },
    [form]
  );

  function onSubmit(values: FormValues) {
    submitMutation.mutate({
      assessmentId,
      grades: values.entries.map((e) => ({
        studentId: e.studentId,
        score: e.score ? parseFloat(e.score) : undefined,
        letterGrade: e.letterGrade || undefined,
        comments: e.comments || undefined,
      })),
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Enter Grades</CardTitle>
        <Button variant="outline" size="sm" onClick={onClose}>
          Back to Assessments
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="w-28">Score</TableHead>
                  <TableHead className="w-20">Grade</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <GradeEntryRow
                    key={field.id}
                    index={index}
                    studentName={form.getValues(`entries.${index}.studentName`)}
                    studentNumber={form.getValues(`entries.${index}.studentNumber`)}
                    score={form.watch(`entries.${index}.score`)}
                    letterGrade={form.watch(`entries.${index}.letterGrade`)}
                    comments={form.watch(`entries.${index}.comments`)}
                    onScoreChange={(v) => handleScoreChange(index, v)}
                    onLetterGradeChange={(v) => handleLetterGradeChange(index, v)}
                    onCommentsChange={(v) => handleCommentsChange(index, v)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Saving..." : "Save Grades"}
            </Button>
          </div>
          {submitMutation.isSuccess && (
            <p className="mt-2 text-sm text-green-600">Grades saved successfully.</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
