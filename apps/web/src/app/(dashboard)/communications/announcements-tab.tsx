"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import {
  createAnnouncementColumns,
  type AnnouncementRow,
} from "./announcement-columns";
import { AnnouncementDialog } from "./announcement-dialog";
import { Plus } from "lucide-react";

export function AnnouncementsTab() {
  const [audienceFilter, setAudienceFilter] = useState<string>("");
  const [showDrafts, setShowDrafts] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);

  const utils = trpc.useUtils();

  const { data: announcementList } = trpc.communication.listAnnouncements.useQuery({
    publishedOnly: !showDrafts,
    audience: (audienceFilter as "all" | "teachers" | "parents" | "specific_class") || undefined,
  });

  const deleteMutation = trpc.communication.deleteAnnouncement.useMutation({
    onSuccess: () => {
      utils.communication.listAnnouncements.invalidate();
      toast.success("Announcement deleted");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const columns = useMemo(
    () =>
      createAnnouncementColumns({
        onEdit: (row) => {
          setEditing(row);
          setDialogOpen(true);
        },
        onDelete: (id) => {
          deleteMutation.mutate({ id });
        },
      }),
    [deleteMutation]
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-40">
            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All audiences" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_filter">All audiences</SelectItem>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="teachers">Teachers</SelectItem>
                <SelectItem value="parents">Parents</SelectItem>
                <SelectItem value="specific_class">Class</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showDrafts}
              onChange={(e) => setShowDrafts(e.target.checked)}
              className="h-4 w-4 rounded border"
            />
            Show drafts
          </label>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Announcement
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={(announcementList as AnnouncementRow[]) ?? []}
      />

      <AnnouncementDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        editing={editing}
      />
    </>
  );
}
