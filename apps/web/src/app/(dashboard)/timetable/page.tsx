"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar } from "lucide-react";
import { TimetableGrid } from "./timetable-grid";
import { TimetableToolbar } from "./timetable-toolbar";
import { PeriodSetupTab } from "./period-setup-tab";
import { SubstitutionTab } from "./substitution-tab";

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
};

export default function TimetablePage() {
  const { orgRole } = useAuth();
  const isAdmin = orgRole === "org:admin" || orgRole === "org:super_admin";
  const isTeacher = orgRole === "org:teacher" || isAdmin;

  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("weekly");

  const { data: termList } = trpc.timetable.listTerms.useQuery();
  const { data: classList } = trpc.academic.listClasses.useQuery();
  const { data: periodList } = trpc.timetable.listPeriods.useQuery();

  const { data: entries } = trpc.timetable.listEntries.useQuery(
    { termId: selectedTermId, classId: selectedClassId },
    { enabled: !!selectedTermId && !!selectedClassId }
  );

  // For teachers: personal timetable
  const { data: teacherEntries } = trpc.timetable.getTeacherTimetable.useQuery(
    { termId: selectedTermId },
    { enabled: !!selectedTermId && isTeacher && !isAdmin }
  );

  // Auto-select first term
  if (termList && termList.length > 0 && !selectedTermId) {
    setSelectedTermId(termList[0].id);
  }

  // Teacher personal view uses a simplified grid
  const showPersonalView = isTeacher && !isAdmin && !selectedClassId;

  return (
    <div className="space-y-6">
      <div className="print:block">
        <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
        <p className="text-muted-foreground print:hidden">
          {isAdmin
            ? "Manage school schedules, period definitions, and substitutions."
            : "View your teaching schedule."}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="print:hidden">
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          {isAdmin && <TabsTrigger value="periods">Period Setup</TabsTrigger>}
          {isAdmin && (
            <TabsTrigger value="substitutions">Substitutions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <div className="flex flex-wrap items-end gap-4 print:hidden">
            <div className="w-48">
              <label className="mb-1 block text-sm font-medium">Term</label>
              <Select
                value={selectedTermId}
                onValueChange={(v) => {
                  setSelectedTermId(v);
                }}
              >
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

            <div className="w-48">
              <label className="mb-1 block text-sm font-medium">Class</label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isTeacher && !isAdmin
                        ? "My timetable"
                        : "Select class"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isTeacher && !isAdmin && (
                    <SelectItem value="__personal">My Timetable</SelectItem>
                  )}
                  {classList?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAdmin && selectedTermId && selectedClassId && (
              <TimetableToolbar
                termId={selectedTermId}
                classId={selectedClassId}
                terms={termList ?? []}
              />
            )}
          </div>

          {!selectedTermId ? (
            <EmptyState
              icon={Calendar}
              title="Select a term"
              description="Choose a term to view the timetable."
            />
          ) : showPersonalView || selectedClassId === "__personal" ? (
            // Teacher personal view
            periodList && teacherEntries ? (
              <TeacherPersonalGrid
                periods={periodList}
                entries={teacherEntries}
              />
            ) : (
              <div className="text-muted-foreground">Loading your timetable...</div>
            )
          ) : !selectedClassId ? (
            <EmptyState
              icon={Calendar}
              title="Select a class"
              description="Choose a class to view or edit the timetable."
            />
          ) : periodList && entries ? (
            <TimetableGrid
              periods={periodList}
              entries={entries}
              termId={selectedTermId}
              classId={selectedClassId}
              readOnly={!isAdmin}
            />
          ) : (
            <div className="text-muted-foreground">Loading timetable...</div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="periods">
            <PeriodSetupTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="substitutions">
            <SubstitutionTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Simplified teacher personal grid
function TeacherPersonalGrid({
  periods,
  entries,
}: {
  periods: {
    id: string;
    name: string;
    shortName: string;
    sortOrder: number;
    startTime: string;
    endTime: string;
    isBreak: boolean;
  }[];
  entries: {
    id: string;
    periodId: string;
    dayOfWeek: string;
    room: string | null;
    className: string;
    subjectName: string;
    subjectCode: string;
    periodSortOrder: number;
    periodIsBreak: boolean;
  }[];
}) {
  // Build lookup
  const entryMap: Record<string, (typeof entries)[number]> = {};
  for (const e of entries) {
    entryMap[`${e.periodId}-${e.dayOfWeek}`] = e;
  }

  return (
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
          {periods.map((period) => (
            <tr key={period.id}>
              <td className={`border p-2 text-xs ${period.isBreak ? "bg-muted/50" : ""}`}>
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
                        <div className="text-muted-foreground">{entry.className}</div>
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
  );
}
