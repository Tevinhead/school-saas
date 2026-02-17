"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const feeStructureSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  academicYearId: z.string().min(1, "Academic year is required"),
  gradeLevelId: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().length(3),
  frequency: z.enum(["annual", "semester", "monthly"]),
});

type FeeStructureValues = z.infer<typeof feeStructureSchema>;

interface FeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStructure?: {
    id: string;
    name: string;
    academicYearId: string;
    gradeLevelId: string | null;
    amount: string;
    currency: string;
    frequency: string;
  } | null;
}

export function FeeStructureDialog({
  open,
  onOpenChange,
  editingStructure,
}: FeeStructureDialogProps) {
  const utils = trpc.useUtils();
  const { data: academicYears } = trpc.tenant.listAcademicYears.useQuery();
  const { data: gradeLevels } = trpc.academic.listGradeLevels.useQuery();

  const createMutation = trpc.fees.createFeeStructure.useMutation({
    onSuccess: () => {
      utils.fees.listFeeStructures.invalidate();
      onOpenChange(false);
    },
  });

  const updateMutation = trpc.fees.updateFeeStructure.useMutation({
    onSuccess: () => {
      utils.fees.listFeeStructures.invalidate();
      onOpenChange(false);
    },
  });

  const form = useForm<FeeStructureValues>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      name: editingStructure?.name ?? "",
      academicYearId: editingStructure?.academicYearId ?? "",
      gradeLevelId: editingStructure?.gradeLevelId ?? "",
      amount: editingStructure?.amount ?? "",
      currency: editingStructure?.currency ?? "USD",
      frequency: (editingStructure?.frequency as FeeStructureValues["frequency"]) ?? "annual",
    },
  });

  function onSubmit(values: FeeStructureValues) {
    const payload = {
      name: values.name,
      amount: parseFloat(values.amount),
      currency: values.currency,
      frequency: values.frequency,
    };

    if (editingStructure) {
      updateMutation.mutate({
        id: editingStructure.id,
        ...payload,
        gradeLevelId: values.gradeLevelId || undefined,
      });
    } else {
      createMutation.mutate({
        ...payload,
        academicYearId: values.academicYearId,
        gradeLevelId: values.gradeLevelId || undefined,
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingStructure ? "Edit Fee Structure" : "Create Fee Structure"}
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
                    <Input {...field} placeholder="Tuition Fee" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="academicYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!!editingStructure}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears?.map((y) => (
                          <SelectItem key={y.id} value={y.id}>
                            {y.name}
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
                name="gradeLevelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level (optional)</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All grades" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gradeLevels?.map((gl) => (
                          <SelectItem key={gl.id} value={gl.id}>
                            {gl.name}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["annual", "semester", "monthly"].map((f) => (
                          <SelectItem key={f} value={f}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingStructure ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
