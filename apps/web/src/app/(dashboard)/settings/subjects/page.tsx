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
import { Plus, MoreHorizontal, Pencil, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { CardListSkeleton } from "@/components/skeletons/card-list-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const subjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().min(1, "Code is required").max(20),
  department: z.string().max(100),
  curriculum: z.string().max(50),
});

type SubjectValues = z.infer<typeof subjectSchema>;

export default function SubjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: subjectsList, isLoading } =
    trpc.academic.listSubjects.useQuery();

  const createMutation = trpc.academic.createSubject.useMutation({
    onSuccess: () => {
      utils.academic.listSubjects.invalidate();
      closeDialog();
      toast.success("Subject created");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const updateMutation = trpc.academic.updateSubject.useMutation({
    onSuccess: () => {
      utils.academic.listSubjects.invalidate();
      closeDialog();
      toast.success("Subject updated");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const deleteMutation = trpc.academic.deleteSubject.useMutation({
    onSuccess: () => {
      utils.academic.listSubjects.invalidate();
      toast.success("Subject deleted");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const form = useForm<SubjectValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: "", code: "", department: "", curriculum: "" },
  });

  function openCreate() {
    setEditingId(null);
    form.reset({ name: "", code: "", department: "", curriculum: "" });
    setDialogOpen(true);
  }

  function openEdit(subject: {
    id: string;
    name: string;
    code: string;
    department: string | null;
    curriculum: string | null;
  }) {
    setEditingId(subject.id);
    form.reset({
      name: subject.name,
      code: subject.code,
      department: subject.department ?? "",
      curriculum: subject.curriculum ?? "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
    form.reset();
  }

  function onSubmit(values: SubjectValues) {
    const payload = {
      name: values.name,
      code: values.code,
      department: values.department || undefined,
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
          <h2 className="text-lg font-semibold">Subjects</h2>
          <p className="text-sm text-muted-foreground">
            Manage subjects taught at your school.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {subjectsList?.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Create your first subject to get started."
          action={{ label: "Add Subject", onClick: openCreate }}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Curriculum</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectsList?.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-mono">{subject.code}</TableCell>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>
                    {subject.department ?? (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {subject.curriculum ? (
                      <Badge variant="secondary">{subject.curriculum}</Badge>
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
                        <DropdownMenuItem onClick={() => openEdit(subject)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            deleteMutation.mutate({ id: subject.id })
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
              {editingId ? "Edit Subject" : "Create Subject"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mathematics" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="MATH"
                          maxLength={20}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mathematics" />
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
