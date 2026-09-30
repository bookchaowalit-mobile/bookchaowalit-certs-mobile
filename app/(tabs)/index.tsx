import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  certStatus,
  describeExpiry,
  isCert,
  SAMPLE_CERTS,
  sortByUrgency,
  statusSummary,
  cleanCertInput,
  validateCert,
  type Cert,
  type CertStatus,
} from "../../lib/certs";
import { listCodec } from "../../lib/persist";
import { usePersistentState } from "../../lib/usePersistentState";

const certsCodec = listCodec(isCert);

const STATUS_STYLE: Record<CertStatus, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  expired: { color: "#B00020", label: "Expired", icon: "close-circle" },
  expiring: { color: "#8A5A00", label: "Expiring soon", icon: "alert-circle" },
  valid: { color: "#1B7F3B", label: "Valid", icon: "checkmark-circle" },
  lifetime: { color: "#2A5A8C", label: "No expiry", icon: "infinite" },
};

function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CertsScreen() {
  const today = isoToday();
  const [certs, setCerts] = usePersistentState<Cert[]>("certs.list.v1", SAMPLE_CERTS, certsCodec);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", issuer: "", issuedOn: "", expiresOn: "" });
  const [error, setError] = useState<string | null>(null);

  const sorted = sortByUrgency(certs, today);
  const summary = statusSummary(certs, today);

  const save = () => {
    const input = cleanCertInput(form);
    const problem = validateCert(input, today);
    setError(problem);
    if (problem) return;
    setCerts([...certs, { id: `${Date.now()}`, ...input }]);
    setForm({ name: "", issuer: "", issuedOn: "", expiresOn: "" });
    setShowForm(false);
  };

  return (
    <FlatList
      style={styles.container}
      data={sorted}
      keyExtractor={(c) => c.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.headerBlock}>
          <View style={styles.summary}>
            {(Object.keys(STATUS_STYLE) as CertStatus[]).map((s) => (
              <View key={s} style={styles.summaryItem} accessible accessibilityLabel={`${summary[s]} ${STATUS_STYLE[s].label}`}>
                <Text style={[styles.summaryCount, { color: STATUS_STYLE[s].color }]}>{summary[s]}</Text>
                <Text style={styles.summaryLabel}>{STATUS_STYLE[s].label}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={styles.button}
            onPress={() => setShowForm(!showForm)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showForm }}
          >
            <Text style={styles.buttonText}>{showForm ? "Cancel" : "Add certificate"}</Text>
          </Pressable>
          {showForm && (
            <View style={styles.card}>
              {(
                [
                  ["name", "Certificate name"],
                  ["issuer", "Issuer"],
                  ["issuedOn", "Issued on (YYYY-MM-DD)"],
                  ["expiresOn", "Expires on (YYYY-MM-DD, optional)"],
                ] as const
              ).map(([key, placeholder]) => (
                <TextInput
                  key={key}
                  style={styles.input}
                  placeholder={placeholder}
                  value={form[key]}
                  onChangeText={(v) => setForm({ ...form, [key]: v })}
                  autoCapitalize={key === "name" || key === "issuer" ? "words" : "none"}
                  accessibilityLabel={placeholder}
                />
              ))}
              {error && <Text style={styles.error}>{error}</Text>}
              <Pressable style={styles.button} onPress={save} accessibilityRole="button" accessibilityLabel="Save certification">

                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </View>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const s = STATUS_STYLE[certStatus(item, today)];
        return (
          <View style={[styles.card, styles.certCard, { borderLeftColor: s.color }]}>
            <View style={styles.row}>
              <Ionicons name={s.icon} size={20} color={s.color} accessibilityLabel={s.label} />
              <Text style={styles.certName}>{item.name}</Text>
            </View>
            <Text style={styles.meta}>
              {item.issuer} · issued {item.issuedOn}
            </Text>
            <Text style={[styles.expiry, { color: s.color }]}>{describeExpiry(item, today)}</Text>
            <Pressable
              onPress={() => setCerts(certs.filter((c) => c.id !== item.id))}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
            >
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  headerBlock: { padding: 16, gap: 12 },
  summary: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 12, elevation: 2 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryCount: { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 11, color: "#666", textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, gap: 8, elevation: 2 },
  certCard: { marginHorizontal: 16, marginBottom: 10, borderLeftWidth: 5, gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  certName: { flex: 1, fontSize: 16, fontWeight: "600", color: "#333" },
  meta: { fontSize: 13, color: "#777" },
  expiry: { fontSize: 14, fontWeight: "600" },
  delete: { color: "#B00020", fontSize: 13, marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  error: { color: "#B00020" },
  button: { backgroundColor: "#4A90D9", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
});
