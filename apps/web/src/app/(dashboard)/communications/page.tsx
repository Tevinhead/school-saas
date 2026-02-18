"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnouncementsTab } from "./announcements-tab";
import { MessagesTab } from "./messages-tab";

export default function CommunicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Communications</h1>
        <p className="text-muted-foreground">
          Manage announcements and messages.
        </p>
      </div>

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="announcements" className="mt-4">
          <AnnouncementsTab />
        </TabsContent>
        <TabsContent value="messages" className="mt-4">
          <MessagesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
