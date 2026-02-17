"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ScaleDialog } from "./scale-dialog";

const presets = [
  {
    name: "IB (1-7)",
    type: "numeric" as const,
    scaleDefinition: {
      min: 1,
      max: 7,
      grades: [
        { label: "7", min: 90 },
        { label: "6", min: 80 },
        { label: "5", min: 70 },
        { label: "4", min: 55 },
        { label: "3", min: 40 },
        { label: "2", min: 25 },
        { label: "1", min: 0 },
      ],
    },
  },
  {
    name: "British (A*-U)",
    type: "letter" as const,
    scaleDefinition: {
      grades: [
        { label: "A*", min: 90 },
        { label: "A", min: 80 },
        { label: "B", min: 70 },
        { label: "C", min: 60 },
        { label: "D", min: 50 },
        { label: "E", min: 40 },
        { label: "U", min: 0 },
      ],
    },
  },
  {
    name: "American (A-F)",
    type: "letter" as const,
    scaleDefinition: {
      grades: [
        { label: "A", min: 90 },
        { label: "B", min: 80 },
        { label: "C", min: 70 },
        { label: "D", min: 60 },
        { label: "F", min: 0 },
      ],
    },
  },
  {
    name: "Percentage (0-100)",
    type: "percentage" as const,
    scaleDefinition: { min: 0, max: 100 },
  },
];

export default function GradingScalesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<{
    id: string;
    name: string;
    type: string;
    scaleDefinition: Record<string, unknown>;
    isDefault: boolean;
  } | null>(null);

  const utils = trpc.useUtils();
  const { data: scales, isLoading } = trpc.gradebook.listGradingScales.useQuery();

  const createMutation = trpc.gradebook.createGradingScale.useMutation({
    onSuccess: () => utils.gradebook.listGradingScales.invalidate(),
  });

  const deleteMutation = trpc.gradebook.deleteGradingScale.useMutation({
    onSuccess: () => utils.gradebook.listGradingScales.invalidate(),
  });

  function seedPreset(preset: (typeof presets)[number]) {
    createMutation.mutate({
      name: preset.name,
      type: preset.type,
      scaleDefinition: preset.scaleDefinition,
      isDefault: false,
    });
  }

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Grading Scales</h1>
            <p className="text-muted-foreground">
              Define grading scales for assessments.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingScale(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Scale
          </Button>
        </div>

        {scales?.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Start</CardTitle>
              <CardDescription>
                Seed from a preset grading scale to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <Button
                    key={p.name}
                    variant="outline"
                    size="sm"
                    onClick={() => seedPreset(p)}
                    disabled={createMutation.isPending}
                  >
                    {p.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {scales?.map((scale) => (
            <Card key={scale.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{scale.name}</CardTitle>
                  <Badge variant="outline">{scale.type}</Badge>
                  {scale.isDefault && <Badge>Default</Badge>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingScale(scale);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate({ id: scale.id })}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardDescription className="px-6 pb-4">
                <code className="text-xs">
                  {JSON.stringify(scale.scaleDefinition).slice(0, 100)}
                  {JSON.stringify(scale.scaleDefinition).length > 100 ? "..." : ""}
                </code>
              </CardDescription>
            </Card>
          ))}
        </div>
      </div>

      <ScaleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingScale={editingScale}
      />
    </>
  );
}
