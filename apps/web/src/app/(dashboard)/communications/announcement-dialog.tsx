"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  body: z.string().min(1, "Body is required"),
  audience: z.enum(["all", "teachers", "parents", "specific_class"]),
  audienceTargetId: z.string().optional(),
  isPublished: z.boolean(),
});

type AnnouncementValues = z.infer<typeof announcementSchema>;

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: {
    id: string;
    title: string;
    body: string;
    audience: string;
    audienceTargetId: string | null;
    isPublished: boolean;
  } | null;
}

export function AnnouncementDialog({
  open,
  onOpenChange,
  editing,
}: AnnouncementDialogProps) {
  const utils = trpc.useUtils();
  const { data: classes } = trpc.academic.listClasses.useQuery(undefined, {
    enabled: open,
  });

  const createMutation = trpc.communication.createAnnouncement.useMutation({
    onSuccess: () => {
      utils.communication.listAnnouncements.invalidate();
      onOpenChange(false);
      toast.success("Announcement created");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const updateMutation = trpc.communication.updateAnnouncement.useMutation({
    onSuccess: () => {
      utils.communication.listAnnouncements.invalidate();
      onOpenChange(false);
      toast.success("Announcement updated");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const form = useForm<AnnouncementValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      body: "",
      audience: "all",
      audienceTargetId: "",
      isPublished: false,
    },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        title: editing.title,
        body: editing.body,
        audience: editing.audience as AnnouncementValues["audience"],
        audienceTargetId: editing.audienceTargetId ?? "",
        isPublished: editing.isPublished,
      });
    } else {
      form.reset({
        title: "",
        body: "",
        audience: "all",
        audienceTargetId: "",
        isPublished: false,
      });
    }
  }, [editing, form]);

  const audience = form.watch("audience");

  function onSubmit(values: AnnouncementValues) {
    const payload = {
      title: values.title,
      body: values.body,
      audience: values.audience,
      audienceTargetId:
        values.audience === "specific_class" && values.audienceTargetId
          ? values.audienceTargetId
          : undefined,
      isPublished: values.isPublished,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Announcement" : "Create Announcement"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Announcement title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Write your announcement..."
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="teachers">Teachers</SelectItem>
                        <SelectItem value="parents">Parents</SelectItem>
                        <SelectItem value="specific_class">
                          Specific Class
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {audience === "specific_class" && (
                <FormField
                  control={form.control}
                  name="audienceTargetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Publish immediately</FormLabel>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : editing
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
