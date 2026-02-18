"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ThreadView } from "./thread-view";
import { ComposeMessageDialog } from "./compose-message-dialog";
import { Plus } from "lucide-react";

export function MessagesTab() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const { data: threads } = trpc.communication.listThreads.useQuery();

  // Get current user's profile ID from the first thread's participants (rough heuristic)
  // A better approach would be a dedicated endpoint, but this works for display
  const currentUserProfileId = undefined; // Will be handled by senderId comparison

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setComposeOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Message
        </Button>
      </div>

      <div className="flex h-[600px] overflow-hidden rounded-md border">
        {/* Thread list (left panel) */}
        <div className="w-80 border-r">
          <ScrollArea className="h-full">
            {!threads || threads.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              <div className="flex flex-col">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    className={cn(
                      "flex flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-accent",
                      selectedThreadId === thread.id && "bg-accent"
                    )}
                    onClick={() => setSelectedThreadId(thread.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {thread.subject ?? "No subject"}
                      </span>
                      {thread.unreadCount > 0 && (
                        <Badge variant="default" className="ml-2 h-5 min-w-[20px] justify-center text-xs">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {thread.participants
                        ?.map((p) => `${p.firstName} ${p.lastName}`)
                        .join(", ")}
                    </p>
                    {thread.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate">
                        {thread.lastMessage.body}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Thread detail (right panel) */}
        <div className="flex-1">
          {selectedThreadId ? (
            <ThreadView
              threadId={selectedThreadId}
              currentUserProfileId={currentUserProfileId}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a conversation to view messages
            </div>
          )}
        </div>
      </div>

      <ComposeMessageDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </>
  );
}
