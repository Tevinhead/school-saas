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
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { CardListSkeleton } from "@/components/skeletons/card-list-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const academicYearSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isCurrent: z.boolean(),
});

type AcademicYearValues = z.infer<typeof academicYearSchema>;

export default function AcademicYearsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: years, isLoading } = trpc.tenant.listAcademicYears.useQuery();
  const createMutation = trpc.tenant.createAcademicYear.useMutation({
    onSuccess: () => {
      utils.tenant.listAcademicYears.invalidate();
      closeDialog();
      toast.success("Academic year created");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const updateMutation = trpc.tenant.updateAcademicYear.useMutation({
    onSuccess: () => {
      utils.tenant.listAcademicYears.invalidate();
      closeDialog();
      toast.success("Academic year updated");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const deleteMutation = trpc.tenant.deleteAcademicYear.useMutation({
    onSuccess: () => {
      utils.tenant.listAcademicYears.invalidate();
      toast.success("Academic year deleted");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const form = useForm<AcademicYearValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: { name: "", startDate: "", endDate: "", isCurrent: false },
  });

  function openCreate() {
    setEditingId(null);
    form.reset({ name: "", startDate: "", endDate: "", isCurrent: false });
    setDialogOpen(true);
  }

  function openEdit(year: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
  }) {
    setEditingId(year.id);
    form.reset({
      name: year.name,
      startDate: year.startDate.toISOString().split("T")[0],
      endDate: year.endDate.toISOString().split("T")[0],
      isCurrent: year.isCurrent,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
    form.reset();
  }

  function onSubmit(values: AcademicYearValues) {
    const payload = {
      name: values.name,
      startDate: new Date(values.startDate),
      endDate: new Date(values.endDate),
      isCurrent: values.isCurrent,
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
          <h2 className="text-lg font-semibold">Academic Years</h2>
          <p className="text-sm text-muted-foreground">
            Manage your school&apos;s academic years.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Academic Year
        </Button>
      </div>

      <div className="grid gap-4">
        {years?.length === 0 && (
          <EmptyState
            icon={Calendar}
            title="No academic years yet"
            description="Create your first academic year to get started."
            action={{ label: "Add Academic Year", onClick: openCreate }}
          />
        )}
        {years?.map((year) => (
          <Card key={year.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">{year.name}</CardTitle>
                {year.isCurrent && <Badge>Current</Badge>}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(year)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate({ id: year.id })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardDescription className="px-6 pb-4">
              {year.startDate.toLocaleDateString()} &mdash;{" "}
              {year.endDate.toLocaleDateString()}
            </CardDescription>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Academic Year" : "Create Academic Year"}
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
                      <Input {...field} placeholder="2025-2026" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
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
                name="isCurrent"
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
                    <FormLabel className="!mt-0">
                      Set as current academic year
                    </FormLabel>
                  </FormItem>
                )}
              />
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
