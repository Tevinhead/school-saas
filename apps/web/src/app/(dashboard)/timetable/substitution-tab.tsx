"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserMinus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { BulkSubstitutionDialog } from "./bulk-substitution-dialog";

export function SubstitutionTab() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: subs, isLoading } = trpc.timetable.listSubstitutions.useQuery({
    date: new Date(selectedDate),
  });

  const deleteMutation = trpc.timetable.deleteSubstitution.useMutation({
    onSuccess: () => {
      utils.timetable.listSubstitutions.invalidate();
      toast.success("Substitution removed");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Substitutions</h3>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-44"
          />
        </div>
        <Button size="sm" onClick={() => setBulkDialogOpen(true)}>
          <UserMinus className="mr-2 h-4 w-4" />
          Mark Teacher Absent
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading substitutions...</div>
      ) : !subs || subs.length === 0 ? (
        <EmptyState
          icon={UserMinus}
          title="No substitutions"
          description={`No substitutions scheduled for ${new Date(selectedDate).toLocaleDateString()}.`}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Original Teacher</TableHead>
                <TableHead>Substitute</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="text-sm">
                      {sub.periodName}
                      <div className="text-xs text-muted-foreground">
                        {sub.periodStartTime} - {sub.periodEndTime}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{sub.className}</TableCell>
                  <TableCell>{sub.subjectName}</TableCell>
                  <TableCell>
                    {sub.originalTeacherFirst} {sub.originalTeacherLast}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {sub.substituteTeacherFirst} {sub.substituteTeacherLast}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sub.reason ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteMutation.mutate({ id: sub.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <BulkSubstitutionDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
      />
    </div>
  );
}
