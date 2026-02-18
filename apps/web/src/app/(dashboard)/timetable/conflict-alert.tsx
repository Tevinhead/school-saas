"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ConflictAlertProps {
  conflicts: { type: "teacher" | "room"; entry: { className: string; subjectName: string; teacherFirst?: string; teacherLast?: string; room?: string } }[];
}

export function ConflictAlert({ conflicts }: ConflictAlertProps) {
  if (conflicts.length === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Scheduling Conflicts</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-disc pl-4 text-sm">
          {conflicts.map((c, i) => (
            <li key={i}>
              {c.type === "teacher" ? "Teacher" : "Room"} conflict with{" "}
              <strong>{c.entry.className}</strong> &mdash; {c.entry.subjectName}
              {c.type === "teacher" && c.entry.teacherFirst && (
                <> ({c.entry.teacherFirst} {c.entry.teacherLast})</>
              )}
              {c.type === "room" && c.entry.room && <> (Room: {c.entry.room})</>}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
