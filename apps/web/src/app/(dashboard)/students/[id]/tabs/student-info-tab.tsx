"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Student {
  dateOfBirth: Date | null;
  nationality: string | null;
  passportNumber: string | null;
  visaStatus: string | null;
  primaryLanguage: string | null;
  enrollmentDate: Date | null;
  status: string;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">
        {value ?? <span className="text-muted-foreground">&mdash;</span>}
      </dd>
    </div>
  );
}

export function StudentInfoTab({ student }: { student: Student }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <InfoRow
              label="Date of Birth"
              value={student.dateOfBirth?.toLocaleDateString()}
            />
            <InfoRow label="Nationality" value={student.nationality} />
            <InfoRow label="Primary Language" value={student.primaryLanguage} />
            <InfoRow label="Status" value={student.status} />
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents & Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Passport Number" value={student.passportNumber} />
            <InfoRow label="Visa Status" value={student.visaStatus} />
            <InfoRow
              label="Enrollment Date"
              value={student.enrollmentDate?.toLocaleDateString()}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
