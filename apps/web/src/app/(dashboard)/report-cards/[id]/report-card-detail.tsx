"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReportCardDetailProps {
  reportCardId: string;
}

export function ReportCardDetail({ reportCardId }: ReportCardDetailProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");

  const utils = trpc.useUtils();
  const { data: card, isLoading } = trpc.reportCard.getById.useQuery({ id: reportCardId });

  const submitMutation = trpc.reportCard.submit.useMutation({
    onSuccess: () => utils.reportCard.getById.invalidate({ id: reportCardId }),
  });
  const approveMutation = trpc.reportCard.approve.useMutation({
    onSuccess: () => utils.reportCard.getById.invalidate({ id: reportCardId }),
  });
  const rejectMutation = trpc.reportCard.reject.useMutation({
    onSuccess: () => {
      utils.reportCard.getById.invalidate({ id: reportCardId });
      setRejectDialogOpen(false);
      setRejectionNote("");
    },
  });
  const publishMutation = trpc.reportCard.publish.useMutation({
    onSuccess: () => utils.reportCard.getById.invalidate({ id: reportCardId }),
  });
  const commentsMutation = trpc.reportCard.updateComments.useMutation({
    onSuccess: () => utils.reportCard.getById.invalidate({ id: reportCardId }),
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!card) {
    return <div className="text-muted-foreground">Report card not found.</div>;
  }

  // Group grades by subject
  const bySubject: Record<string, typeof card.grades> = {};
  for (const g of card.grades) {
    if (!bySubject[g.subjectCode]) bySubject[g.subjectCode] = [];
    bySubject[g.subjectCode].push(g);
  }

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "secondary",
    submitted: "outline",
    approved: "default",
    published: "default",
  };

  // Get or initialize comments map
  const existingComments = new Map(
    (card.comments ?? []).map((c) => [c.classSectionId, c])
  );

  function handleSaveComments() {
    const commentInputs = document.querySelectorAll<HTMLTextAreaElement>("[data-comment-section]");
    const comments: Array<{ classSectionId: string; subjectName: string; comment: string }> = [];
    commentInputs.forEach((el) => {
      const sectionId = el.dataset.commentSection!;
      const subjectName = el.dataset.subjectName!;
      if (el.value.trim()) {
        comments.push({ classSectionId: sectionId, subjectName, comment: el.value.trim() });
      }
    });
    commentsMutation.mutate({ id: reportCardId, comments });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {card.studentLastName}, {card.studentFirstName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {card.studentNumber} &middot; {card.termName}
          </p>
        </div>
        <Badge variant={statusVariant[card.status] ?? "secondary"} className="text-sm">
          {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
        </Badge>
      </div>

      {card.rejectionNote && (
        <Card className="border-destructive">
          <CardContent className="py-3">
            <p className="text-sm text-destructive">
              <strong>Rejection note:</strong> {card.rejectionNote}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grades by subject */}
      {Object.entries(bySubject).map(([code, subjectGrades]) => {
        const subjectName = subjectGrades[0].subjectName;
        const sectionId = subjectGrades[0].classSectionId;
        const existingComment = existingComments.get(sectionId);

        return (
          <Card key={code}>
            <CardHeader>
              <CardTitle className="text-base">
                {subjectName} ({code})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectGrades.map((g, i) => (
                      <TableRow key={i}>
                        <TableCell>{g.assessmentName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{g.assessmentType}</Badge>
                        </TableCell>
                        <TableCell>
                          {g.score
                            ? `${g.score}${g.maxScore ? ` / ${g.maxScore}` : ""}`
                            : "\u2014"}
                        </TableCell>
                        <TableCell>{g.letterGrade || "\u2014"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {card.status === "draft" && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Teacher Comment</label>
                  <Textarea
                    data-comment-section={sectionId}
                    data-subject-name={subjectName}
                    defaultValue={existingComment?.comment ?? ""}
                    placeholder="Write a comment for this subject..."
                    rows={2}
                  />
                </div>
              )}
              {card.status !== "draft" && existingComment && (
                <p className="text-sm text-muted-foreground">
                  <strong>Comment:</strong> {existingComment.comment}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Action buttons based on status */}
      <div className="flex gap-2">
        {card.status === "draft" && (
          <>
            <Button
              variant="outline"
              onClick={handleSaveComments}
              disabled={commentsMutation.isPending}
            >
              {commentsMutation.isPending ? "Saving..." : "Save Comments"}
            </Button>
            <Button
              onClick={() => submitMutation.mutate({ id: reportCardId })}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
            </Button>
          </>
        )}
        {card.status === "submitted" && (
          <>
            <Button
              onClick={() => approveMutation.mutate({ id: reportCardId })}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setRejectDialogOpen(true)}
            >
              Reject
            </Button>
          </>
        )}
        {card.status === "approved" && (
          <Button
            onClick={() => publishMutation.mutate({ id: reportCardId })}
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending ? "Publishing..." : "Publish"}
          </Button>
        )}
      </div>

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Report Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  rejectMutation.mutate({ id: reportCardId, rejectionNote })
                }
                disabled={!rejectionNote.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
