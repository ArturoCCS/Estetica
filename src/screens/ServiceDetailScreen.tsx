import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useMemo } from "react";
import { Dimensions, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ViewStyle, FlexAlignType } from "react-native";
import { Button } from "../components/Button";
import { HeaderBack } from "../components/HeaderBack";
import { Screen } from "../components/Screen";
import { db } from "../lib/firebase";
import { RootStackParamList } from "../navigation/types";
import { Service } from "../types/domain";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "ServiceDetail">;

const W = Dimensions.get("window").width;

export function ServiceDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const serviceId = route.params.serviceId;

  const [service, setService] = React.useState<Service | null>(null);

  React.useEffect(() => {
    const ref = doc(db, "services", serviceId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return setService(null);
        setService({ id: snap.id, ...(snap.data() as any) });
      },
      (error) => {
        console.error("ServiceDetailScreen snapshot error:", error);
        setService(null);
      }
    );
    return unsub;
  }, [serviceId]);

  const isWeb = Platform.OS === "web";
  const containerStyle = useMemo<ViewStyle | undefined>(
    () => (isWeb ? { maxWidth: 980, alignSelf: "center" as FlexAlignType, width: "100%" as const } : undefined),
    [isWeb]
  );

  if (!service) {
    return (
      <Screen scroll contentContainerStyle={containerStyle}>
        <HeaderBack title="Servicio" />
        <Text style={{ color: "#777" }}>Cargando…</Text>
      </Screen>
    );
  }

  const hero = service.heroImageUrl || service.imageUrl;
  const gallery = (service.galleryUrls ?? []).filter(Boolean);

  return (
    <Screen scroll contentContainerStyle={[styles.page, containerStyle]}>
      <HeaderBack title={service.name} />

      <View style={styles.heroWrap}>
        {hero ? (
          <Image source={{ uri: hero }} style={styles.heroImg} />
        ) : (
          <View style={[styles.heroImg, styles.heroFallback]}>
            <Ionicons name="image-outline" size={36} color="#c7c7c7" />
          </View>
        )}

        {/* Soft overlay */}
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>{service.name}</Text>
          {!!service.description && <Text style={styles.heroDesc} numberOfLines={3}>{service.description}</Text>}

          <View style={styles.pillsRow}>
            {service.durationMin && (
              <Pill icon="time-outline" text={service.durationMax ? `${service.durationMin}-${service.durationMax} min` : `${service.durationMin} min`} />
            )}
            {service.price ? <Pill icon="cash-outline" text={`$${service.price} MXN`} /> : <Pill icon="sparkles-outline" text="Valoración" />}
          </View>
        </View>
      </View>

      {gallery.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resultados / Galería</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
            {gallery.map((u, i) => (
              <Pressable key={`${u}-${i}`} style={styles.galleryCard}>
                <Image source={{ uri: u }} style={styles.galleryImg} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.section, styles.softCard]}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.bodyText}>
          {service.description?.trim()
            ? service.description
            : "Este servicio requiere valoración previa. Agenda tu cita y te confirmamos el rango de tiempo y el costo."}
        </Text>
      </View>

      <Button
        title="Agendar este servicio"
        onPress={() => navigation.navigate("BookService", { serviceId: service.id } as any)}
      />
    </Screen>
  );
}

function Pill({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={14} color="#1f1f1f" />
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 14, paddingBottom: 30 },
  heroWrap: {
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#f7f7f7",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  heroImg: { width: "100%", height: Platform.OS === "web" ? 320 : 260 },
  heroFallback: { alignItems: "center", justifyContent: "center" },
  heroOverlay: {
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  heroTitle: { fontSize: 20, fontWeight: "900", color: "#1f1f1f" },
  heroDesc: { marginTop: 6, color: "#6b7280", lineHeight: 18 },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  pillText: { fontWeight: "700", color: "#1f1f1f", fontSize: 12 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#1f1f1f" },
  galleryCard: {
    width: Platform.OS === "web" ? 220 : 160,
    height: Platform.OS === "web" ? 160 : 120,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: "#fff",
  },
  galleryImg: { width: "100%", height: "100%" },
  softCard: {
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  bodyText: { color: "#4b5563", lineHeight: 20 },
});