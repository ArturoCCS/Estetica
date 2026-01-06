import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { AppointmentCard } from "../components/AppointmentCard";
import { db } from "../lib/firebase";
import { useAuth } from "../providers/AuthProvider";
import { theme } from "../theme/theme";

type Appointment = {
  id: string;
  serviceName: string;
  startAt: string;
  endAt: string;
  status: "pending" | "confirmed" | "cancelled";
  price?: number;
  notes?: string;
};

export function BookingsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
      orderBy("startAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const rows: Appointment[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setItems(rows);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  async function cancel(id: string) {
    await updateDoc(doc(db, "appointments", id), { status: "cancelled" });
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Citas</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={theme.colors.primaryDark} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>No tienes citas aún.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <AppointmentCard
              serviceName={item.serviceName}
              startAt={item.startAt}
              endAt={item.endAt}
              status={item.status}
              price={item.price}
              notes={item.notes}
              onCancel={item.status !== "cancelled" ? () => cancel(item.id) : undefined}
            />
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
});