"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { TimetableEntryDialog } from "./timetable-entry-dialog";

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
};

// Color palette for subjects
const SUBJECT_COLORS = [
  "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
  "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
  "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800",
  "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
  "bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800",
  "bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:border-cyan-800",
  "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
  "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
];

type Period = {
  id: string;
  name: string;
  shortName: string;
  sortOrder: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
};

type Entry = {
  id: string;
  periodId: string;
  dayOfWeek: string;
  subjectId: string;
  teacherId: string;
  room: string | null;
  subjectName: string;
  subjectCode: string;
  teacherFirstName: string;
  teacherLastName: string;
  periodSortOrder: number;
  periodIsBreak: boolean;
};

interface TimetableGridProps {
  periods: Period[];
  entries: Entry[];
  termId: string;
  classId: string;
  readOnly?: boolean;
}

export function TimetableGrid({
  periods,
  entries,
  termId,
  classId,
  readOnly = false,
}: TimetableGridProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    periodId: string;
    dayOfWeek: string;
  } | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const utils = trpc.useUtils();
  const deleteMutation = trpc.timetable.deleteEntry.useMutation({
    onSuccess: () => {
      utils.timetable.listEntries.invalidate({ termId, classId });
      toast.success("Entry removed");
    },
    onError: (err) => toast.error(err.message),
  });

  // Build subject → color map
  const subjectIds = [...new Set(entries.map((e) => e.subjectId))];
  const subjectColorMap: Record<string, string> = {};
  subjectIds.forEach((id, i) => {
    subjectColorMap[id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
  });

  // Build lookup: periodId-dayOfWeek → entry
  const entryMap: Record<string, Entry> = {};
  for (const entry of entries) {
    entryMap[`${entry.periodId}-${entry.dayOfWeek}`] = entry;
  }

  const handleCellClick = (periodId: string, dayOfWeek: string) => {
    if (readOnly) return;
    const existing = entryMap[`${periodId}-${dayOfWeek}`];
    if (existing) {
      setEditingEntry(existing);
    } else {
      setEditingEntry(null);
    }
    setSelectedSlot({ periodId, dayOfWeek });
    setDialogOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-left text-sm font-medium text-muted-foreground w-28">
                Time
              </th>
              {WEEKDAYS.map((day) => (
                <th
                  key={day}
                  className="border p-2 text-center text-sm font-medium"
                >
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.id}>
                <td
                  className={cn(
                    "border p-2 text-xs",
                    period.isBreak && "bg-muted/50"
                  )}
                >
                  <div className="font-medium">{period.shortName}</div>
                  <div className="text-muted-foreground">
                    {period.startTime} - {period.endTime}
                  </div>
                </td>
                {WEEKDAYS.map((day) => {
                  if (period.isBreak) {
                    return (
                      <td
                        key={day}
                        className="border p-2 bg-muted/50 text-center text-xs text-muted-foreground"
                      >
                        {period.name}
                      </td>
                    );
                  }

                  const entry = entryMap[`${period.id}-${day}`];

                  return (
                    <td
                      key={day}
                      className={cn(
                        "border p-1 relative group cursor-pointer transition-colors min-w-[120px]",
                        entry
                          ? cn(
                              "border-l-4",
                              subjectColorMap[entry.subjectId]
                            )
                          : "hover:bg-muted/30"
                      )}
                      onClick={() => handleCellClick(period.id, day)}
                    >
                      {entry ? (
                        <div className="text-xs space-y-0.5">
                          <div className="font-semibold truncate">
                            {entry.subjectCode}
                          </div>
                          <div className="text-muted-foreground truncate">
                            {entry.teacherFirstName[0]}. {entry.teacherLastName}
                          </div>
                          {entry.room && (
                            <div className="text-muted-foreground truncate">
                              {entry.room}
                            </div>
                          )}
                          {!readOnly && (
                            <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingEntry(entry);
                                  setSelectedSlot({
                                    periodId: period.id,
                                    dayOfWeek: day,
                                  });
                                  setDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMutation.mutate({ id: entry.id });
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        !readOnly && (
                          <div className="h-12 flex items-center justify-center text-muted-foreground text-xs opacity-0 group-hover:opacity-100">
                            + Add
                          </div>
                        )
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSlot && (
        <TimetableEntryDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setSelectedSlot(null);
              setEditingEntry(null);
            }
          }}
          termId={termId}
          classId={classId}
          periodId={selectedSlot.periodId}
          dayOfWeek={selectedSlot.dayOfWeek}
          editingEntry={editingEntry}
        />
      )}
    </>
  );
}
