"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const scaleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["numeric", "letter", "percentage"]),
  scaleDefinition: z.string().min(1, "Scale definition is required"),
  isDefault: z.boolean(),
});

type ScaleValues = z.infer<typeof scaleSchema>;

interface ScaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingScale?: {
    id: string;
    name: string;
    type: string;
    scaleDefinition: Record<string, unknown>;
    isDefault: boolean;
  } | null;
}

export function ScaleDialog({ open, onOpenChange, editingScale }: ScaleDialogProps) {
  const utils = trpc.useUtils();

  const createMutation = trpc.gradebook.createGradingScale.useMutation({
    onSuccess: () => {
      utils.gradebook.listGradingScales.invalidate();
      onOpenChange(false);
    },
  });

  const updateMutation = trpc.gradebook.updateGradingScale.useMutation({
    onSuccess: () => {
      utils.gradebook.listGradingScales.invalidate();
      onOpenChange(false);
    },
  });

  const form = useForm<ScaleValues>({
    resolver: zodResolver(scaleSchema),
    defaultValues: {
      name: editingScale?.name ?? "",
      type: (editingScale?.type as ScaleValues["type"]) ?? "percentage",
      scaleDefinition: editingScale
        ? JSON.stringify(editingScale.scaleDefinition, null, 2)
        : "",
      isDefault: editingScale?.isDefault ?? false,
    },
  });

  function onSubmit(values: ScaleValues) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(values.scaleDefinition);
    } catch {
      form.setError("scaleDefinition", { message: "Invalid JSON" });
      return;
    }

    const payload = {
      name: values.name,
      type: values.type,
      scaleDefinition: parsed,
      isDefault: values.isDefault,
    };

    if (editingScale) {
      updateMutation.mutate({ id: editingScale.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingScale ? "Edit Grading Scale" : "Create Grading Scale"}
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
                    <Input {...field} placeholder="IB Grade Scale" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      {["numeric", "letter", "percentage"].map((t) => (
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
              name="scaleDefinition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scale Definition (JSON)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={6} className="font-mono text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isDefault"
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
                  <FormLabel className="!mt-0">Set as default</FormLabel>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingScale ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
