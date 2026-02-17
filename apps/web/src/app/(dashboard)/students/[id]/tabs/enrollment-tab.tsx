"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, School } from "lucide-react";

export function EnrollmentTab({ studentId }: { studentId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: enrollments, isLoading } =
    trpc.student.listEnrollments.useQuery({ studentId });
  const { data: classes } = trpc.academic.listClasses.useQuery(undefined, {
    enabled: dialogOpen,
  });

  const enrollMutation = trpc.student.enrollInClass.useMutation({
    onSuccess: () => {
      utils.student.listEnrollments.invalidate({ studentId });
      setDialogOpen(false);
      setSelectedClassId("");
    },
  });

  const unenrollMutation = trpc.student.unenrollFromClass.useMutation({
    onSuccess: () =>
      utils.student.listEnrollments.invalidate({ studentId }),
  });

  function handleEnroll() {
    if (!selectedClassId) return;
    enrollMutation.mutate({ studentId, classId: selectedClassId });
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Loading enrollments...</div>;
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Class Enrollment</h3>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Enroll in Class
        </Button>
      </div>

      {enrollments?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <School className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Not enrolled in any classes yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Grade Level</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments?.map((enrollment) => (
                <TableRow key={enrollment.enrollmentId}>
                  <TableCell className="font-medium">
                    {enrollment.className}
                  </TableCell>
                  <TableCell>{enrollment.gradeLevelName}</TableCell>
                  <TableCell>
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        unenrollMutation.mutate({
                          enrollmentId: enrollment.enrollmentId,
                        })
                      }
                      disabled={unenrollMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
            <DialogTitle>Enroll in Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {classes?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No classes available. Create classes in Settings first.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnroll}
                disabled={!selectedClassId || enrollMutation.isPending}
              >
                {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
