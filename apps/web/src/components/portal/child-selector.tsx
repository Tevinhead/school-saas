"use client";

import { useSelectedChild } from "./selected-child-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ChildSelector() {
  const { selectedStudentId, setSelectedStudentId, students, role } =
    useSelectedChild();

  // Only show for parents with multiple children
  if (role !== "parent" || students.length <= 1) return null;

  return (
    <Select value={selectedStudentId ?? ""} onValueChange={setSelectedStudentId}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select child" />
      </SelectTrigger>
      <SelectContent>
        {students.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.firstName} {s.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
