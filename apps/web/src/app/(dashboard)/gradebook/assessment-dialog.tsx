"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const assessmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  type: z.enum(["homework", "quiz", "test", "exam", "project"]),
  gradingScaleId: z.string().optional(),
  maxScore: z.string().optional(),
  weight: z.string().optional(),
  dueDate: z.string().optional(),
  isPublished: z.boolean(),
});

type AssessmentValues = z.infer<typeof assessmentSchema>;

interface AssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classSectionId: string;
  editingAssessment?: {
    id: string;
    name: string;
    type: string;
    maxScore: string | null;
    weight: string | null;
    dueDate: Date | null;
    isPublished: boolean;
    gradingScaleId?: string | null;
  } | null;
}

export function AssessmentDialog({
  open,
  onOpenChange,
  classSectionId,
  editingAssessment,
}: AssessmentDialogProps) {
  const utils = trpc.useUtils();
  const { data: scales } = trpc.gradebook.listGradingScales.useQuery();

  const createMutation = trpc.gradebook.createAssessment.useMutation({
    onSuccess: () => {
      utils.gradebook.listAssessments.invalidate({ classSectionId });
      onOpenChange(false);
      toast.success("Assessment created");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const updateMutation = trpc.gradebook.updateAssessment.useMutation({
    onSuccess: () => {
      utils.gradebook.listAssessments.invalidate({ classSectionId });
      onOpenChange(false);
      toast.success("Assessment updated");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const form = useForm<AssessmentValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      name: editingAssessment?.name ?? "",
      type: (editingAssessment?.type as AssessmentValues["type"]) ?? "homework",
      gradingScaleId: editingAssessment?.gradingScaleId ?? undefined,
      maxScore: editingAssessment?.maxScore ?? "",
      weight: editingAssessment?.weight ?? "",
      dueDate: editingAssessment?.dueDate
        ? new Date(editingAssessment.dueDate).toISOString().split("T")[0]
        : "",
      isPublished: editingAssessment?.isPublished ?? false,
    },
  });

  function onSubmit(values: AssessmentValues) {
    const payload = {
      name: values.name,
      type: values.type,
      gradingScaleId: values.gradingScaleId || undefined,
      maxScore: values.maxScore ? parseFloat(values.maxScore) : undefined,
      weight: values.weight ? parseFloat(values.weight) : undefined,
      dueDate: values.dueDate ? new Date(values.dueDate) : undefined,
      isPublished: values.isPublished,
    };

    if (editingAssessment) {
      updateMutation.mutate({ id: editingAssessment.id, ...payload });
    } else {
      createMutation.mutate({ classSectionId, ...payload });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingAssessment ? "Edit Assessment" : "Create Assessment"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Midterm Exam" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["homework", "quiz", "test", "exam", "project"].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gradingScaleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grading Scale</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scale" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scales?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Score</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="25" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Published</FormLabel>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingAssessment ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
