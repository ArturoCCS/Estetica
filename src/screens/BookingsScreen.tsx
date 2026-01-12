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
import { useTheme } from "../providers/ThemeProvider";
import { Appointment } from "../types/domain";


export function BookingsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { handlePayDeposit, paymentLoading } = usePaymentHandler();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();


  useEffect(() => {
    // Guard: Don't attempt query until user is hydrated
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Firestore composite index required: userId (ASC) + requestedStartAt (DESC)
    // Ensure index exists in firestore.indexes.json
    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
      orderBy("requestedStartAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const rows: Appointment[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        setItems(rows);
        setLoading(false);
      },
      (error) => {
        console.error("BookingsScreen snapshot error:", error);
        setLoading(false);
        // Keep UI state consistent on error
        setItems([]);
      }
    );
    return unsub;
  }, [user?.uid]);

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
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20 }}>
      <Text style={{ 
        fontWeight: "bold", 
        fontSize: 24, 
        marginBottom: 14, 
        color: theme.colors.text, 
        alignSelf: "center" 
      }}>
        Mis Citas
      </Text>
      
      <Button title="Ver mi agenda" onPress={() => navigation.navigate("Calendar")} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={theme.colors.accent} />
      ) : items.length === 0 ? (
        <Text style={{ alignSelf: "center", marginTop: 60, color: theme.colors.textMuted, fontSize: 15 }}>
          No tienes citas aún.
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={{ fontWeight: "700", fontSize: 16, color: theme.colors.text, flex: 1 }}>
                  {item.serviceName}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>
              
              <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
                {formatDateTime(item)}
              </Text>
              
              {item.depositAmount && (
                <Text style={{ fontSize: 14, color: theme.colors.accent, fontWeight: "600" }}>
                  Depósito: ${item.depositAmount} MXN
                </Text>
              )}
              
              {item.paymentDueAt && item.status === "awaiting_payment" && (
                <Text style={{ fontSize: 13, color: theme.colors.error, fontWeight: "600" }}>
                  Límite: {new Date(item.paymentDueAt).toLocaleString("es-MX")}
                </Text>
              )}
              
              {item.notes && (
                <Text style={{ fontSize: 13, color: theme.colors.textMuted, fontStyle: "italic" }}>
                  Notas: {item.notes}
                </Text>
              )}
              
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
  card: { gap: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600" },
});