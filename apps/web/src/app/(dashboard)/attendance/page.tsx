"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AttendanceMarkingForm } from "./attendance-marking-form";
import { DailySummary } from "./daily-summary";

function toDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(formatDateInput(new Date()));

  const { data: classList } = trpc.academic.listClasses.useQuery();
  const { data: sections } = trpc.academic.listClassSections.useQuery(
    { classId: selectedClassId },
    { enabled: !!selectedClassId }
  );

  const dateObj = toDateOnly(selectedDate);
  const allSelected = !!selectedClassId && !!selectedSectionId && !!selectedDate;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          Mark and review daily attendance by class section.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <label className="mb-1 block text-sm font-medium">Class</label>
          <Select
            value={selectedClassId}
            onValueChange={(v) => {
              setSelectedClassId(v);
              setSelectedSectionId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classList?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <label className="mb-1 block text-sm font-medium">Section</label>
          <Select
            value={selectedSectionId}
            onValueChange={setSelectedSectionId}
            disabled={!selectedClassId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {sections?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <label className="mb-1 block text-sm font-medium">Date</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {allSelected && (
        <div className="space-y-6">
          <DailySummary date={dateObj} />
          <AttendanceMarkingForm
            classSectionId={selectedSectionId}
            date={dateObj}
          />
        </div>
      )}
    </div>
  );
}
