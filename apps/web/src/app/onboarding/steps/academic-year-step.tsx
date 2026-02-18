"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc/client";
import { academicYearOnboardingSchema, type AcademicYearOnboardingValues } from "@school-saas/validators";
import { toast } from "sonner";
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

interface AcademicYearStepProps {
  onNext: (academicYearId: string) => void;
  onBack: () => void;
}

export function AcademicYearStep({ onNext, onBack }: AcademicYearStepProps) {
  const createYear = trpc.tenant.createAcademicYear.useMutation({
    onSuccess: (year) => {
      toast.success("Academic year created");
      onNext(year.id);
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const form = useForm<AcademicYearOnboardingValues>({
    resolver: zodResolver(academicYearOnboardingSchema),
    defaultValues: {
      name: "2025-2026",
      startDate: "2025-08-01",
      endDate: "2026-06-30",
    },
  });

  function onSubmit(values: AcademicYearOnboardingValues) {
    createYear.mutate({
      name: values.name,
      startDate: new Date(values.startDate),
      endDate: new Date(values.endDate),
      isCurrent: true,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Academic Year Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="2025-2026" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={createYear.isPending}>
            {createYear.isPending ? "Creating..." : "Next"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
