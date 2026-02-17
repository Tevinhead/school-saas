"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, DollarSign } from "lucide-react";
import { FeeStructureDialog } from "./fee-structure-dialog";

export function FeeStructuresTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<{
    id: string;
    name: string;
    academicYearId: string;
    gradeLevelId: string | null;
    amount: string;
    currency: string;
    frequency: string;
  } | null>(null);

  const utils = trpc.useUtils();
  const { data: structures, isLoading } = trpc.fees.listFeeStructures.useQuery();
  const deleteMutation = trpc.fees.deleteFeeStructure.useMutation({
    onSuccess: () => utils.fees.listFeeStructures.invalidate(),
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Fee Structures</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingStructure(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Fee Structure
        </Button>
      </div>

      {structures?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No fee structures defined yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {structures?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{parseFloat(s.amount).toLocaleString()}</TableCell>
                  <TableCell>{s.currency}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {s.frequency.charAt(0).toUpperCase() + s.frequency.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingStructure(s);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate({ id: s.id })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <FeeStructureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingStructure={editingStructure}
      />
    </>
  );
}
