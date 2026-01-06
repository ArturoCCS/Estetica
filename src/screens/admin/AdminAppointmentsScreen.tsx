import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/Button";
import { db } from "../../lib/firebase";
import { useAuth } from "../../providers/AuthProvider";

async function sendTestPush(to: string) {
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify([{ to, title: "Prueba", body: "Notificación de prueba" }]),
  });
  const data = await res.json();
  console.log("push result", data);
  return data;
}

export function AdminNotificationsDebugScreen() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data() as any;
      setToken(data?.expoPushToken ?? null);
    })();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug de notificaciones</Text>
      <Text>UID: {user?.uid ?? "-"}</Text>
      <Text>Token: {token ?? "(sin token)"}</Text>
      <Button
        title="Enviar push de prueba"
        onPress={async () => {
          if (!token) {
            Alert.alert("Sin token", "Abre la app en un dispositivo iOS/Android y acepta permisos.");
            return;
          }
          const res = await sendTestPush(token);
          Alert.alert("Enviado", JSON.stringify(res));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, gap: 12 },
  title: { fontWeight: "bold", fontSize: 20 }
});