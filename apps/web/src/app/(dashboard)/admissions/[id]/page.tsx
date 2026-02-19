"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STATUSES = [
  "inquiry",
  "applied",
  "interviewed",
  "accepted",
  "enrolled",
  "rejected",
  "waitlisted",
] as const;

const STATUS_COLORS: Record<string, string> = {
  inquiry: "bg-gray-100 text-gray-800",
  applied: "bg-blue-100 text-blue-800",
  interviewed: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  enrolled: "bg-teal-100 text-teal-800",
  rejected: "bg-red-100 text-red-800",
  waitlisted: "bg-orange-100 text-orange-800",
};

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();

  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: application, isLoading } = trpc.admissions.getApplication.useQuery({
    id: params.id,
  });

  const updateStatus = trpc.admissions.updateStatus.useMutation({
    onSuccess: () => utils.admissions.getApplication.invalidate({ id: params.id }),
  });

  const createInterview = trpc.admissions.createInterview.useMutation({
    onSuccess: () => {
      utils.admissions.getApplication.invalidate({ id: params.id });
      setInterviewOpen(false);
      setInterviewDate("");
      setInterviewNotes("");
    },
  });

  const deleteApplication = trpc.admissions.deleteApplication.useMutation({
    onSuccess: () => router.push("/admissions"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Application Detail</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-md" />
          <div className="h-48 bg-muted rounded-md" />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Application Not Found</h1>
        <p className="text-muted-foreground">This application does not exist or you do not have access.</p>
        <Button variant="outline" asChild>
          <Link href="/admissions">Back to Admissions</Link>
        </Button>
      </div>
    );
  }

  const handleStatusChange = (status: string) => {
    updateStatus.mutate({ id: params.id, status: status as typeof STATUSES[number] });
  };

  const handleScheduleInterview = () => {
    if (!interviewDate) return;
    createInterview.mutate({
      applicationId: params.id,
      scheduledAt: new Date(interviewDate).toISOString(),
      notes: interviewNotes || undefined,
    });
  };

  const handleDelete = () => {
    deleteApplication.mutate({ id: params.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {application.studentFirstName} {application.studentLastName}
          </h1>
          <p className="text-muted-foreground">Application Detail</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admissions">Back</Link>
          </Button>
          {application.status === "accepted" && (
            <Button size="sm" asChild>
              <Link
                href={`/students?new=true&firstName=${encodeURIComponent(application.studentFirstName)}&lastName=${encodeURIComponent(application.studentLastName)}`}
              >
                Convert to Student
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Application Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{application.studentFirstName} {application.studentLastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth</span>
              <span>{application.dateOfBirth ? new Date(application.dateOfBirth).toLocaleDateString() : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Applied</span>
              <span>{application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : "-"}</span>
            </div>
            {application.notes && (
              <div>
                <span className="text-muted-foreground block mb-1">Notes</span>
                <p className="text-sm bg-muted/50 p-2 rounded">{application.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Guardian & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guardian</span>
              <span className="font-medium">{application.guardianName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{application.guardianEmail}</span>
            </div>
            {application.guardianPhone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{application.guardianPhone}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Select value={application.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {application.documents && application.documents.length > 0 ? (
            <div className="space-y-2">
              {application.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div>
                    <span className="font-medium">{doc.fileName}</span>
                    <span className="text-muted-foreground ml-2 text-xs capitalize">{doc.type.replace("_", " ")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Interviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Interviews</CardTitle>
          <Dialog open={interviewOpen} onOpenChange={setInterviewOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">Schedule Interview</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Interview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    placeholder="Interview notes..."
                  />
                </div>
                <Button
                  onClick={handleScheduleInterview}
                  disabled={!interviewDate || createInterview.isPending}
                  className="w-full"
                >
                  {createInterview.isPending ? "Scheduling..." : "Schedule"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {application.interviews && application.interviews.length > 0 ? (
            <div className="space-y-3">
              {application.interviews.map((iv) => (
                <div key={iv.id} className="p-3 border rounded text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleString() : "TBD"}
                    </span>
                    {iv.outcome && (
                      <Badge variant="outline">{iv.outcome}</Badge>
                    )}
                  </div>
                  {iv.notes && <p className="text-muted-foreground">{iv.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No interviews scheduled.</p>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          {!deleteConfirm ? (
            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(true)}>
              Delete Application
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-600">Are you sure? This cannot be undone.</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteApplication.isPending}
              >
                {deleteApplication.isPending ? "Deleting..." : "Confirm Delete"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
