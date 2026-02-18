"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { createPeriodSchema } from "@school-saas/validators";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPeriod?: {
    id: string;
    name: string;
    shortName: string;
    sortOrder: number;
    startTime: string;
    endTime: string;
    isBreak: boolean;
  } | null;
}

interface PeriodFormData {
  name: string;
  shortName: string;
  sortOrder: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export function PeriodDialog({ open, onOpenChange, editingPeriod }: PeriodDialogProps) {
  const utils = trpc.useUtils();

  const form = useForm<PeriodFormData>({
    resolver: zodResolver(createPeriodSchema),
    defaultValues: {
      name: "",
      shortName: "",
      sortOrder: 0,
      startTime: "08:00",
      endTime: "08:45",
      isBreak: false,
    },
  });

  useEffect(() => {
    if (editingPeriod) {
      form.reset({
        name: editingPeriod.name,
        shortName: editingPeriod.shortName,
        sortOrder: editingPeriod.sortOrder,
        startTime: editingPeriod.startTime,
        endTime: editingPeriod.endTime,
        isBreak: editingPeriod.isBreak,
      });
    } else {
      form.reset({
        name: "",
        shortName: "",
        sortOrder: 0,
        startTime: "08:00",
        endTime: "08:45",
        isBreak: false,
      });
    }
  }, [editingPeriod, form]);

  const createMutation = trpc.timetable.createPeriod.useMutation({
    onSuccess: () => {
      utils.timetable.listPeriods.invalidate();
      toast.success("Period created");
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.timetable.updatePeriod.useMutation({
    onSuccess: () => {
      utils.timetable.listPeriods.invalidate();
      toast.success("Period updated");
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data: PeriodFormData) => {
    if (editingPeriod) {
      updateMutation.mutate({ id: editingPeriod.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingPeriod ? "Edit Period" : "Create Period"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} placeholder="Period 1" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="shortName">Short Name</Label>
              <Input id="shortName" {...form.register("shortName")} placeholder="P1" />
              {form.formState.errors.shortName && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.shortName.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="sortOrder">Order</Label>
            <Input
              id="sortOrder"
              type="number"
              {...form.register("sortOrder", { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input id="startTime" type="time" {...form.register("startTime")} />
              {form.formState.errors.startTime && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.startTime.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input id="endTime" type="time" {...form.register("endTime")} />
              {form.formState.errors.endTime && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isBreak"
              checked={form.watch("isBreak")}
              onCheckedChange={(v) => form.setValue("isBreak", v)}
            />
            <Label htmlFor="isBreak">Break period (non-teaching)</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : editingPeriod ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
