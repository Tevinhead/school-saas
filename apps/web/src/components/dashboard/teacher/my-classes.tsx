"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function MyClasses() {
  const { data: classList } = trpc.dashboard.getTeacherClasses.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Classes</CardTitle>
      </CardHeader>
      <CardContent>
        {!classList || classList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No classes assigned.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classList.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.className}</TableCell>
                  <TableCell>
                    {c.subjectName} ({c.subjectCode})
                  </TableCell>
                  <TableCell>{c.studentCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
