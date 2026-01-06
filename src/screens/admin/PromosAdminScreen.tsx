import { HeaderBack } from "@/src/components/HeaderBack";
import { useNavigation } from "@react-navigation/native";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { db } from "../../lib/firebase";
import { theme } from "../../theme/theme";
import { PromotionForm } from "./PromotionForm";

type Promo = { id: string; text: string; imageUrl: string; cta?: string };

export function PromosAdminScreen() {
  const navigation = useNavigation();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "promos"), orderBy("text"));
    const unsub = onSnapshot(q, snap => {
      const rows: Promo[] = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Promo[];
      setPromos(rows);
      setLoading(false);
      setAdding(false);
    });
    return unsub;
  }, []);

  const handleDelete = async (id: string) => {
    Alert.alert("Eliminar", "¿Borrar promoción?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí, borrar", style: "destructive", onPress: async () => await deleteDoc(doc(db, "promos", id)) }
    ]);
  };

  // Formulario para editar o agregar
  if (editing) {
    return (
      <PromotionForm
        initialValues={{
          text: editing.text,
          imageUrl: editing.imageUrl,
          cta: editing.cta ?? "",
        }}
        promoId={editing.id}
        onDone={() => setEditing(null)}
      />
    );
  }
  if (adding) {
    return (
      <PromotionForm
        onDone={() => setAdding(false)}
      />
    );
  }

  return (
    <Screen>
      <HeaderBack />
      <Button title="Agregar promoción" onPress={() => setAdding(true)} />
      {loading ? (
        <Text style={{ color: theme.colors.muted, marginTop: 36 }}>Cargando…</Text>
      ) : promos.length === 0 ? (
        <Text style={{ color: "#888", alignSelf: "center", marginTop: 40 }}>No hay promociones registradas.</Text>
      ) : (
        <FlatList
          data={promos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={{flexDirection:"row",alignItems:"center",gap:14}}>
                {item.imageUrl ?
                  <Image source={{ uri: item.imageUrl }} style={styles.promoImg}/>
                  : null
                }
                <View>
                  <Text style={styles.text}>{item.text}</Text>
                  {item.cta ? <Text style={styles.cta}>{item.cta}</Text> : null}
                </View>
              </View>
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
  text: { fontWeight: "bold", fontSize: 16, marginBottom: 3 },
  cta: { color: "#FA4376", fontWeight: "700", marginTop: 2 },
  promoImg: { width: 44, height: 44, borderRadius: 6, backgroundColor: "#eee" }
});