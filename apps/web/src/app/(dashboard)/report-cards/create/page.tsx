"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function CreateReportCardsPage() {
  const router = useRouter();
  const [selectedTermId, setSelectedTermId] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const { data: academicYears } = trpc.tenant.listAcademicYears.useQuery();
  const currentYear = academicYears?.find((y) => y.isCurrent);
  const { data: termsList } = trpc.tenant.listTerms.useQuery(
    { academicYearId: currentYear?.id ?? "" },
    { enabled: !!currentYear }
  );
  const { data: studentList } = trpc.student.list.useQuery({
    page: 1,
    pageSize: 100,
    status: "active",
  });

  const bulkCreate = trpc.reportCard.bulkCreate.useMutation({
    onSuccess: () => router.push("/report-cards"),
  });

  function toggleStudent(id: string) {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!studentList?.items) return;
    if (selectedStudents.size === studentList.items.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(studentList.items.map((s) => s.id)));
    }
  }

  function handleCreate() {
    if (!selectedTermId || selectedStudents.size === 0) return;
    bulkCreate.mutate({
      termId: selectedTermId,
      studentIds: Array.from(selectedStudents),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Report Cards</h1>
        <p className="text-muted-foreground">
          Select a term and students to generate draft report cards.
        </p>
      </div>

      <div className="w-64">
        <label className="mb-1 block text-sm font-medium">Term</label>
        <Select value={selectedTermId} onValueChange={setSelectedTermId}>
          <SelectTrigger>
            <SelectValue placeholder="Select term" />
          </SelectTrigger>
          <SelectContent>
            {termsList?.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTermId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Select Students</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedStudents.size === (studentList?.items?.length ?? 0)
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={selectedStudents.size === 0 || bulkCreate.isPending}
              >
                {bulkCreate.isPending
                  ? "Creating..."
                  : `Create ${selectedStudents.size} Report Card${selectedStudents.size !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          (studentList?.items?.length ?? 0) > 0 &&
                          selectedStudents.size === studentList?.items?.length
                        }
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border"
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Student #</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentList?.items?.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          className="h-4 w-4 rounded border"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.lastName}, {student.firstName}
                      </TableCell>
                      <TableCell>{student.studentNumber}</TableCell>
                      <TableCell>{student.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
