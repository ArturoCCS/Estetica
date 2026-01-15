import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../lib/firebase";
import { RootStackParamList } from "../navigation/types";
import { theme } from "../theme/theme";
import { Service } from "../types/domain";

const { width: WINDOW_WIDTH } = Dimensions.get("window");

export function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
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

  const categories = useMemo(() => {
    const cats = new Set<string>();
    services.forEach(s => {
      if (typeof s.category === "string" && s.category.length > 0) cats.add(s.category);
    });
    return Array.from(cats).sort();
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!filter) return services;
    return services.filter(s => typeof s.category === "string" && s.category === filter);
  }, [services, filter]);

  const isWeb = Platform.OS === "web";
  const numColumns = isWeb ? (WINDOW_WIDTH > 1024 ? 4 : 3) : 2;
  const cardWidth = isWeb 
    ? (Math.min(WINDOW_WIDTH, 1200) - 48 - (numColumns - 1) * 16) / numColumns
    : (WINDOW_WIDTH - 48 - 16) / 2;

  return (
    <View style={ss.container}>
      <View style={ss.header}>
        <Text style={ss.title}>Servicios</Text>
        <Text style={ss.subtitle}>Encuentra el servicio perfecto para ti</Text>
      </View>

      {categories.length > 0 && (
        <View style={ss.filtersWrap}>
          <Pressable
            style={[ss.pill, !filter && ss.pillActive]}
            onPress={() => setFilter(null)}
          >
            <Text style={[ss.pillText, !filter && ss.pillTextActive]}>Todos</Text>
          </Pressable>

          {categories.map((cat) => (
            <Pressable
              key={cat}
              style={[ss.pill, filter === cat && ss.pillActive]}
              onPress={() => setFilter(cat)}
            >
              <Text style={[ss.pillText, filter === cat && ss.pillTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primaryDark} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={item => item.id}
          key={`grid-${numColumns}`}
          numColumns={numColumns}
          contentContainerStyle={[
            ss.grid,
            isWeb && { maxWidth: 1200, alignSelf: "center", width: "100%" }
          ]}
          columnWrapperStyle={numColumns > 1 ? { gap: 16 } : undefined}
          ListEmptyComponent={<Text style={ss.empty}>No hay servicios disponibles.</Text>}
          renderItem={({ item }) => {
            const hero = item.heroImageUrl || item.imageUrl;
            return (
              <Pressable 
                style={[ss.card, { width: cardWidth }]} 
                onPress={() => navigation.navigate("ServiceDetail", { serviceId: item.id })}
              >
                {hero ? (
                  <Image source={{ uri: hero }} style={ss.cardImg} />
                ) : (
                  <View style={[ss.cardImg, ss.cardImgPlaceholder]}>
                    <Ionicons name="image-outline" size={32} color="#d1d5db" />
                  </View>
                )}
                <View style={ss.cardBody}>
                  <Text style={ss.cardName} numberOfLines={2}>{item.name}</Text>
                  <View style={ss.cardMeta}>
                    {item.price ? (
                      <View style={ss.metaPill}>
                        <Ionicons name="cash-outline" size={12} color="#6b7280" />
                        <Text style={ss.metaText}>${item.price}</Text>
                      </View>
                    ) : (
                      <View style={ss.metaPill}>
                        <Ionicons name="sparkles-outline" size={12} color="#6b7280" />
                        <Text style={ss.metaText}>Valoración</Text>
                      </View>
                    )}
                    {item.durationMin && (
                      <View style={ss.metaPill}>
                        <Ionicons name="time-outline" size={12} color="#6b7280" />
                        <Text style={ss.metaText}>
                          {item.durationMax ? `${item.durationMin}-${item.durationMax}min` : `${item.durationMin}min`}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fafafa",
    paddingHorizontal: 20, 
    paddingTop: 30,
    paddingBottom: 30,
  },
  header: { 
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: { 
    fontSize: 28, 
    fontWeight: "900", 
    color: "#1f1f1f",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  filtersWrap: { 
    flexDirection: "row", 
    flexWrap: "wrap",
    gap: 8, 
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
  },
  pillTextActive: {
    color: "#fff",
  },
  grid: { 
    gap: 16, 
    paddingBottom: 80,
    paddingHorizontal: 4,
  },
  card: { 
    backgroundColor: "#fff",
    borderRadius: 20,
    borderColor: "#dadadc",
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        boxShadowColor: "#000",
        boxShadowOpacity: 0.08,
        boxShadowRadius: 12,
        boxShadowOffset: { width: 0, height: 4 },
      },
      android: { 
        elevation: 3 
      },
      web: {
        boxboxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }
    }),
  },
  cardImg: { 
    width: "100%", 
    height: 140,
    backgroundColor: "#f3f4f6",
  },
  cardImgPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: { 
    padding: 12,
    gap: 8,
  },
  cardName: { 
    fontWeight: "800", 
    fontSize: 15, 
    color: "#1f1f1f",
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
  },
  empty: { 
    textAlign: "center", 
    color: "#9ca3af", 
    marginTop: 44,
    fontSize: 14,
  },
});