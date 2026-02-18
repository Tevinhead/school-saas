"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
};

export function TimetableTab({ studentId }: { studentId: string }) {
  const [selectedTermId, setSelectedTermId] = useState<string>("");

  const { data: termList } = trpc.timetable.listTerms.useQuery();
  const { data: periodList } = trpc.timetable.listPeriods.useQuery();

  const { data: entries, isLoading } = trpc.timetable.getStudentTimetable.useQuery(
    { termId: selectedTermId, studentId },
    { enabled: !!selectedTermId }
  );

  // Auto-select first term
  if (termList && termList.length > 0 && !selectedTermId) {
    setSelectedTermId(termList[0].id);
  }

  const entryMap: Record<string, (typeof entries extends (infer T)[] | undefined ? T : never)> = {};
  if (entries) {
    for (const e of entries) {
      entryMap[`${e.periodId}-${e.dayOfWeek}`] = e;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select value={selectedTermId} onValueChange={setSelectedTermId}>
            <SelectTrigger>
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {termList?.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedTermId ? (
        <EmptyState
          icon={Calendar}
          title="Select a term"
          description="Choose a term to view the student's timetable."
        />
      ) : isLoading ? (
        <div className="text-muted-foreground">Loading timetable...</div>
      ) : !entries || entries.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No timetable"
          description="No timetable has been set up for this student's class yet."
        />
      ) : periodList ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-left text-sm font-medium text-muted-foreground w-28">
                  Time
                </th>
                {WEEKDAYS.map((day) => (
                  <th key={day} className="border p-2 text-center text-sm font-medium">
                    {DAY_LABELS[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periodList.map((period) => (
                <tr key={period.id}>
                  <td className={cn("border p-2 text-xs", period.isBreak && "bg-muted/50")}>
                    <div className="font-medium">{period.shortName}</div>
                    <div className="text-muted-foreground">
                      {period.startTime} - {period.endTime}
                    </div>
                  </td>
                  {WEEKDAYS.map((day) => {
                    if (period.isBreak) {
                      return (
                        <td key={day} className="border p-2 bg-muted/50 text-center text-xs text-muted-foreground">
                          {period.name}
                        </td>
                      );
                    }
                    const entry = entryMap[`${period.id}-${day}`];
                    return (
                      <td key={day} className="border p-2">
                        {entry ? (
                          <div className="text-xs space-y-0.5">
                            <div className="font-semibold">{entry.subjectCode}</div>
                            <div className="text-muted-foreground">
                              {entry.teacherFirstName[0]}. {entry.teacherLastName}
                            </div>
                            {entry.room && (
                              <div className="text-muted-foreground">{entry.room}</div>
                            )}
                          </div>
                        ) : (
                          <div className="h-8" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
