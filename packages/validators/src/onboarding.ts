import { z } from "zod";

export const schoolInfoSchema = z.object({
  name: z.string().min(1, "School name is required").max(255),
  timezone: z.string().max(100),
  defaultLocale: z.string().max(10),
  defaultCurrency: z.string().length(3, "Currency must be 3 characters"),
  academicYearStartMonth: z.string().max(2),
});

export type SchoolInfoValues = z.infer<typeof schoolInfoSchema>;

export const academicYearOnboardingSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export type AcademicYearOnboardingValues = z.infer<typeof academicYearOnboardingSchema>;

export const termOnboardingSchema = z.object({
  terms: z.array(
    z.object({
      name: z.string().min(1, "Name is required").max(100),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
    })
  ).min(1, "Add at least one term"),
});

export type TermOnboardingValues = z.infer<typeof termOnboardingSchema>;
