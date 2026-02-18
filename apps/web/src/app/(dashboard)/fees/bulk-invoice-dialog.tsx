"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface BulkInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkInvoiceDialog({ open, onOpenChange }: BulkInvoiceDialogProps) {
  const [feeStructureId, setFeeStructureId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  const utils = trpc.useUtils();
  const { data: structures } = trpc.fees.listFeeStructures.useQuery(undefined, { enabled: open });
  const { data: studentList } = trpc.student.list.useQuery(
    { page: 1, pageSize: 100, status: "active" },
    { enabled: open }
  );

  const bulkCreate = trpc.fees.bulkCreateInvoices.useMutation({
    onSuccess: () => {
      utils.fees.listInvoices.invalidate();
      utils.fees.getFeeStats.invalidate();
      onOpenChange(false);
      setFeeStructureId("");
      setDueDate("");
      setSelectedStudents(new Set());
      toast.success("Invoices created");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const selectedStructure = structures?.find((s) => s.id === feeStructureId);

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
    if (!feeStructureId || !dueDate || !selectedStructure || selectedStudents.size === 0) return;
    bulkCreate.mutate({
      feeStructureId,
      studentIds: Array.from(selectedStudents),
      amount: parseFloat(selectedStructure.amount),
      currency: selectedStructure.currency,
      dueDate: new Date(dueDate),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Create Invoices</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Fee Structure</label>
              <Select value={feeStructureId} onValueChange={setFeeStructureId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fee" />
                </SelectTrigger>
                <SelectContent>
                  {structures?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.currency} {parseFloat(s.amount).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {feeStructureId && (
            <div className="max-h-64 overflow-y-auto rounded-md border">
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !feeStructureId ||
                !dueDate ||
                selectedStudents.size === 0 ||
                bulkCreate.isPending
              }
            >
              {bulkCreate.isPending
                ? "Creating..."
                : `Create ${selectedStudents.size} Invoice${selectedStudents.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
