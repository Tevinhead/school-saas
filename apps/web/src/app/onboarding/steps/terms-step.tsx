"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface Term {
  name: string;
  startDate: string;
  endDate: string;
}

interface TermsStepProps {
  academicYearId: string;
  onNext: () => void;
  onBack: () => void;
}

export function TermsStep({ academicYearId, onNext, onBack }: TermsStepProps) {
  const [terms, setTerms] = useState<Term[]>([
    { name: "Term 1", startDate: "2025-08-01", endDate: "2025-10-31" },
    { name: "Term 2", startDate: "2025-11-01", endDate: "2026-01-31" },
    { name: "Term 3", startDate: "2026-02-01", endDate: "2026-04-30" },
    { name: "Term 4", startDate: "2026-05-01", endDate: "2026-06-30" },
  ]);
  const [saving, setSaving] = useState(false);

  const createTerm = trpc.tenant.createTerm.useMutation();

  function addTerm() {
    setTerms([...terms, { name: `Term ${terms.length + 1}`, startDate: "", endDate: "" }]);
  }

  function removeTerm(index: number) {
    setTerms(terms.filter((_, i) => i !== index));
  }

  function updateTerm(index: number, field: keyof Term, value: string) {
    setTerms(terms.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }

  async function handleSave() {
    if (terms.length === 0) {
      toast.error("Add at least one term");
      return;
    }

    setSaving(true);
    try {
      for (const term of terms) {
        if (!term.name || !term.startDate || !term.endDate) {
          toast.error("All term fields are required");
          setSaving(false);
          return;
        }
        await createTerm.mutateAsync({
          academicYearId,
          name: term.name,
          startDate: new Date(term.startDate),
          endDate: new Date(term.endDate),
        });
      }
      toast.success(`${terms.length} terms created`);
      onNext();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create terms");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Define the terms within your academic year.
      </p>
      <div className="space-y-3">
        {terms.map((term, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              {index === 0 && (
                <label className="mb-1 block text-xs font-medium">Name</label>
              )}
              <Input
                value={term.name}
                onChange={(e) => updateTerm(index, "name", e.target.value)}
                placeholder="Term name"
              />
            </div>
            <div className="w-36">
              {index === 0 && (
                <label className="mb-1 block text-xs font-medium">Start</label>
              )}
              <Input
                type="date"
                value={term.startDate}
                onChange={(e) => updateTerm(index, "startDate", e.target.value)}
              />
            </div>
            <div className="w-36">
              {index === 0 && (
                <label className="mb-1 block text-xs font-medium">End</label>
              )}
              <Input
                type="date"
                value={term.endDate}
                onChange={(e) => updateTerm(index, "endDate", e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeTerm(index)}
              disabled={terms.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addTerm}>
        <Plus className="mr-2 h-4 w-4" />
        Add Term
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
