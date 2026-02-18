"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { CardListSkeleton } from "@/components/skeletons/card-list-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const gradeLevelSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  sortOrder: z.coerce.number().int().min(0),
  curriculum: z.string().max(50),
});

type GradeLevelValues = z.infer<typeof gradeLevelSchema>;

export default function GradeLevelsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: levels, isLoading } = trpc.academic.listGradeLevels.useQuery();

  const createMutation = trpc.academic.createGradeLevel.useMutation({
    onSuccess: () => {
      utils.academic.listGradeLevels.invalidate();
      closeDialog();
      toast.success("Grade level created");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const updateMutation = trpc.academic.updateGradeLevel.useMutation({
    onSuccess: () => {
      utils.academic.listGradeLevels.invalidate();
      closeDialog();
      toast.success("Grade level updated");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const deleteMutation = trpc.academic.deleteGradeLevel.useMutation({
    onSuccess: () => {
      utils.academic.listGradeLevels.invalidate();
      toast.success("Grade level deleted");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const form = useForm<GradeLevelValues>({
    resolver: zodResolver(gradeLevelSchema),
    defaultValues: { name: "", sortOrder: 0, curriculum: "" },
  });

  function openCreate() {
    setEditingId(null);
    form.reset({
      name: "",
      sortOrder: (levels?.length ?? 0) + 1,
      curriculum: "",
    });
    setDialogOpen(true);
  }

  function openEdit(level: {
    id: string;
    name: string;
    sortOrder: number;
    curriculum: string | null;
  }) {
    setEditingId(level.id);
    form.reset({
      name: level.name,
      sortOrder: level.sortOrder,
      curriculum: level.curriculum ?? "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
    form.reset();
  }

  function onSubmit(values: GradeLevelValues) {
    const payload = {
      name: values.name,
      sortOrder: values.sortOrder,
      curriculum: values.curriculum || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <CardListSkeleton count={3} />;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Grade Levels</h2>
          <p className="text-sm text-muted-foreground">
            Configure the grade levels for your school.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Grade Level
        </Button>
      </div>

      {levels?.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No grade levels yet"
          description="Create your first grade level to get started."
          action={{ label: "Add Grade Level", onClick: openCreate }}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Curriculum</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels?.map((level) => (
                <TableRow key={level.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {level.sortOrder}
                  </TableCell>
                  <TableCell className="font-medium">{level.name}</TableCell>
                  <TableCell>
                    {level.curriculum ? (
                      <Badge variant="secondary">{level.curriculum}</Badge>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(level)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            deleteMutation.mutate({ id: level.id })
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Grade Level" : "Create Grade Level"}
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
                      <Input {...field} placeholder="Grade 1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="curriculum"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Curriculum</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="IB, British, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
