"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const statusOptions = ["present", "absent", "late", "excused"] as const;

const formSchema = z.object({
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      studentName: z.string(),
      status: z.enum(statusOptions),
      notes: z.string(),
    })
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface AttendanceMarkingFormProps {
  classSectionId: string;
  date: Date;
}

export function AttendanceMarkingForm({ classSectionId, date }: AttendanceMarkingFormProps) {
  const utils = trpc.useUtils();

  const { data: students, isLoading: loadingStudents } =
    trpc.academic.getStudentsByClassSection.useQuery({ classSectionId });

  const { data: existingRecords, isLoading: loadingRecords } =
    trpc.attendance.getByClassAndDate.useQuery({ classSectionId, date });

  const batchMark = trpc.attendance.batchMark.useMutation({
    onSuccess: () => {
      utils.attendance.getByClassAndDate.invalidate({ classSectionId, date });
      utils.attendance.dailySummary.invalidate({ date });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { records: [] },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "records",
  });

  // Populate form when students and existing records load
  useEffect(() => {
    if (!students) return;

    const records = students.map((student) => {
      const existing = existingRecords?.find((r) => r.studentId === student.id);
      return {
        studentId: student.id,
        studentName: `${student.lastName}, ${student.firstName}`,
        status: (existing?.status as (typeof statusOptions)[number]) ?? "present",
        notes: existing?.notes ?? "",
      };
    });

    form.reset({ records });
  }, [students, existingRecords, form]);

  function onSubmit(values: FormValues) {
    batchMark.mutate({
      classSectionId,
      date,
      records: values.records.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        notes: r.notes || undefined,
      })),
    });
  }

  if (loadingStudents || loadingRecords) {
    return <div className="text-muted-foreground">Loading students...</div>;
  }

  if (!students?.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No students enrolled in this class section.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="w-40">Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {form.getValues(`records.${index}.studentName`)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={form.watch(`records.${index}.status`)}
                        onValueChange={(value) =>
                          form.setValue(`records.${index}.status`, value as (typeof statusOptions)[number])
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        {...form.register(`records.${index}.notes`)}
                        placeholder="Optional notes"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={batchMark.isPending}>
              {batchMark.isPending ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
          {batchMark.isSuccess && (
            <p className="mt-2 text-sm text-green-600">Attendance saved successfully.</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
