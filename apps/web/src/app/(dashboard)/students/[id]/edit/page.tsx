"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc/client";
import { StudentForm } from "../../student-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditStudentPage({ params }: Props) {
  const { id } = use(params);
  const { data: student, isLoading } = trpc.student.getById.useQuery({ id });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!student) {
    return <div className="text-muted-foreground">Student not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Student</h1>
        <p className="text-muted-foreground">
          {student.firstName} {student.lastName} &mdash; #{student.studentNumber}
        </p>
      </div>
      <StudentForm mode="edit" studentId={id} defaultValues={student} />
    </div>
  );
}
