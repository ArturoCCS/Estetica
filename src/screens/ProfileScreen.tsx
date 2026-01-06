import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { db } from "../lib/firebase";
import { useAuth } from "../providers/AuthProvider";

export function ProfileScreen() {
  const { user, isAdmin, logout } = useAuth();
  const [cupons, setCupons] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const ref = collection(db, "users", user.uid, "coupons");
      const unsub = onSnapshot(ref, snap => {
        setCupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return unsub;
    }
  }, [user]);

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.label}>Email:</Text>
      <Text style={styles.email}>{user.email}</Text>
      <Text style={styles.label}>Rol:</Text>
      <Text style={styles.role}>{isAdmin ? "Admin" : "Usuario"}</Text>

      <Text style={styles.label}>Cupones activos:</Text>
      {cupons.length === 0 ? (
        <Text style={styles.role}>Sin cupones</Text>
      ) : (
        cupons.map(c => (
          <Text key={c.id} style={{ color: "#3ab54a" }}>
            {c.code || c.promoId} {c.redeemed ? "(usado)" : ""}
          </Text>
        ))
      )}
      <Button title="Cerrar sesión" onPress={logout} color="#FA4376" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#fff" },
  title: { fontWeight: "bold", fontSize: 22, marginBottom: 26 },
  label: { fontWeight: "600", marginTop: 12, fontSize: 15 },
  email: { fontSize: 15, marginBottom: 3, color: "#444" },
  role: { fontSize: 15, marginBottom: 28, color: "#888" },
});