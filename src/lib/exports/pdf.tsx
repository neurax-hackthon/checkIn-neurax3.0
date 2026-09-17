import "server-only";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { ExportData } from "@/lib/exports/data";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica" },
  header: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 700 },
  subtitle: { fontSize: 9, color: "#555", marginTop: 2 },
  summaryRow: { flexDirection: "row", gap: 16, marginTop: 10, marginBottom: 12 },
  summaryItem: { fontSize: 9 },
  summaryValue: { fontSize: 14, fontWeight: 700 },
  table: { display: "flex", width: "auto", borderTop: "1pt solid #ccc" },
  row: { flexDirection: "row", borderBottom: "0.5pt solid #ddd" },
  headerRow: { flexDirection: "row", backgroundColor: "#f0f0f0", fontWeight: 700 },
  cell: { padding: 4, flexGrow: 1, flexBasis: 0 },
  footer: { position: "absolute", bottom: 16, left: 28, right: 28, fontSize: 8, color: "#888", flexDirection: "row", justifyContent: "space-between" },
});

const COLUMNS: Array<{ key: keyof ExportData["participants"][number]; label: string; width?: number }> = [
  { key: "sNo", label: "#" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "teamCode", label: "Team" },
  { key: "room", label: "Room" },
  { key: "bench", label: "Bench" },
  { key: "entryStatus", label: "Status" },
  { key: "entryTime", label: "Entry Time" },
];

export async function buildExportPdf(data: ExportData): Promise<Buffer> {
  const checkedIn = data.participants.filter((p) => p.entryStatus === "checked_in").length;
  const total = data.participants.length;

  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>NeuraX 3.0 — Registration &amp; Entry Report</Text>
          <Text style={styles.subtitle}>Generated {data.generatedAt}</Text>
          <Text style={styles.subtitle}>
            Filters: {data.filters.status ?? "all"}
            {data.filters.roomId ? ` · room=${data.filters.roomId}` : ""}
            {data.filters.teamId ? ` · team=${data.filters.teamId}` : ""}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{total}</Text>
            <Text>Participants</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{checkedIn}</Text>
            <Text>Checked In</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{total - checkedIn}</Text>
            <Text>Pending</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{total > 0 ? Math.round((checkedIn / total) * 100) : 0}%</Text>
            <Text>Check-in Rate</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.headerRow} fixed>
            {COLUMNS.map((col) => (
              <Text key={col.key} style={styles.cell}>
                {col.label}
              </Text>
            ))}
          </View>
          {data.participants.map((p) => (
            <View style={styles.row} key={p.sNo} wrap={false}>
              {COLUMNS.map((col) => (
                <Text key={col.key} style={styles.cell}>
                  {String(p[col.key] ?? "")}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text>NeuraX 3.0 Entry System</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
