import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottom: "2pt solid #2563eb",
    paddingBottom: 12,
  },
  schoolName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  studentSection: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  studentName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  termSection: {
    marginBottom: 16,
  },
  termHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#eff6ff",
    padding: 6,
    marginBottom: 4,
    color: "#1e40af",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 5,
    borderBottom: "0.5pt solid #e5e7eb",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 5,
    borderBottom: "0.5pt solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },
  colSubject: {
    width: "50%",
  },
  colScore: {
    width: "25%",
    textAlign: "center",
  },
  colGrade: {
    width: "25%",
    textAlign: "center",
  },
  gpaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 5,
    marginTop: 2,
  },
  gpaLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginRight: 8,
  },
  gpaValue: {
    fontSize: 10,
    color: "#2563eb",
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTop: "0.5pt solid #e5e7eb",
    paddingTop: 8,
  },
  officialNote: {
    marginTop: 30,
    fontSize: 8,
    color: "#6b7280",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export interface TranscriptData {
  student: { firstName: string; lastName: string };
  schoolName: string;
  terms: Array<{
    academicYear: string;
    term: string;
    grades: Array<{ subject: string; score: number; grade: string }>;
    gpa?: number;
  }>;
}

export function TranscriptDocument({ data }: { data: TranscriptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* School header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{data.schoolName}</Text>
          <Text style={styles.title}>Official Academic Transcript</Text>
          <Text style={styles.subtitle}>
            This document is a summary of academic records.
          </Text>
        </View>

        {/* Student info */}
        <View style={styles.studentSection}>
          <Text style={styles.studentName}>
            {data.student.firstName} {data.student.lastName}
          </Text>
        </View>

        {/* Terms */}
        {data.terms.map((term, ti) => (
          <View key={ti} style={styles.termSection}>
            <Text style={styles.termHeader}>
              {term.academicYear} — {term.term}
            </Text>

            <View style={styles.tableHeader}>
              <Text style={styles.colSubject}>Subject</Text>
              <Text style={styles.colScore}>Score</Text>
              <Text style={styles.colGrade}>Grade</Text>
            </View>

            {term.grades.map((g, gi) => (
              <View
                key={gi}
                style={gi % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={styles.colSubject}>{g.subject}</Text>
                <Text style={styles.colScore}>{g.score}</Text>
                <Text style={styles.colGrade}>{g.grade}</Text>
              </View>
            ))}

            {term.gpa !== undefined && (
              <View style={styles.gpaRow}>
                <Text style={styles.gpaLabel}>GPA:</Text>
                <Text style={styles.gpaValue}>{term.gpa.toFixed(2)}</Text>
              </View>
            )}
          </View>
        ))}

        <Text style={styles.officialNote}>
          This is an official academic transcript issued by {data.schoolName}.
        </Text>

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${data.schoolName} — Transcript — Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
