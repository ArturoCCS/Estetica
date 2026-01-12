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
import { GalleryForm } from "./GalleryForm";

type GalleryPhoto = { id: string; imageUrl: string; };

export function GalleryAdminScreen() {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GalleryPhoto | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("imageUrl"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: GalleryPhoto[] = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as GalleryPhoto[];
        setPhotos(rows);
        setLoading(false);
        setAdding(false);
      },
      (error) => {
        console.error("GalleryAdminScreen snapshot error:", error);
        setLoading(false);
        setPhotos([]);
      }
    );
    return unsub;
  }, []);

  const handleDelete = async (id: string) => {
    Alert.alert("Eliminar", "¿Borrar foto de galería?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí, borrar", style: "destructive", onPress: async () => await deleteDoc(doc(db, "gallery", id)) }
    ]);
  };

  if (editing) {
    return (
      <GalleryForm
        initialValues={{
          imageUrl: editing.imageUrl,
        }}
        galleryId={editing.id}
        onDone={() => setEditing(null)}
      />
    );
  }

  if (adding) {
    return (
      <GalleryForm
        onDone={() => setAdding(false)}
      />
    );
  }

  return (
    <Screen>
      <HeaderBack />
      <Button title="Agregar foto a galería" onPress={() => setAdding(true)} />
      {loading ? (
        <Text style={{ color: theme.colors.muted, marginTop: 36 }}>Cargando…</Text>
      ) : photos.length === 0 ? (
        <Text style={{ color: "#888", alignSelf: "center", marginTop: 40 }}>No hay fotos en la galería.</Text>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <Image source={{ uri: item.imageUrl }} style={styles.galleryImg} />
                <Text style={styles.text}>{item.imageUrl}</Text>
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
  text: { fontSize: 13 },
  galleryImg: { width: 64, height: 64, borderRadius: 10, backgroundColor: "#eee" }
});