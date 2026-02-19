import { StudentForm } from "../student-form";

interface NewStudentPageProps {
  searchParams: Promise<{ firstName?: string; lastName?: string; dob?: string }>;
}

export default async function NewStudentPage({ searchParams }: NewStudentPageProps) {
  const params = await searchParams;

  const prefill = (params.firstName ?? params.lastName ?? params.dob)
    ? {
        studentNumber: "",
        firstName: params.firstName ?? "",
        lastName: params.lastName ?? "",
        dateOfBirth: params.dob ? new Date(params.dob) : null,
        nationality: null,
        passportNumber: null,
        visaStatus: null,
        primaryLanguage: null,
        enrollmentDate: null,
        status: "active" as const,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Student</h1>
        <p className="text-muted-foreground">
          {prefill ? "Pre-filled from admissions application — complete remaining fields." : "Create a new student record"}
        </p>
      </div>
      <StudentForm mode="create" defaultValues={prefill} />
    </div>
  );
}
