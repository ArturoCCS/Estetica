import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { db } from "../../lib/firebase";

type UserData = { uid: string; email?: string; displayName?: string };
type Promo = { id: string; text: string; type?: string; audience?: string[] };

export function AdminPanelScreen() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  useEffect(() => {
    getDocs(collection(db, "users")).then(
      snap => setUsers(snap.docs.map(d => ({ uid: d.id, ...(d.data() as any) })))
    );
    getDocs(collection(db, "promos")).then(
      snap => setPromos(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    );
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff", padding: 18 }}>
      <Text style={{ fontWeight:"700", fontSize:23, color:"#FA4376", marginBottom:13 }}>Usuarios</Text>
      <View style={{ marginBottom: 23 }}>
        {users.map(u =>
          <View key={u.uid} style={{ marginBottom: 7, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontWeight:"600", color:"#4A0080", fontSize:15 }}>{u.displayName || u.email || u.uid}</Text>
            <Text style={{ color:"#bbb", marginLeft: 7 }}>({u.uid})</Text>
          </View>
        )}
      </View>
      <Text style={{ fontWeight:"700", fontSize:23, color:"#FA4376", marginBottom:13 }}>Promociones</Text>
      <View>
        {promos.map(p =>
          <View key={p.id} style={{ marginBottom: 12 }}>
            <Text style={{ color:"#FA4376", fontWeight:"bold", fontSize:15 }}>{p.text}</Text>
            <Text style={{ color:"#444", fontSize:13 }}>Tipo: {p.type || "N/A"} | Usuarios asignados: {p.audience?.length || 0}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}