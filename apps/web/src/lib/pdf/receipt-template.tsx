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
    marginBottom: 24,
    borderBottom: "2pt solid #2563eb",
    paddingBottom: 12,
  },
  schoolName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    marginBottom: 2,
  },
  schoolNameKh: {
    fontSize: 14,
    color: "#2563eb",
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  titleKh: {
    fontSize: 12,
    color: "#4b5563",
  },
  receiptNumber: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 4,
  },
  body: {
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottom: "0.5pt solid #e5e7eb",
  },
  labelCol: {
    width: "30%",
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  valueCol: {
    width: "40%",
    fontSize: 10,
  },
  labelKhCol: {
    width: "30%",
    fontSize: 10,
    color: "#6b7280",
    textAlign: "right",
  },
  amountRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottom: "1pt solid #2563eb",
    marginTop: 4,
  },
  amountLabel: {
    width: "30%",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  amountValue: {
    width: "40%",
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#2563eb",
  },
  amountLabelKh: {
    width: "30%",
    fontSize: 11,
    color: "#6b7280",
    textAlign: "right",
  },
  amountInWords: {
    marginTop: 6,
    fontSize: 9,
    color: "#6b7280",
    fontStyle: "italic",
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
  signatureSection: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBlock: {
    width: "40%",
    textAlign: "center",
  },
  signatureLine: {
    borderTop: "1pt solid #1a1a1a",
    marginTop: 40,
    paddingTop: 4,
    fontSize: 9,
  },
});

export interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  guardianName: string;
  amount: number;
  currency: string;
  amountInWords: string;
  paymentDate: string;
  method: string;
  schoolName: string;
  schoolNameKh?: string;
}

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Bilingual header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{data.schoolName}</Text>
          {data.schoolNameKh && (
            <Text style={styles.schoolNameKh}>{data.schoolNameKh}</Text>
          )}
          <Text style={styles.title}>Payment Receipt</Text>
          <Text style={styles.titleKh}>បង្កាន់ដៃ</Text>
          <Text style={styles.receiptNumber}>No. {data.receiptNumber}</Text>
        </View>

        {/* Body — bilingual rows */}
        <View style={styles.body}>
          {/* Student */}
          <View style={styles.row}>
            <Text style={styles.labelCol}>Student</Text>
            <Text style={styles.valueCol}>{data.studentName}</Text>
            <Text style={styles.labelKhCol}>សិស្ស</Text>
          </View>

          {/* Guardian */}
          <View style={styles.row}>
            <Text style={styles.labelCol}>Guardian</Text>
            <Text style={styles.valueCol}>{data.guardianName}</Text>
            <Text style={styles.labelKhCol}>អាណាព្យាបាល</Text>
          </View>

          {/* Payment Date */}
          <View style={styles.row}>
            <Text style={styles.labelCol}>Date</Text>
            <Text style={styles.valueCol}>{data.paymentDate}</Text>
            <Text style={styles.labelKhCol}>កាលបរិច្ឆេទ</Text>
          </View>

          {/* Method */}
          <View style={styles.row}>
            <Text style={styles.labelCol}>Method</Text>
            <Text style={styles.valueCol}>{data.method}</Text>
            <Text style={styles.labelKhCol}>វិធីបង់</Text>
          </View>

          {/* Amount */}
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>
              {data.currency} {data.amount.toLocaleString()}
            </Text>
            <Text style={styles.amountLabelKh}>ចំនួនទឹកប្រាក់</Text>
          </View>
          <Text style={styles.amountInWords}>{data.amountInWords}</Text>
        </View>

        {/* Signature section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>Received By</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>Guardian Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber }) =>
            `${data.schoolName} — Receipt ${data.receiptNumber} — Page ${pageNumber}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
