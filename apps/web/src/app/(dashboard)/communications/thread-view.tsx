"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

interface ThreadViewProps {
  threadId: string;
  currentUserProfileId?: string;
}

export function ThreadView({ threadId, currentUserProfileId }: ThreadViewProps) {
  const [replyBody, setReplyBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: threadData } = trpc.communication.getThread.useQuery({
    threadId,
  });

  const markReadMutation = trpc.communication.markMessagesRead.useMutation({
    onSuccess: () => {
      utils.communication.listThreads.invalidate();
    },
  });

  const sendMutation = trpc.communication.sendMessage.useMutation({
    onSuccess: () => {
      utils.communication.getThread.invalidate({ threadId });
      utils.communication.listThreads.invalidate();
      setReplyBody("");
    },
  });

  // Auto-mark messages as read
  useEffect(() => {
    if (threadId) {
      markReadMutation.mutate({ threadId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadData?.messages]);

  function handleReply() {
    if (!replyBody.trim()) return;
    const recipientIds = threadData?.participants
      ?.filter((p) => p.userId !== currentUserProfileId)
      .map((p) => p.userId) ?? [];

    sendMutation.mutate({
      threadId,
      recipientIds,
      body: replyBody,
    });
  }

  if (!threadData?.thread) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a conversation
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">
          {threadData.thread.subject ?? "No subject"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {threadData.participants?.map((p) => `${p.firstName} ${p.lastName}`).join(", ")}
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {threadData.messages.map((msg) => {
            const isSender = msg.senderId === currentUserProfileId;
            return (
              <div
                key={msg.id}
                className={cn("flex", isSender ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-4 py-2",
                    isSender
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {!isSender && (
                    <p className="mb-1 text-xs font-medium">
                      {msg.senderFirstName} {msg.senderLastName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      isSender ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Reply form */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Type a reply..."
            rows={2}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleReply();
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleReply}
            disabled={sendMutation.isPending || !replyBody.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
