import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../lib/firebase";
import { RootStackParamList } from "../navigation/types";
import { theme } from "../theme/theme";
import { Service } from "../types/domain";

export function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const rows: Service[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Service, "id">)
      }));
      setServices(rows.filter((s) => s.active));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <View style={ss.container}>
      <Text style={ss.title}>Services</Text>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primaryDark} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={item => item.id}
          contentContainerStyle={{ gap: 16, paddingBottom: 70 }}
          ListEmptyComponent={<Text style={ss.empty}>No services available yet.</Text>}
          renderItem={({ item }) => (
            <View style={ss.card}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={ss.img} />
              ) : (
                <View style={[ss.img, { backgroundColor: "#F3F3F2", justifyContent: "center", alignItems: "center" }]}>
                  <Ionicons name="image-outline" size={36} color="#CCC" />
                </View>
              )}
              <View style={ss.info}>
                <Text style={ss.name}>{item.name}</Text>
                {!!item.description && <Text style={ss.desc}>{item.description}</Text>}
                <View style={ss.row}>
                  <Text style={ss.dur}>{item.durationMin}–{item.durationMax} min</Text>
                  {item.price && <Text style={ss.price}>${item.price}</Text>}
                </View>
                <Pressable style={ss.bookBtn} onPress={() => navigation.navigate("BookService", { serviceId: item.id })}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Book Appointment</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 18, paddingTop: 24 },
  title: { fontSize: 21, fontWeight: "700", color: "#222", marginBottom: 8 },
  card: { flexDirection: "row", backgroundColor: "#fefefe", borderRadius: 18, shadowColor: "#ddd", shadowOpacity: 0.09, shadowRadius: 7, elevation: 2 },
  img: { width: 96, height: 96, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  info: { flex: 1, padding: 10 },
  name: { fontWeight: "bold", fontSize: 17, color: "#222" },
  desc: { color: "#888", marginTop: 5, fontSize: 13 },
  row: { flexDirection: "row", gap: 10, marginTop: 3, alignItems: "center" },
  dur: { color: "#999", fontSize: 12 },
  price: { fontWeight: "bold", color: theme.colors.primaryDark },
  empty: { textAlign: "center", color: "#999", marginTop: 44 },
  bookBtn: { marginTop: 9, backgroundColor: theme.colors.primary, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 7, alignItems: "center" }
});