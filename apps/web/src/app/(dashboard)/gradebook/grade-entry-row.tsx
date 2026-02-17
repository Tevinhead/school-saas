"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";

interface GradeEntryRowProps {
  index: number;
  studentName: string;
  studentNumber: string;
  score: string;
  letterGrade: string;
  comments: string;
  onScoreChange: (value: string) => void;
  onLetterGradeChange: (value: string) => void;
  onCommentsChange: (value: string) => void;
}

export const GradeEntryRow = memo(function GradeEntryRow({
  index,
  studentName,
  studentNumber,
  score,
  letterGrade,
  comments,
  onScoreChange,
  onLetterGradeChange,
  onCommentsChange,
}: GradeEntryRowProps) {
  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
      <TableCell>
        <div>
          <span className="font-medium">{studentName}</span>
          <span className="ml-2 text-xs text-muted-foreground">{studentNumber}</span>
        </div>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          value={score}
          onChange={(e) => onScoreChange(e.target.value)}
          className="w-24"
        />
      </TableCell>
      <TableCell>
        <Input
          value={letterGrade}
          onChange={(e) => onLetterGradeChange(e.target.value)}
          className="w-16"
          maxLength={5}
        />
      </TableCell>
      <TableCell>
        <Input
          value={comments}
          onChange={(e) => onCommentsChange(e.target.value)}
          placeholder="Optional"
        />
      </TableCell>
    </TableRow>
  );
});
