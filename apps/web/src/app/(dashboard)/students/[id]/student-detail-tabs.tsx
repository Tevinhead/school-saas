"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentInfoTab } from "./tabs/student-info-tab";
import { GuardiansTab } from "./tabs/guardians-tab";
import { EnrollmentTab } from "./tabs/enrollment-tab";
import { AttendanceTab } from "./tabs/attendance-tab";
import { GradesTab } from "./tabs/grades-tab";
import { TimetableTab } from "./tabs/timetable-tab";

interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  nationality: string | null;
  passportNumber: string | null;
  visaStatus: string | null;
  primaryLanguage: string | null;
  enrollmentDate: Date | null;
  status: string;
}

interface StudentDetailTabsProps {
  student: Student;
}

export function StudentDetailTabs({ student }: StudentDetailTabsProps) {
  return (
    <Tabs defaultValue="info">
      <TabsList>
        <TabsTrigger value="info">Information</TabsTrigger>
        <TabsTrigger value="guardians">Guardians</TabsTrigger>
        <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="grades">Grades</TabsTrigger>
        <TabsTrigger value="timetable">Timetable</TabsTrigger>
      </TabsList>
      <TabsContent value="info" className="mt-4">
        <StudentInfoTab student={student} />
      </TabsContent>
      <TabsContent value="guardians" className="mt-4">
        <GuardiansTab studentId={student.id} />
      </TabsContent>
      <TabsContent value="enrollment" className="mt-4">
        <EnrollmentTab studentId={student.id} />
      </TabsContent>
      <TabsContent value="attendance" className="mt-4">
        <AttendanceTab studentId={student.id} />
      </TabsContent>
      <TabsContent value="grades" className="mt-4">
        <GradesTab studentId={student.id} />
      </TabsContent>
      <TabsContent value="timetable" className="mt-4">
        <TimetableTab studentId={student.id} />
      </TabsContent>
    </Tabs>
  );
}
