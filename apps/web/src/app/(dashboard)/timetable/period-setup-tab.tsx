"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PeriodDialog } from "./period-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Clock } from "lucide-react";

type Period = {
  id: string;
  name: string;
  shortName: string;
  sortOrder: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
};

export function PeriodSetupTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Period | null>(null);

  const utils = trpc.useUtils();
  const { data: periodList, isLoading } = trpc.timetable.listPeriods.useQuery();

  const deleteMutation = trpc.timetable.deletePeriod.useMutation({
    onSuccess: () => {
      utils.timetable.listPeriods.invalidate();
      toast.success("Period deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading periods...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Period Definitions</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Period
        </Button>
      </div>

      {!periodList || periodList.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No periods defined"
          description="Define the daily period schedule for your school. Each period represents a time slot in the day."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Short</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periodList.map((period) => (
                <TableRow key={period.id} className={period.isBreak ? "bg-muted/50" : ""}>
                  <TableCell>{period.sortOrder}</TableCell>
                  <TableCell className="font-medium">{period.name}</TableCell>
                  <TableCell>{period.shortName}</TableCell>
                  <TableCell>{period.startTime}</TableCell>
                  <TableCell>{period.endTime}</TableCell>
                  <TableCell>
                    <Badge variant={period.isBreak ? "secondary" : "default"}>
                      {period.isBreak ? "Break" : "Teaching"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditing(period);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate({ id: period.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PeriodDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingPeriod={editing}
      />
    </div>
  );
}
