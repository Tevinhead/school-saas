"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { SchoolInfoStep } from "./steps/school-info-step";
import { AcademicYearStep } from "./steps/academic-year-step";
import { TermsStep } from "./steps/terms-step";
import { GradeLevelsStep } from "./steps/grade-levels-step";
import { SubjectsStep } from "./steps/subjects-step";
import { CompletionStep } from "./steps/completion-step";

const STEPS = [
  { label: "School" },
  { label: "Year" },
  { label: "Terms" },
  { label: "Grades" },
  { label: "Subjects" },
  { label: "Done" },
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [academicYearId, setAcademicYearId] = useState<string>("");

  function next() {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="text-center text-2xl">Set Up Your School</CardTitle>
        <Stepper steps={STEPS} currentStep={currentStep} />
      </CardHeader>
      <CardContent>
        {currentStep === 0 && <SchoolInfoStep onNext={next} />}
        {currentStep === 1 && (
          <AcademicYearStep
            onNext={(yearId) => {
              setAcademicYearId(yearId);
              next();
            }}
            onBack={back}
          />
        )}
        {currentStep === 2 && (
          <TermsStep
            academicYearId={academicYearId}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 3 && <GradeLevelsStep onNext={next} onBack={back} />}
        {currentStep === 4 && <SubjectsStep onNext={next} onBack={back} />}
        {currentStep === 5 && <CompletionStep />}
      </CardContent>
    </Card>
  );
}
