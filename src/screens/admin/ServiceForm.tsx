import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View, ViewStyle } from "react-native";

import { AppAlert } from "../../components/AppAlert";
import { Button } from "../../components/Button";
import { EditableImageUrlList } from "../../components/EditableImageUrlList";
import { HeaderBack } from "../../components/HeaderBack";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { db } from "../../lib/firebase";

export type ServiceFormValues = {
  name: string;
  description: string;
  category?: string;
  durationMin: string;
  durationMax: string;
  price: string;
  imageUrl?: string;
  heroImageUrl: string;
  galleryUrls?: string[];
};

export type ServiceFormProps = {
  serviceId: string;
  initialValues: ServiceFormValues;
  onDone?: () => void;
};

function toNumberOrNull(v: string): number | null {
  const t = (v ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function ServiceForm({
  serviceId,
  initialValues,
  onDone,
}: ServiceFormProps) {
  const isWeb = Platform.OS === "web";
  const maxWidthStyle = useMemo<ViewStyle | null>(
    () => (isWeb ? { maxWidth: 920, alignSelf: "center", width: "100%" } : null),
    [isWeb]
  );

  const [alert, setAlert] = useState<{
    title?: string;
    msg: string;
  } | null>(null);

  const showAlert = (msg: string, title?: string) =>
    setAlert({ msg, title });

  const [name, setName] = useState(initialValues.name ?? "");
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [category, setCategory] = useState(initialValues.category ?? "");
  const [durationMin, setDurationMin] = useState(initialValues.durationMin ?? "");
  const [durationMax, setDurationMax] = useState(initialValues.durationMax ?? "");
  const [price, setPrice] = useState(initialValues.price ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(initialValues.heroImageUrl ?? "");
  const [galleryUrls, setGalleryUrls] = useState<string[]>(
    initialValues.galleryUrls ?? []
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(initialValues.name ?? "");
    setDescription(initialValues.description ?? "");
    setCategory(initialValues.category ?? "");
    setDurationMin(initialValues.durationMin ?? "");
    setDurationMax(initialValues.durationMax ?? "");
    setPrice(initialValues.price ?? "");
    setHeroImageUrl(initialValues.heroImageUrl ?? "");
    setGalleryUrls(initialValues.galleryUrls ?? []);
  }, [initialValues]);

  async function handleSave() {
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

      await updateDoc(doc(db, "services", serviceId), {
        name: n,
        description: description.trim() || null,
        category: category.trim() || null,
        durationMin: dMin,
        durationMax: dMax,
        price: p,
        heroImageUrl: heroUrl,
        imageUrl: heroUrl,
        galleryUrls: (galleryUrls ?? []).filter(Boolean),
        updatedAt: serverTimestamp(),
      });

      showAlert("Servicio actualizado correctamente.", "Listo");
    } catch (e: any) {
      showAlert(e?.message ?? "No se pudo guardar el servicio.", "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Screen scroll contentContainerStyle={[styles.page, maxWidthStyle]}>
        <HeaderBack title="Editar servicio" />

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Mini landing del servicio</Text>
          <Text style={styles.heroSub}>
            Portada, descripción y galería. Precio/tiempo se pueden omitir si es
            por valoración.
          </Text>
        </View>

        <View style={[styles.card, styles.soft]}>
          <TextField label="Título" value={name} onChangeText={setName} />
          <TextField
            label="Descripción"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TextField
            label="Categoría (opcional)"
            value={category}
            onChangeText={setCategory}
          />
          <TextField
            label="Imagen principal / Hero (URL)"
            value={heroImageUrl}
            onChangeText={setHeroImageUrl}
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
          <Text style={styles.sectionTitle}>Tiempo / Costo</Text>
          <Text style={styles.hint}>Déjalos vacíos si es por valoración.</Text>

          <View style={styles.row2}>
            <TextField
              label="Duración min (min)"
              value={durationMin}
              onChangeText={setDurationMin}
              keyboardType="numeric"
            />
            <TextField
              label="Duración max (min)"
              value={durationMax}
              onChangeText={setDurationMax}
              keyboardType="numeric"
            />
          </View>

          <TextField
            label="Precio (MXN)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>

        <Button
          title={saving ? "Guardando..." : "Guardar cambios"}
          onPress={handleSave}
          disabled={saving}
        />
        <Button title="Cancelar" variant="secondary" onPress={() => { onDone?.(); }} />
      </Screen>

      <AppAlert
        visible={!!alert}
        title={alert?.title}
        message={alert?.msg ?? ""}
        onClose={() => {
          setAlert(null);
          onDone?.();
        }}
      />
    </>
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
