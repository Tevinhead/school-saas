"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { type dayOfWeekEnum } from "@school-saas/validators";
import { trpc } from "@/lib/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  subjectId: z.string().uuid("Select a subject"),
  teacherId: z.string().uuid("Select a teacher"),
  room: z.string().max(50).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TimetableEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  termId: string;
  classId: string;
  periodId: string;
  dayOfWeek: string;
  editingEntry?: {
    id: string;
    subjectId: string;
    teacherId: string;
    room: string | null;
  } | null;
}

export function TimetableEntryDialog({
  open,
  onOpenChange,
  termId,
  classId,
  periodId,
  dayOfWeek,
  editingEntry,
}: TimetableEntryDialogProps) {
  const utils = trpc.useUtils();

  const { data: subjectList } = trpc.academic.listSubjects.useQuery();
  const { data: teacherList } = trpc.timetable.listTeachers.useQuery();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subjectId: "",
      teacherId: "",
      room: "",
    },
  });

  useEffect(() => {
    if (editingEntry) {
      form.reset({
        subjectId: editingEntry.subjectId,
        teacherId: editingEntry.teacherId,
        room: editingEntry.room ?? "",
      });
    } else {
      form.reset({ subjectId: "", teacherId: "", room: "" });
    }
  }, [editingEntry, form]);

  const createMutation = trpc.timetable.createEntry.useMutation({
    onSuccess: () => {
      utils.timetable.listEntries.invalidate({ termId, classId });
      toast.success("Entry created");
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.timetable.updateEntry.useMutation({
    onSuccess: () => {
      utils.timetable.listEntries.invalidate({ termId, classId });
      toast.success("Entry updated");
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data: FormData) => {
    if (editingEntry) {
      updateMutation.mutate({
        id: editingEntry.id,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        room: data.room || null,
      });
    } else {
      createMutation.mutate({
        termId,
        classId,
        periodId,
        dayOfWeek: dayOfWeek as (typeof dayOfWeekEnum)[number],
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        room: data.room || null,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingEntry ? "Edit Timetable Entry" : "Add Timetable Entry"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Subject</Label>
            <Select
              value={form.watch("subjectId")}
              onValueChange={(v) => form.setValue("subjectId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectList?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.subjectId && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.subjectId.message}</p>
            )}
          </div>

          <div>
            <Label>Teacher</Label>
            <Select
              value={form.watch("teacherId")}
              onValueChange={(v) => form.setValue("teacherId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teacherList?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.teacherId && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.teacherId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="room">Room (optional)</Label>
            <Input
              id="room"
              {...form.register("room")}
              placeholder="e.g. A101"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : editingEntry ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
