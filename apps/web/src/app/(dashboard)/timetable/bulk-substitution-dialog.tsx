"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  date: z.string().min(1, "Date is required"),
  originalTeacherId: z.string().uuid("Select the absent teacher"),
  substituteTeacherId: z.string().uuid("Select a substitute teacher"),
  reason: z.string().max(255).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BulkSubstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkSubstitutionDialog({
  open,
  onOpenChange,
}: BulkSubstitutionDialogProps) {
  const utils = trpc.useUtils();
  const { data: teacherList } = trpc.timetable.listTeachers.useQuery();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      originalTeacherId: "",
      substituteTeacherId: "",
      reason: "",
    },
  });

  const bulkMutation = trpc.timetable.bulkCreateSubstitutions.useMutation({
    onSuccess: (result) => {
      utils.timetable.listSubstitutions.invalidate();
      toast.success(`Created ${result.length} substitutions for the day`);
      onOpenChange(false);
      form.reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data: FormData) => {
    bulkMutation.mutate({
      date: new Date(data.date),
      originalTeacherId: data.originalTeacherId,
      substituteTeacherId: data.substituteTeacherId,
      reason: data.reason || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Teacher Absent</DialogTitle>
          <DialogDescription>
            Assign a substitute for all periods of the absent teacher on the selected date.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="bulk-date">Date</Label>
            <Input id="bulk-date" type="date" {...form.register("date")} />
          </div>

          <div>
            <Label>Absent Teacher</Label>
            <Select
              value={form.watch("originalTeacherId")}
              onValueChange={(v) => form.setValue("originalTeacherId", v)}
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
          </div>

          <div>
            <Label>Substitute Teacher</Label>
            <Select
              value={form.watch("substituteTeacherId")}
              onValueChange={(v) => form.setValue("substituteTeacherId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select substitute" />
              </SelectTrigger>
              <SelectContent>
                {teacherList
                  ?.filter((t) => t.id !== form.watch("originalTeacherId"))
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bulk-reason">Reason</Label>
            <Input
              id="bulk-reason"
              {...form.register("reason")}
              placeholder="e.g. Sick leave"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={bulkMutation.isPending}>
              {bulkMutation.isPending ? "Creating..." : "Create Substitutions"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
