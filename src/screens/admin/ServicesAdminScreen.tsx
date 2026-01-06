import { useNavigation } from "@react-navigation/native";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { db } from "../../lib/firebase";
import { theme } from "../../theme/theme";
import { ServiceForm } from "./ServiceForm";

type Service = {
  id: string;
  name: string;
  price?: number;
  durationMin?: number;
  durationMax?: number;
  description?: string;
  imageUrl?: string;
};

export function ServicesAdminScreen() {
  const navigation = useNavigation();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);

  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("name"));
    const unsub = onSnapshot(q, snap => {
      const rows: Service[] = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Service[];
      setServices(rows);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleDelete = async (id: string) => {
    Alert.alert("Eliminar", "¿Estás seguro de borrar este servicio?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí, borrar", style: "destructive", onPress: async () => {
        await deleteDoc(doc(db, "services", id));
        setEditing(null);
      } }
    ]);
  };

  // EDICIÓN EN MODAL SIMPLE (O apilas el formulario arriba)
  if (editing) {
    return (
      <ServiceForm
        initialValues={{
          name: editing.name,
          description: editing.description,
          category: "",
          durationMin: `${editing.durationMin ?? ""}`,
          durationMax: `${editing.durationMax ?? ""}`,
          price: editing.price ? `${editing.price}` : "",
          imageUrl: editing.imageUrl || ""
        }}
        serviceId={editing.id}
        onDone={() => setEditing(null)}
      />
    );
  }

  return (
    <Screen>
      <Button title="Volver al panel administrador" onPress={() => navigation.goBack()} />
      {loading ? (
        <Text style={{ color: theme.colors.muted, marginTop: 36 }}>Cargando…</Text>
      ) : services.length === 0 ? (
        <Text style={{ color: "#888", alignSelf: "center", marginTop: 40 }}>No hay servicios registrados.</Text>
      ) : (
        <FlatList
          data={services}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={{flexDirection:"row",alignItems:"center",gap:14}}>
                {item.imageUrl ?
                  <Image source={{ uri: item.imageUrl }} style={styles.serviceImg}/>
                  : null
                }
                <Text style={styles.name}>
                  {item.name} {item.price ? `- $${item.price}` : ""}
                </Text>
              </View>
              <Text>Duración: {item.durationMin}–{item.durationMax} min</Text>
              {item.description ? <Text style={{ color: "#666" }}>{item.description}</Text> : null}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <Button title="Editar" onPress={() => setEditing(item)} />
                <Button title="Eliminar" variant="secondary" onPress={() => handleDelete(item.id)} />
              </View>
            </Card>
          )}
          contentContainerStyle={{ gap: 11, paddingBottom: 22 }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.spacing.sm },
  name: { fontWeight: "bold", fontSize: 17 },
  serviceImg: { width: 44, height: 44, borderRadius: 6, backgroundColor: "#eee" }
});