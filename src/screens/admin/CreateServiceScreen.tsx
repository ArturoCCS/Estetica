import { useNavigation } from "@react-navigation/native";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, View, ViewStyle } from "react-native";

import { AppAlert } from "../../components/AppAlert";
import { Button } from "../../components/Button";
import { EditableImageUrlList } from "../../components/EditableImageUrlList";
import { HeaderBack } from "../../components/HeaderBack";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { db } from "../../lib/firebase";

function toNumberOrNull(v: string): number | null {
  const t = (v ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function CreateServiceScreen() {
  const navigation = useNavigation();
  const isWeb = Platform.OS === "web";
  const maxWidthStyle: ViewStyle | undefined = isWeb
    ? { maxWidth: 920, alignSelf: "center", width: "100%" }
    : undefined;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [durationMax, setDurationMax] = useState("");
  const [price, setPrice] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [alert, setAlert] = useState<{ title?: string; msg: string } | null>(
    null
  );

  function showAlert(msg: string, title?: string) {
    setAlert({ title, msg });
  }

  async function handleCreate() {
    if (saving) return;

    const n = name.trim();
    if (!n) {
      showAlert("Escribe el título del servicio.", "Nombre requerido");
      return;
    }

    const dMin = toNumberOrNull(durationMin);
    const dMax = toNumberOrNull(durationMax);
    const p = toNumberOrNull(price);

    if (durationMin.trim() && dMin === null) {
      showAlert("Duración mínima inválida");
      return;
    }

    if (durationMax.trim() && dMax === null) {
      showAlert("Duración máxima inválida");
      return;
    }

    if (price.trim() && p === null) {
      showAlert("Precio inválido");
      return;
    }

    if (dMin !== null && dMax !== null && dMax < dMin) {
      showAlert(
        "La duración máxima no puede ser menor a la mínima.",
        "Duración inválida"
      );
      return;
    }

    setSaving(true);
    try {
      const heroUrl = heroImageUrl.trim() || null;

      await addDoc(collection(db, "services"), {
        name: n,
        description: description.trim() || null,
        category: category.trim() || null,
        durationMin: dMin,
        durationMax: dMax,
        price: p,
        heroImageUrl: heroUrl,
        imageUrl: heroUrl,
        galleryUrls: (galleryUrls ?? []).filter(Boolean),
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      showAlert("Servicio creado exitosamente.", "Listo");
    } catch (e: any) {
      showAlert(e?.message ?? "No se pudo crear el servicio.", "Error");
    } finally {
      setSaving(false);
    }
  }

  const handleAlertClose = () => {
    setAlert(null);
    if (alert?.title === "Listo") {
      navigation.goBack();
    }
  };

  return (
    <Screen scroll contentContainerStyle={[styles.page, maxWidthStyle]}>
      <HeaderBack title="Crear servicio" />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Nuevo servicio</Text>
        <Text style={styles.heroSub}>
          Completa la información del servicio. Precio/tiempo se pueden omitir si
          es por valoración.
        </Text>
      </View>

      <View style={[styles.card, styles.soft]}>
        <TextField
          label="Título"
          value={name}
          onChangeText={setName}
          placeholder="Ej. Limpieza facial"
        />

        <TextField
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe el servicio…"
          multiline
        />

        <TextField
          label="Categoría (opcional)"
          value={category}
          onChangeText={setCategory}
          placeholder="Ej. Faciales"
        />

        <TextField
          label="Imagen principal / Hero (URL)"
          value={heroImageUrl}
          onChangeText={setHeroImageUrl}
          placeholder="https://..."
          autoCapitalize="none"
        />
      </View>

      <View style={[styles.card, styles.soft]}>
        <EditableImageUrlList
          value={galleryUrls}
          onChange={setGalleryUrls}
          label="Galería (URLs)"
        />
      </View>

      <View style={[styles.card, styles.soft]}>
        <Text style={styles.sectionTitle}>Tiempo / Costo (opcionales)</Text>
        <Text style={styles.hint}>
          Déjalos vacíos si depende de valoración.
        </Text>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <TextField
              label="Duración min (min)"
              value={durationMin}
              onChangeText={setDurationMin}
              keyboardType="numeric"
              placeholder="60"
            />
          </View>

          <View style={{ flex: 1 }}>
            <TextField
              label="Duración max (min)"
              value={durationMax}
              onChangeText={setDurationMax}
              keyboardType="numeric"
              placeholder="90"
            />
          </View>
        </View>

        <TextField
          label="Precio (MXN)"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="450"
        />
      </View>

      <Button
        title={saving ? "Creando..." : "Crear servicio"}
        onPress={handleCreate}
        disabled={saving}
      />

      <Button
        title="Cancelar"
        variant="secondary"
        onPress={() => navigation.goBack()}
      />

      <AppAlert
        visible={!!alert}
        title={alert?.title}
        message={alert?.msg ?? ""}
        onClose={handleAlertClose}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 14, paddingBottom: 30 },
  heroCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#fff1f2",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  heroTitle: { fontSize: 18, fontWeight: "900", color: "#1f1f1f" },
  heroSub: { marginTop: 6, color: "#6b7280", lineHeight: 18 },
  card: { borderRadius: 22, padding: 14, gap: 12 },
  soft: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  sectionTitle: { fontWeight: "900", color: "#1f1f1f" },
  hint: { color: "#6b7280", fontSize: 12 },
  row2: { flexDirection: "row", gap: 12 },
});
