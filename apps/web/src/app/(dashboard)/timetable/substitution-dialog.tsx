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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  timetableEntryId: z.string().uuid(),
  date: z.string().min(1, "Date is required"),
  substituteTeacherId: z.string().uuid("Select a substitute teacher"),
  reason: z.string().max(255).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SubstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string;
  date?: string;
}

export function SubstitutionDialog({
  open,
  onOpenChange,
  entryId,
  date,
}: SubstitutionDialogProps) {
  const utils = trpc.useUtils();
  const { data: teacherList } = trpc.timetable.listTeachers.useQuery();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timetableEntryId: entryId,
      date: date ?? new Date().toISOString().split("T")[0],
      substituteTeacherId: "",
      reason: "",
      notes: "",
    },
  });

  const createMutation = trpc.timetable.createSubstitution.useMutation({
    onSuccess: () => {
      utils.timetable.listSubstitutions.invalidate();
      toast.success("Substitution created");
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      timetableEntryId: data.timetableEntryId,
      date: new Date(data.date),
      substituteTeacherId: data.substituteTeacherId,
      reason: data.reason || undefined,
      notes: data.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Substitute Teacher</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...form.register("date")} />
          </div>

          <div>
            <Label>Substitute Teacher</Label>
            <Select
              value={form.watch("substituteTeacherId")}
              onValueChange={(v) => form.setValue("substituteTeacherId", v)}
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
            {form.formState.errors.substituteTeacherId && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.substituteTeacherId.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              {...form.register("reason")}
              placeholder="e.g. Sick leave, conference"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
