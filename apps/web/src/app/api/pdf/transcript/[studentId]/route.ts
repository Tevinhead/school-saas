import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    // Dynamic import to handle case where package not installed
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { TranscriptDocument } = await import(
      "@/lib/pdf/transcript-template"
    );

    // TODO: Fetch real data via server tRPC caller using the studentId
    const mockData = {
      student: { firstName: "Sample", lastName: "Student" },
      schoolName: "School SaaS",
      terms: [
        {
          academicYear: "2024-2025",
          term: "Term 1",
          grades: [
            { subject: "Mathematics", score: 92, grade: "A" },
            { subject: "English", score: 85, grade: "B" },
            { subject: "Science", score: 78, grade: "C" },
          ],
          gpa: 3.5,
        },
        {
          academicYear: "2024-2025",
          term: "Term 2",
          grades: [
            { subject: "Mathematics", score: 88, grade: "B" },
            { subject: "English", score: 90, grade: "A" },
            { subject: "Science", score: 82, grade: "B" },
          ],
          gpa: 3.6,
        },
      ],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(TranscriptDocument({ data: mockData }) as any);

    return new Response(new Uint8Array(buffer as Buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="transcript-${studentId}.pdf"`,
      },
    });
  } catch (e) {
    console.error("[PDF transcript]", e);
    return NextResponse.json(
      {
        error:
          "PDF generation not available. Install @react-pdf/renderer to enable.",
      },
      { status: 503 }
    );
  }
}
