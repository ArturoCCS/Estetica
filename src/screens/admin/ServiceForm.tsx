import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import { Alert, Platform, StyleSheet, Text, View, ViewStyle } from "react-native";

import { Button } from "../../components/Button";
import { EditableImageUrlList } from "../../components/EditableImageUrlList";
import { HeaderBack } from "../../components/HeaderBack";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { db } from "../../lib/firebase";

/**
 * Valores que maneja el formulario (strings porque vienen de inputs).
 * OJO: duration y price pueden quedar vacíos => se guardan como null para "por valoración".
 */
export type ServiceFormValues = {
  name: string;
  description: string;
  category?: string; // si no lo usas, puedes quitarlo
  durationMin: string; // minutos
  durationMax: string; // minutos
  price: string;       // MXN
  imageUrl: string;    // portada/hero (compat con tu modelo actual)
  heroImageUrl?: string; // opcional si migras
  galleryUrls?: string[]; // ✅ mini landing gallery (links)
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

export function ServiceForm({ serviceId, initialValues, onDone }: ServiceFormProps) {
  const isWeb = Platform.OS === "web";
  const maxWidthStyle = useMemo<ViewStyle | null>(
    () => (isWeb ? { maxWidth: 920, alignSelf: "center", width: "100%" } : null),
    [isWeb]
  );

  // Estado local desde initialValues
  const [name, setName] = useState(initialValues.name ?? "");
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [category, setCategory] = useState(initialValues.category ?? "");
  const [durationMin, setDurationMin] = useState(initialValues.durationMin ?? "");
  const [durationMax, setDurationMax] = useState(initialValues.durationMax ?? "");
  const [price, setPrice] = useState(initialValues.price ?? "");
  const [imageUrl, setImageUrl] = useState(initialValues.imageUrl ?? "");
  const [galleryUrls, setGalleryUrls] = useState<string[]>(initialValues.galleryUrls ?? []);

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;

    const n = name.trim();
    if (!n) return Alert.alert("Nombre requerido", "Escribe el título del servicio.");

    // Validaciones numéricas (solo si hay texto)
    const dMin = toNumberOrNull(durationMin);
    const dMax = toNumberOrNull(durationMax);
    const p = toNumberOrNull(price);

    if (durationMin.trim() && dMin === null) return Alert.alert("Duración min inválida");
    if (durationMax.trim() && dMax === null) return Alert.alert("Duración max inválida");
    if (price.trim() && p === null) return Alert.alert("Precio inválido");

    if (dMin !== null && dMax !== null && dMax < dMin) {
      return Alert.alert("Duración inválida", "La duración máxima no puede ser menor a la mínima.");
    }

    setSaving(true);
    try {
      // Importante: como el admin edita desde app, aquí estás escribiendo directo Firestore.
      // Si tus rules bloquean write en /services, esto fallará.
      // En ese caso se debe guardar vía Cloud Function admin.
      const payload: any = {
        name: n,
        description: description.trim() || null,
        category: category.trim() || null,
        durationMin: dMin,
        durationMax: dMax,
        price: p,
        imageUrl: imageUrl.trim() || null,

        // ✅ mini landing gallery
        galleryUrls: (galleryUrls ?? []).filter(Boolean),

        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "services", serviceId), payload);

      Alert.alert("Listo", "Servicio actualizado.");
      onDone?.();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo guardar el servicio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll contentContainerStyle={[styles.page, maxWidthStyle]}>
      <HeaderBack title="Editar servicio" />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Mini landing del servicio</Text>
        <Text style={styles.heroSub}>
          Portada, descripción y galería (por links). Precio/tiempo se pueden omitir si es por valoración.
        </Text>
      </View>

      <View style={[styles.card, styles.soft]}>
        <TextField label="Título" value={name} onChangeText={setName} placeholder="Ej. Limpieza facial" />
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
          label="Imagen principal (URL)"
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
          autoCapitalize="none"
        />
      </View>

      <View style={[styles.card, styles.soft]}>
        <EditableImageUrlList value={galleryUrls} onChange={setGalleryUrls} label="Galería (URLs)" />
      </View>

      <View style={[styles.card, styles.soft]}>
        <Text style={styles.sectionTitle}>Tiempo / Costo (opcionales)</Text>
        <Text style={styles.hint}>Déjalos vacíos si depende de valoración.</Text>

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

        <TextField label="Precio (MXN)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="450" />
      </View>

      <Button title={saving ? "Guardando..." : "Guardar cambios"} onPress={handleSave} disabled={saving} />
      <Button title="Cancelar" variant="secondary" onPress={() => onDone?.()} />
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