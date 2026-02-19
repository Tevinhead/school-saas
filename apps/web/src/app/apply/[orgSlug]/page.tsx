"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

const GRADES = [
  "Pre-K",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

interface FormData {
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  gradeLabel: string;
  notes: string;
}

const initialFormData: FormData = {
  studentFirstName: "",
  studentLastName: "",
  dateOfBirth: "",
  guardianName: "",
  guardianEmail: "",
  guardianPhone: "",
  gradeLabel: "",
  notes: "",
};

export default function ApplyPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);

  // Unwrap params
  if (!orgSlug) {
    params.then((p) => setOrgSlug(p.orgSlug));
  }

  const createApplication = trpc.admissions.createApplication.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!orgSlug) return;
    createApplication.mutate({
      tenantId: orgSlug,
      studentFirstName: formData.studentFirstName,
      studentLastName: formData.studentLastName,
      dateOfBirth: formData.dateOfBirth,
      guardianName: formData.guardianName,
      guardianEmail: formData.guardianEmail,
      guardianPhone: formData.guardianPhone || undefined,
      notes: formData.notes || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600">
            Thank you for your application. We will review it and contact you at{" "}
            <strong>{formData.guardianEmail}</strong> with updates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Application</h1>
          <p className="text-gray-600 mt-2">Complete the form below to apply for admission.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 ${s < step ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Step 1: Student Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Student Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.studentFirstName}
                  onChange={(e) => updateField("studentFirstName", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.studentLastName}
                  onChange={(e) => updateField("studentLastName", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField("dateOfBirth", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Guardian Info */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Guardian Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.guardianName}
                  onChange={(e) => updateField("guardianName", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.guardianEmail}
                  onChange={(e) => updateField("guardianEmail", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.guardianPhone}
                  onChange={(e) => updateField("guardianPhone", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: Grade Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Grade Level</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Grade Level
                </label>
                <select
                  value={formData.gradeLabel}
                  onChange={(e) => updateField("gradeLabel", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a grade...</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional information..."
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Review & Submit</h2>
              <div className="bg-gray-50 rounded-md p-4 space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Student:</span>{" "}
                  {formData.studentFirstName} {formData.studentLastName}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Date of Birth:</span>{" "}
                  {formData.dateOfBirth}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Guardian:</span>{" "}
                  {formData.guardianName}
                </div>
                <div>
                  <span className="font-medium text-gray-500">Email:</span>{" "}
                  {formData.guardianEmail}
                </div>
                {formData.guardianPhone && (
                  <div>
                    <span className="font-medium text-gray-500">Phone:</span>{" "}
                    {formData.guardianPhone}
                  </div>
                )}
                {formData.gradeLabel && (
                  <div>
                    <span className="font-medium text-gray-500">Grade:</span>{" "}
                    {formData.gradeLabel}
                  </div>
                )}
                {formData.notes && (
                  <div>
                    <span className="font-medium text-gray-500">Notes:</span>{" "}
                    {formData.notes}
                  </div>
                )}
              </div>
              {createApplication.error && (
                <p className="text-red-600 text-sm">
                  Error submitting application. Please try again.
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!formData.studentFirstName || !formData.studentLastName || !formData.dateOfBirth)) ||
                  (step === 2 && (!formData.guardianName || !formData.guardianEmail))
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createApplication.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {createApplication.isPending ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
