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
    fontSize: 11,
    color: "#4b5563",
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
  studentDetail: {
    fontSize: 9,
    color: "#6b7280",
  },
  gradesSection: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottom: "0.5pt solid #e5e7eb",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 6,
    borderBottom: "0.5pt solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },
  colSubject: {
    width: "30%",
  },
  colScore: {
    width: "15%",
    textAlign: "center",
  },
  colGrade: {
    width: "15%",
    textAlign: "center",
  },
  colComment: {
    width: "40%",
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
  publishedDate: {
    marginTop: 20,
    fontSize: 9,
    color: "#6b7280",
    textAlign: "right",
  },
});

export interface ReportCardData {
  student: { firstName: string; lastName: string; dateOfBirth?: string };
  schoolName: string;
  academicYear: string;
  term: string;
  grades: Array<{
    subject: string;
    score: number;
    grade: string;
    teacherComment?: string;
  }>;
  publishedAt?: string;
}

export function ReportCardDocument({ data }: { data: ReportCardData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* School header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{data.schoolName}</Text>
          <Text style={styles.title}>Student Report Card</Text>
          <Text style={styles.subtitle}>
            {data.academicYear} — {data.term}
          </Text>
        </View>

        {/* Student info */}
        <View style={styles.studentSection}>
          <Text style={styles.studentName}>
            {data.student.firstName} {data.student.lastName}
          </Text>
          {data.student.dateOfBirth && (
            <Text style={styles.studentDetail}>
              Date of Birth: {data.student.dateOfBirth}
            </Text>
          )}
        </View>

        {/* Grades table */}
        <View style={styles.gradesSection}>
          <View style={styles.tableHeader}>
            <Text style={styles.colSubject}>Subject</Text>
            <Text style={styles.colScore}>Score</Text>
            <Text style={styles.colGrade}>Grade</Text>
            <Text style={styles.colComment}>Comments</Text>
          </View>
          {data.grades.map((g, i) => (
            <View
              key={i}
              style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.colSubject}>{g.subject}</Text>
              <Text style={styles.colScore}>{g.score}</Text>
              <Text style={styles.colGrade}>{g.grade}</Text>
              <Text style={styles.colComment}>{g.teacherComment ?? ""}</Text>
            </View>
          ))}
        </View>

        {/* Published date */}
        {data.publishedAt && (
          <Text style={styles.publishedDate}>
            Published: {new Date(data.publishedAt).toLocaleDateString()}
          </Text>
        )}

        {/* Footer with page number */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${data.schoolName} — Report Card — Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
