import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Dynamic import to handle case where package not installed
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { ReportCardDocument } = await import(
      "@/lib/pdf/report-card-template"
    );

    // TODO: Fetch real data via server tRPC caller using the report card id
    const mockData = {
      student: { firstName: "Sample", lastName: "Student" },
      schoolName: "School SaaS",
      academicYear: "2024-2025",
      term: "Term 1",
      grades: [
        {
          subject: "Mathematics",
          score: 92,
          grade: "A",
          teacherComment: "Excellent work",
        },
        {
          subject: "English",
          score: 85,
          grade: "B",
          teacherComment: "Good progress",
        },
        {
          subject: "Science",
          score: 78,
          grade: "C",
          teacherComment: "Needs improvement in lab work",
        },
      ],
      publishedAt: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(ReportCardDocument({ data: mockData }) as any);

    return new Response(new Uint8Array(buffer as Buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-card-${id}.pdf"`,
      },
    });
  } catch (e) {
    console.error("[PDF report-card]", e);
    return NextResponse.json(
      {
        error:
          "PDF generation not available. Install @react-pdf/renderer to enable.",
      },
      { status: 503 }
    );
  }
}
