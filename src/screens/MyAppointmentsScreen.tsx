import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
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

export function MyAppointmentsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
      orderBy("startAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      const rows: Appointment[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setItems(rows);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  async function cancel(id: string) {
    await updateDoc(doc(db, "appointments", id), { status: "cancelled" });
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: theme.spacing.lg }}>
      <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 8 }}>Mis citas</Text>
      {loading ? <Text style={{ color: "#888" }}>Cargando...</Text> : null}
      {items.length === 0 && !loading ? <Text style={{ color: "#999" }}>No tienes citas.</Text> : null}
      {items.map(a => (
        <Card key={a.id} style={{ marginBottom: 12, gap: 6 }}>
          <Text style={{ fontWeight: "700" }}>{a.serviceName}</Text>
          <Text>{new Date(a.startAt).toLocaleString()} - {new Date(a.endAt).toLocaleTimeString()}</Text>
          {a.price ? <Text>Precio: ${a.price}</Text> : null}
          <Text>Estado: {a.status}</Text>
          {a.notes ? <Text>Notas: {a.notes}</Text> : null}
          {a.status !== "cancelled" ? <Button title="Cancelar" variant="secondary" onPress={() => cancel(a.id)} /> : null}
        </Card>
      ))}
    </ScrollView>
  );
}