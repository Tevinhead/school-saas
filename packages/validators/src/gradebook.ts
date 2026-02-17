import { z } from "zod";

export const gradingScaleTypeEnum = ["numeric", "letter", "percentage"] as const;
export const assessmentTypeEnum = ["homework", "quiz", "test", "exam", "project"] as const;

export const createGradingScaleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(gradingScaleTypeEnum),
  scaleDefinition: z.record(z.unknown()),
  isDefault: z.boolean().default(false),
});

export const createAssessmentSchema = z.object({
  classSectionId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(255),
  type: z.enum(assessmentTypeEnum),
  gradingScaleId: z.string().uuid().optional(),
  maxScore: z.number().positive("Max score must be positive").optional(),
  weight: z.number().min(0).max(100, "Weight must be between 0 and 100").optional(),
  dueDate: z.date().optional(),
  isPublished: z.boolean().default(false),
});

export const submitGradesSchema = z.object({
  assessmentId: z.string().uuid(),
  grades: z.array(
    z.object({
      studentId: z.string().uuid(),
      score: z.number().optional(),
      letterGrade: z.string().max(5).optional(),
      comments: z.string().optional(),
    })
  ),
});

// Preset grading scales for international schools
export const GRADING_PRESETS = {
  IB: {
    name: "IB (1-7)",
    type: "numeric" as const,
    scaleDefinition: {
      min: 1,
      max: 7,
      grades: [
        { value: 7, label: "Excellent" },
        { value: 6, label: "Very Good" },
        { value: 5, label: "Good" },
        { value: 4, label: "Satisfactory" },
        { value: 3, label: "Mediocre" },
        { value: 2, label: "Poor" },
        { value: 1, label: "Very Poor" },
      ],
    },
  },
  BRITISH: {
    name: "British (A*-U)",
    type: "letter" as const,
    scaleDefinition: {
      grades: [
        { value: "A*", label: "Exceptional", minPercent: 90 },
        { value: "A", label: "Excellent", minPercent: 80 },
        { value: "B", label: "Good", minPercent: 70 },
        { value: "C", label: "Satisfactory", minPercent: 60 },
        { value: "D", label: "Below Average", minPercent: 50 },
        { value: "E", label: "Poor", minPercent: 40 },
        { value: "U", label: "Ungraded", minPercent: 0 },
      ],
    },
  },
  AMERICAN: {
    name: "American (A-F)",
    type: "letter" as const,
    scaleDefinition: {
      grades: [
        { value: "A", label: "Excellent", minPercent: 90 },
        { value: "B", label: "Good", minPercent: 80 },
        { value: "C", label: "Average", minPercent: 70 },
        { value: "D", label: "Below Average", minPercent: 60 },
        { value: "F", label: "Failing", minPercent: 0 },
      ],
    },
  },
  PERCENTAGE: {
    name: "Percentage (0-100%)",
    type: "percentage" as const,
    scaleDefinition: {
      min: 0,
      max: 100,
    },
  },
} as const;

export type CreateGradingScaleInput = z.infer<typeof createGradingScaleSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type SubmitGradesInput = z.infer<typeof submitGradesSchema>;
