"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ComposeMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComposeMessageDialog({
  open,
  onOpenChange,
}: ComposeMessageDialogProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<
    Array<{ id: string; firstName: string; lastName: string }>
  >([]);

  const utils = trpc.useUtils();

  const { data: users } = trpc.communication.listUsers.useQuery(
    { search: search || undefined },
    { enabled: open }
  );

  const sendMutation = trpc.communication.sendMessage.useMutation({
    onSuccess: () => {
      utils.communication.listThreads.invalidate();
      onOpenChange(false);
      setSubject("");
      setBody("");
      setSearch("");
      setSelectedRecipients([]);
      toast.success("Message sent");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  function addRecipient(user: { id: string; firstName: string; lastName: string }) {
    if (!selectedRecipients.find((r) => r.id === user.id)) {
      setSelectedRecipients((prev) => [...prev, user]);
    }
    setSearch("");
  }

  function removeRecipient(id: string) {
    setSelectedRecipients((prev) => prev.filter((r) => r.id !== id));
  }

  function handleSend() {
    if (!body.trim() || selectedRecipients.length === 0) return;
    sendMutation.mutate({
      subject: subject || undefined,
      recipientIds: selectedRecipients.map((r) => r.id),
      body,
    });
  }

  const availableUsers = users?.filter(
    (u) => !selectedRecipients.find((r) => r.id === u.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Recipients</label>
            <div className="mb-2 flex flex-wrap gap-1">
              {selectedRecipients.map((r) => (
                <Badge key={r.id} variant="secondary" className="gap-1">
                  {r.firstName} {r.lastName}
                  <button
                    type="button"
                    onClick={() => removeRecipient(r.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="relative">
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && availableUsers && availableUsers.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => addRecipient(user)}
                    >
                      <span>
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-muted-foreground">({user.role})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject (optional)"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Message</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={5}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                sendMutation.isPending ||
                !body.trim() ||
                selectedRecipients.length === 0
              }
            >
              {sendMutation.isPending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
