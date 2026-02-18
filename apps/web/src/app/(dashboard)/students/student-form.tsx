"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const studentFormSchema = z.object({
  studentNumber: z.string().min(1, "Student number is required").max(50),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z.string(),
  nationality: z.string().max(100),
  passportNumber: z.string().max(50),
  visaStatus: z.string().max(50),
  primaryLanguage: z.string().max(50),
  enrollmentDate: z.string(),
  status: z.enum(["active", "inactive", "graduated", "transferred"]),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  mode: "create" | "edit";
  defaultValues?: {
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
  };
  studentId?: string;
}

export function StudentForm({ mode, defaultValues, studentId }: StudentFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const createMutation = trpc.student.create.useMutation({
    onSuccess: (student) => {
      utils.student.list.invalidate();
      toast.success("Student created");
      router.push(`/students/${student.id}`);
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const updateMutation = trpc.student.update.useMutation({
    onSuccess: () => {
      utils.student.list.invalidate();
      if (studentId) utils.student.getById.invalidate({ id: studentId });
      toast.success("Student updated");
      router.push(`/students/${studentId}`);
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: defaultValues
      ? {
          studentNumber: defaultValues.studentNumber,
          firstName: defaultValues.firstName,
          lastName: defaultValues.lastName,
          dateOfBirth: defaultValues.dateOfBirth
            ? defaultValues.dateOfBirth.toISOString().split("T")[0]
            : "",
          nationality: defaultValues.nationality ?? "",
          passportNumber: defaultValues.passportNumber ?? "",
          visaStatus: defaultValues.visaStatus ?? "",
          primaryLanguage: defaultValues.primaryLanguage ?? "",
          enrollmentDate: defaultValues.enrollmentDate
            ? defaultValues.enrollmentDate.toISOString().split("T")[0]
            : "",
          status: defaultValues.status as StudentFormValues["status"],
        }
      : {
          studentNumber: "",
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          nationality: "",
          passportNumber: "",
          visaStatus: "",
          primaryLanguage: "",
          enrollmentDate: "",
          status: "active",
        },
  });

  function onSubmit(values: StudentFormValues) {
    const payload = {
      studentNumber: values.studentNumber,
      firstName: values.firstName,
      lastName: values.lastName,
      dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth) : undefined,
      nationality: values.nationality || undefined,
      passportNumber: values.passportNumber || undefined,
      visaStatus: values.visaStatus || undefined,
      primaryLanguage: values.primaryLanguage || undefined,
      enrollmentDate: values.enrollmentDate
        ? new Date(values.enrollmentDate)
        : undefined,
      status: values.status,
    };

    if (mode === "create") {
      createMutation.mutate(payload);
    } else if (studentId) {
      updateMutation.mutate({ id: studentId, ...payload });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Student Information" : "Edit Student"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="studentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="STU-001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="enrollmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Thai" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="primaryLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Language</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="English" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="passportNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passport Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visaStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visa Status</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Student visa" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="graduated">Graduated</SelectItem>
                        <SelectItem value="transferred">Transferred</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : mode === "create"
                    ? "Create Student"
                    : "Update Student"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
