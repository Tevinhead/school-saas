"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

const COMMON_SUBJECTS = [
  { name: "Mathematics", code: "MATH" },
  { name: "English Language", code: "ENG" },
  { name: "Science", code: "SCI" },
  { name: "Social Studies", code: "SS" },
  { name: "Physical Education", code: "PE" },
  { name: "Art", code: "ART" },
  { name: "Music", code: "MUS" },
  { name: "Computer Science", code: "CS" },
  { name: "Foreign Language", code: "FL" },
  { name: "History", code: "HIST" },
];

interface Subject {
  name: string;
  code: string;
}

interface SubjectsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function SubjectsStep({ onNext, onBack }: SubjectsStepProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [saving, setSaving] = useState(false);

  const createSubject = trpc.academic.createSubject.useMutation();

  function loadCommon() {
    setSubjects([...COMMON_SUBJECTS]);
  }

  function addSubject() {
    setSubjects([...subjects, { name: "", code: "" }]);
  }

  function removeSubject(index: number) {
    setSubjects(subjects.filter((_, i) => i !== index));
  }

  function updateSubject(index: number, field: keyof Subject, value: string) {
    setSubjects(subjects.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  async function handleSave() {
    if (subjects.length === 0) {
      toast.error("Add at least one subject");
      return;
    }

    setSaving(true);
    try {
      for (const subject of subjects) {
        if (!subject.name || !subject.code) {
          toast.error("All subject fields are required");
          setSaving(false);
          return;
        }
        await createSubject.mutateAsync({
          name: subject.name,
          code: subject.code,
        });
      }
      toast.success(`${subjects.length} subjects created`);
      onNext();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create subjects");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add the subjects taught at your school.
      </p>
      <div>
        <Badge
          variant="outline"
          className="cursor-pointer hover:bg-accent"
          onClick={loadCommon}
        >
          Load common subjects
        </Badge>
      </div>
      <div className="space-y-2">
        {subjects.map((subject, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={subject.name}
              onChange={(e) => updateSubject(index, "name", e.target.value)}
              placeholder="Subject name"
              className="flex-1"
            />
            <Input
              value={subject.code}
              onChange={(e) => updateSubject(index, "code", e.target.value.toUpperCase())}
              placeholder="CODE"
              className="w-24"
              maxLength={20}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSubject(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addSubject}>
        <Plus className="mr-2 h-4 w-4" />
        Add Subject
      </Button>
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Next"}
        </Button>
      </div>
    </div>
  );
}
