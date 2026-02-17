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
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";

const guardianSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  relationship: z.string().min(1, "Relationship is required").max(50),
  phone: z.string().max(50),
  email: z.string(),
  isEmergencyContact: z.boolean(),
});

type GuardianValues = z.infer<typeof guardianSchema>;

export function GuardiansTab({ studentId }: { studentId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: guardiansList, isLoading } =
    trpc.student.listGuardians.useQuery({ studentId });

  const addMutation = trpc.student.addGuardian.useMutation({
    onSuccess: () => {
      utils.student.listGuardians.invalidate({ studentId });
      closeDialog();
    },
  });

  const updateMutation = trpc.student.updateGuardian.useMutation({
    onSuccess: () => {
      utils.student.listGuardians.invalidate({ studentId });
      closeDialog();
    },
  });

  const removeMutation = trpc.student.removeGuardian.useMutation({
    onSuccess: () =>
      utils.student.listGuardians.invalidate({ studentId }),
  });

  const form = useForm<GuardianValues>({
    resolver: zodResolver(guardianSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      relationship: "",
      phone: "",
      email: "",
      isEmergencyContact: false,
    },
  });

  function openCreate() {
    setEditingId(null);
    form.reset({
      firstName: "",
      lastName: "",
      relationship: "",
      phone: "",
      email: "",
      isEmergencyContact: false,
    });
    setDialogOpen(true);
  }

  function openEdit(guardian: {
    id: string;
    firstName: string;
    lastName: string;
    relationship: string;
    phone: string | null;
    email: string | null;
    isEmergencyContact: boolean;
  }) {
    setEditingId(guardian.id);
    form.reset({
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      relationship: guardian.relationship,
      phone: guardian.phone ?? "",
      email: guardian.email ?? "",
      isEmergencyContact: guardian.isEmergencyContact,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
    form.reset();
  }

  function onSubmit(values: GuardianValues) {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      relationship: values.relationship,
      phone: values.phone || undefined,
      email: values.email || undefined,
      isEmergencyContact: values.isEmergencyContact,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      addMutation.mutate({ studentId, ...payload });
    }
  }

  const isPending = addMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <div className="text-muted-foreground">Loading guardians...</div>;
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Guardians</h3>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Guardian
        </Button>
      </div>

      {guardiansList?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No guardians linked. Add a guardian to this student.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Emergency</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {guardiansList?.map((guardian) => (
                <TableRow key={guardian.id}>
                  <TableCell className="font-medium">
                    {guardian.firstName} {guardian.lastName}
                  </TableCell>
                  <TableCell>{guardian.relationship}</TableCell>
                  <TableCell>
                    {guardian.phone ?? (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {guardian.email ?? (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {guardian.isEmergencyContact && (
                      <Badge variant="secondary">Emergency</Badge>
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
                        <DropdownMenuItem
                          onClick={() => openEdit(guardian)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            removeMutation.mutate({
                              studentId,
                              guardianId: guardian.id,
                            })
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
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
              {editingId ? "Edit Guardian" : "Add Guardian"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Mother, Father, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isEmergencyContact"
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
                    <FormLabel className="!mt-0">Emergency Contact</FormLabel>
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
                  {isPending
                    ? "Saving..."
                    : editingId
                      ? "Update"
                      : "Add Guardian"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
