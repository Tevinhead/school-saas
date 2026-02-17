"use client";

import { use } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { StudentDetailTabs } from "./student-detail-tabs";

interface Props {
  params: Promise<{ id: string }>;
}

export default function StudentDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data: student, isLoading } = trpc.student.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-muted-foreground">Loading student...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <div className="text-muted-foreground">Student not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {student.firstName} {student.lastName}
            </h1>
            <Badge
              variant={student.status === "active" ? "default" : "secondary"}
            >
              {student.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">#{student.studentNumber}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/students/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>
      <StudentDetailTabs student={student} />
    </div>
  );
}
