import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { usePaymentHandler } from "../hooks/usePaymentHandler";
import { db } from "../lib/firebase";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../providers/AuthProvider";
import { theme } from "../theme/theme";
import { Appointment } from "../types/domain";


export function BookingsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { handlePayDeposit, paymentLoading } = usePaymentHandler();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();


  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
      orderBy("requestedStartAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const rows: Appointment[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setItems(rows);
      setLoading(false);
    });
    return unsub;
  }, [user]);

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
      case "requested": return "Pendiente";
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

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Citas</Text>
      
      <Button title="Ver mi agenda" onPress={() => navigation.navigate("Calendar")} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={theme.colors.primaryDark} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>No tienes citas aún.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>
              
              <Text style={styles.dateText}>{formatDateTime(item)}</Text>
              
              {item.depositAmount && (
                <Text style={styles.priceText}>Depósito: ${item.depositAmount} MXN</Text>
              )}
              
              {item.paymentDueAt && item.status === "awaiting_payment" && (
                <Text style={styles.warningText}>
                  Límite: {new Date(item.paymentDueAt).toLocaleString("es-MX")}
                </Text>
              )}
              
              {item.notes && <Text style={styles.notes}>Notas: {item.notes}</Text>}
              
              {item.status === "awaiting_payment" && (
                <Button
                  title={paymentLoading === item.id ? "Procesando..." : "Pagar depósito"}
                  onPress={() => handlePayDeposit(item.id)}
                  disabled={paymentLoading === item.id}
                />
              )}
            </Card>
          )}
          contentContainerStyle={{ gap: 16, paddingBottom: 30 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontWeight: "bold", fontSize: 24, marginBottom: 14, color: "#222", alignSelf: "center" },
  empty: { alignSelf: "center", marginTop: 60, color: "#888", fontSize: 15 },
  card: { gap: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  serviceName: { fontWeight: "700", fontSize: 16, color: theme.colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  dateText: { fontSize: 14, color: "#555" },
  priceText: { fontSize: 14, color: theme.colors.primary, fontWeight: "600" },
  warningText: { fontSize: 13, color: "#FF6B6B", fontWeight: "600" },
  notes: { fontSize: 13, color: "#777", fontStyle: "italic" },
});