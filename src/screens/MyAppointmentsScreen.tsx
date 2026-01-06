import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { db } from "../lib/firebase";
import { useAuth } from "../providers/AuthProvider";
import { theme } from "../theme/theme";
import { Appointment } from "../types/domain";

export function MyAppointmentsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
      orderBy("requestedStartAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      const rows: Appointment[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setItems(rows);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handlePayDeposit = async (appointmentId: string) => {
    try {
      setPaymentLoading(appointmentId);
      
      // Call Cloud Function to create preference
      const functionUrl = process.env.EXPO_PUBLIC_CREATE_PAYMENT_URL || "";
      if (!functionUrl) {
        Alert.alert("Error", "Payment function URL not configured");
        setPaymentLoading(null);
        return;
      }

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create payment");
      }

      const data = await response.json();
      const initPoint = data.sandboxInitPoint || data.initPoint;

      if (!initPoint) {
        throw new Error("No init_point returned from payment service");
      }

      // Open Mercado Pago checkout in browser
      await WebBrowser.openBrowserAsync(initPoint);
      
      Alert.alert(
        "Pago iniciado",
        "Una vez completado el pago, tu cita será confirmada automáticamente."
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo iniciar el pago");
    } finally {
      setPaymentLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested": return "#FFA500";
      case "awaiting_payment": return "#FF6B6B";
      case "confirmed": return "#51CF66";
      case "cancelled": return "#999";
      case "expired": return "#666";
      default: return "#333";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "requested": return "Pendiente aprobación";
      case "awaiting_payment": return "Esperando pago";
      case "confirmed": return "Confirmada";
      case "cancelled": return "Cancelada";
      case "expired": return "Expirada";
      default: return status;
    }
  };

  const formatDateTime = (apt: Appointment) => {
    if (apt.finalStartAt && apt.finalEndAt) {
      return `${new Date(apt.finalStartAt).toLocaleString("es-MX")} - ${new Date(apt.finalEndAt).toLocaleTimeString("es-MX")}`;
    }
    return `${new Date(apt.requestedStartAt).toLocaleString("es-MX")} (solicitado)`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mis citas</Text>
      
      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={theme.colors.primaryDark} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>No tienes citas.</Text>
      ) : (
        items.map(a => (
          <Card key={a.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.serviceName}>{a.serviceName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(a.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(a.status)}</Text>
              </View>
            </View>
            
            <Text style={styles.dateText}>{formatDateTime(a)}</Text>
            
            {a.depositAmount && (
              <Text style={styles.priceText}>Depósito: ${a.depositAmount} MXN</Text>
            )}
            
            {a.paymentDueAt && a.status === "awaiting_payment" && (
              <Text style={styles.warningText}>
                Límite de pago: {new Date(a.paymentDueAt).toLocaleString("es-MX")}
              </Text>
            )}
            
            {a.mpStatus && (
              <Text style={styles.infoText}>Estado de pago: {a.mpStatus}</Text>
            )}
            
            {a.notes && <Text style={styles.notes}>Notas: {a.notes}</Text>}
            
            {a.status === "awaiting_payment" && (
              <Button
                title={paymentLoading === a.id ? "Procesando..." : "Pagar depósito"}
                onPress={() => handlePayDeposit(a.id)}
                disabled={paymentLoading === a.id}
              />
            )}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  title: { fontWeight: "700", fontSize: 22, marginBottom: 16, color: theme.colors.text },
  empty: { alignSelf: "center", marginTop: 60, color: "#888", fontSize: 15 },
  card: { marginBottom: 12, gap: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  serviceName: { fontWeight: "700", fontSize: 16, color: theme.colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  dateText: { fontSize: 14, color: "#555" },
  priceText: { fontSize: 14, color: theme.colors.primary, fontWeight: "600" },
  warningText: { fontSize: 13, color: "#FF6B6B", fontWeight: "600" },
  infoText: { fontSize: 13, color: "#666" },
  notes: { fontSize: 13, color: "#777", fontStyle: "italic" },
});