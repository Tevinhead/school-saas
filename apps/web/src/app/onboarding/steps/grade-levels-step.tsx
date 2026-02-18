"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

const PRESETS = {
  "IB MYP": [
    "MYP 1", "MYP 2", "MYP 3", "MYP 4", "MYP 5",
  ],
  British: [
    "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13",
  ],
  American: [
    "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
  ],
};

interface GradeLevel {
  name: string;
  sortOrder: number;
}

interface GradeLevelsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function GradeLevelsStep({ onNext, onBack }: GradeLevelsStepProps) {
  const [levels, setLevels] = useState<GradeLevel[]>([]);
  const [saving, setSaving] = useState(false);

  const createGradeLevel = trpc.academic.createGradeLevel.useMutation();

  function loadPreset(presetName: keyof typeof PRESETS) {
    const names = PRESETS[presetName];
    setLevels(names.map((name, i) => ({ name, sortOrder: i + 1 })));
  }

  function addLevel() {
    setLevels([...levels, { name: "", sortOrder: levels.length + 1 }]);
  }

  function removeLevel(index: number) {
    setLevels(levels.filter((_, i) => i !== index));
  }

  function updateLevel(index: number, name: string) {
    setLevels(levels.map((l, i) => (i === index ? { ...l, name } : l)));
  }

  async function handleSave() {
    if (levels.length === 0) {
      toast.error("Add at least one grade level");
      return;
    }

    setSaving(true);
    try {
      for (const level of levels) {
        if (!level.name) {
          toast.error("All grade level names are required");
          setSaving(false);
          return;
        }
        await createGradeLevel.mutateAsync({
          name: level.name,
          sortOrder: level.sortOrder,
        });
      }
      toast.success(`${levels.length} grade levels created`);
      onNext();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create grade levels");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add grade levels for your school, or pick a preset.
      </p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((preset) => (
          <Badge
            key={preset}
            variant="outline"
            className="cursor-pointer hover:bg-accent"
            onClick={() => loadPreset(preset)}
          >
            {preset}
          </Badge>
        ))}
      </div>
      <div className="space-y-2">
        {levels.map((level, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-8 text-center text-sm text-muted-foreground">
              {level.sortOrder}
            </span>
            <Input
              value={level.name}
              onChange={(e) => updateLevel(index, e.target.value)}
              placeholder="Grade level name"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeLevel(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addLevel}>
        <Plus className="mr-2 h-4 w-4" />
        Add Grade Level
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
