import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { addDoc, collection, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { db } from "../lib/firebase";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../providers/AuthProvider";
import { useNotificationBadge } from "../providers/NotificationBadgeProvider";
import { theme } from "../theme/theme";

const windowWidth = Dimensions.get("window").width;
const isWeb = Platform.OS === "web";

type Service = {
  id: string;
  name: string;
  price?: number;
  icon?: string;
  imageUrl?: string;
  heroImageUrl?: string;
  description?: string;
  durationMin?: number;
  durationMax?: number;
};
type PromoRoulettePrize = { code: string; label: string };
type Promo = {
  id: string;
  imageUrl: string;
  text: string;
  cta: string;
  type?: "ruleta" | "cupon" | "info" | string;
  code?: string;
  rewards?: PromoRoulettePrize[];
  audience?: string[];
};
type GalleryImage = { id: string; imageUrl: string };
type Review = { id: string; name: string; rating: number; comment: string; image?: string };

export function HomeScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { badgeCount } = useNotificationBadge();

  // ===== Promo carousel: dots + autoplay =====
  const promoListRef = useRef<FlatList<Promo>>(null);
  const [promoViewportW, setPromoViewportW] = useState(0);
  const [promoIndex, setPromoIndex] = useState(0);
  const userInteractedAtRef = useRef<number>(0);

  function canShowPromo(promo: Promo) {
    if (!promo.audience || promo.audience.length === 0) return true;
    if (!user) return false;
    return promo.audience.includes(user.uid) || promo.audience.includes((user.email || "").toLowerCase());
  }

  const visiblePromos = useMemo(() => promos.filter(canShowPromo), [promos, user?.uid, user?.email]);

  function scrollToPromo(index: number, animated = true) {
    if (!promoListRef.current) return;
    if (promoViewportW <= 0) return;
    promoListRef.current.scrollToOffset({
      offset: index * promoViewportW,
      animated,
    });
  }

  function markUserInteracted() {
    userInteractedAtRef.current = Date.now();
  }

  // autoplay (cada 5s). Pausa 8s después de interacción del usuario.
  useEffect(() => {
    if (visiblePromos.length <= 1) return;
    if (promoViewportW <= 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const msSinceInteract = now - userInteractedAtRef.current;
      if (msSinceInteract < 8000) return;

      setPromoIndex((prev) => {
        const next = (prev + 1) % visiblePromos.length;
        scrollToPromo(next, true);
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [visiblePromos.length, promoViewportW]);

  // ===== Firestore subscriptions =====
  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const rows: Service[] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Service[];
      setServices(rows);
      setLoadingServices(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "promos"), orderBy("text"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const rows: Promo[] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Promo[];
      setPromos(rows);
      setLoadingPromos(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("imageUrl"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const rows: GalleryImage[] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as GalleryImage[];
      setGallery(rows);
      setLoadingGallery(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("id"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const rows: Review[] = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Review[];
      setReviews(rows);
      setLoadingReviews(false);
    });
    return unsubscribe;
  }, []);

  async function saveCouponToProfile(promo: Promo, code: string, label: string = "") {
    if (!user) return;
    try {
      const ref = collection(db, "users", user.uid, "coupons");
      const snapshot = await getDocs(ref);
      const already = snapshot.docs.find((d) => d.data().promoId === promo.id && d.data().code === code);
      if (already) {
        Alert.alert("Ya tienes este cupón activo");
        return;
      }
      await addDoc(ref, {
        promoId: promo.id,
        code,
        label: label || promo.text,
        redeemed: false,
        createdAt: new Date(),
      });
      Alert.alert("¡Cupón agregado!", "Puedes verlo en tu Perfil.");
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar tu cupón.");
    }
  }

  function handlePromoAction(promo: Promo) {
    if (!user) {
      Alert.alert("Inicia sesión para participar en la promoción.");
      navigation.navigate("Main", { screen: "Profile" });
      return;
    }
    if (promo.type === "ruleta" && promo.rewards && promo.rewards.length > 0) {
      navigation.navigate("PromoRoulette", { promoId: promo.id, rewards: promo.rewards });
      return;
    }
    if (promo.type === "cupon" && promo.code) {
      saveCouponToProfile(promo, promo.code, promo.text);
      return;
    }
    Alert.alert("Promoción", promo.text);
  }

  const containerStyle: StyleProp<ViewStyle> = isWeb
    ? { maxWidth: 1200, alignSelf: "center" as const, width: "100%" as any }
    : undefined;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={containerStyle}
      showsVerticalScrollIndicator={Platform.OS === "web"}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hola 👋</Text>
          <Text style={styles.cityLabel}>Encuentra tu belleza perfecta</Text>
        </View>

        <Pressable onPress={() => navigation.navigate("Notifications")} style={styles.bellContainer} hitSlop={10}>
          <Ionicons name="notifications-outline" size={24} color="#1f1f1f" />
          {badgeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* PROMO CAROUSEL */}
      {loadingPromos ? (
        <SkeletonPromoCarousel />
      ) : visiblePromos.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Promociones especiales</Text>

          <View onLayout={(e) => setPromoViewportW(e.nativeEvent.layout.width)} style={styles.promoCarouselWrap}>
            {/* Espera a medir para que paging/offset funcione perfecto */}
            {promoViewportW > 0 && (
              <FlatList
                ref={promoListRef}
                data={visiblePromos}
                keyExtractor={(p) => p.id}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                onScrollBeginDrag={markUserInteracted}
                onMomentumScrollBegin={markUserInteracted}
                onMomentumScrollEnd={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const idx = Math.round(x / promoViewportW);
                  setPromoIndex(idx);
                }}
                onScroll={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const idx = Math.round(x / promoViewportW);
                  if (idx !== promoIndex) setPromoIndex(idx);
                }}
                scrollEventThrottle={16}
                contentContainerStyle={styles.promoCarouselContent}
                renderItem={({ item: promo }) => (
                  <View style={[styles.promoPage, { width: promoViewportW }]}>
                    <View style={styles.promoCard}>
                      <Image source={{ uri: promo.imageUrl }} style={styles.promoImg} />
                      <View style={styles.promoOverlay}>
                        <Text style={styles.promoText}>{promo.text}</Text>
                        <Pressable style={styles.promoBtn} onPress={() => handlePromoAction(promo)}>
                          <Text style={styles.promoBtnText}>{promo.cta}</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}
              />
            )}

            {/* Dots */}
            {visiblePromos.length > 1 && (
              <View style={styles.dotsRow}>
                {visiblePromos.map((_, i) => {
                  const active = i === promoIndex;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => {
                        markUserInteracted();
                        setPromoIndex(i);
                        scrollToPromo(i, true);
                      }}
                      hitSlop={10}
                      style={[styles.dot, active && styles.dotActive]}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </>
      ) : null}

      {/* SERVICIOS */}
      <Text style={styles.sectionTitle}>Nuestros servicios</Text>
      {loadingServices ? (
        <SkeletonServices />
      ) : services.length > 0 ? (
        <FlatList
          data={services}
          horizontal
          renderItem={({ item }) => {
            const hero = item.heroImageUrl || item.imageUrl;
            return (
              <Pressable style={styles.serviceCard} onPress={() => navigation.navigate("ServiceDetail", { serviceId: item.id })}>
                {hero ? (
                  <Image source={{ uri: hero }} style={styles.serviceImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.serviceImg, styles.serviceImgPlaceholder]}>
                    <Ionicons name="image-outline" size={28} color="#d1d5db" />
                  </View>
                )}
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.price && <Text style={styles.servicePrice}>${item.price}</Text>}
                </View>
              </Pressable>
            );
          }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, marginTop: 12, marginBottom: 24, paddingHorizontal: 2 }}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.emptyText}>Sin servicios disponibles.</Text>
      )}

      {/* GALERÍA */}
      {gallery.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Galería</Text>
          {loadingGallery ? (
            <SkeletonGallery />
          ) : (
            <FlatList
              horizontal
              data={gallery}
              keyExtractor={(img) => img.id}
              renderItem={({ item }) => (item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.galleryImg} /> : null)}
              contentContainerStyle={{ gap: 12, marginTop: 8, marginBottom: 24, paddingHorizontal: 2 }}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </>
      )}

      {/* TESTIMONIOS */}
      {reviews.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Clientes felices</Text>
          {loadingReviews ? (
            <SkeletonReviews />
          ) : (
            <FlatList
              horizontal
              data={reviews}
              keyExtractor={(r) => r.id}
              renderItem={({ item }) => (
                <View style={styles.reviewCard}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.reviewAvatar} />
                  ) : (
                    <View style={[styles.reviewAvatar, { backgroundColor: "#f3f4f6" }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewName}>{item.name}</Text>
                    <View style={styles.starRow}>
                      {[...Array(Math.round(item.rating))].map((_, i) => (
                        <Ionicons key={i} name="star" size={13} color="#fbbf24" />
                      ))}
                    </View>
                    <Text style={styles.reviewComment} numberOfLines={2}>
                      {item.comment}
                    </Text>
                  </View>
                </View>
              )}
              contentContainerStyle={{ gap: 12, marginTop: 8, marginBottom: 30, paddingHorizontal: 2 }}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </>
      )}

      {/* CTA importante */}
      <Pressable style={styles.bookCta} onPress={() => navigation.navigate("Main", { screen: "Services" })}>
        <Text style={styles.bookCtaText}>Ver todos los servicios</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </Pressable>
    </ScrollView>
  );
}

// ===== Skeletons =====
function SkeletonPromoCarousel() {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 20, marginTop: 8 }}>
      {[1, 2].map((i) => (
        <View key={i} style={[styles.promoCard, { backgroundColor: "#f3f4f6" }]} />
      ))}
    </View>
  );
}
function SkeletonServices() {
  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: 24, marginTop: 12 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ backgroundColor: "#f3f4f6", borderRadius: 16, minWidth: 140, height: 180 }} />
      ))}
    </View>
  );
}
function SkeletonGallery() {
  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: 24, marginTop: 8 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ width: 140, height: 100, borderRadius: 16, backgroundColor: "#f3f4f6" }} />
      ))}
    </View>
  );
}
function SkeletonReviews() {
  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: 30, marginTop: 8 }}>
      {[0, 1].map((i) => (
        <View
          key={i}
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            minWidth: 220,
            height: 80,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    marginBottom: 8,
  },
  bellContainer: {
    position: "relative",
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1f1f1f",
    letterSpacing: -0.5,
  },
  cityLabel: {
    fontWeight: "400",
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1f1f1f",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 20,
    fontSize: 13,
  },

  promoCarouselWrap: {
    marginTop: 8,
    marginBottom: 24,
  },
  promoCarouselContent: {
    paddingHorizontal: 6,
  },
  promoPage: {
    marginHorizontal: Platform.OS === "web" ? -45 : -16,
    paddingHorizontal: Platform.OS === "web" ? 32 : 16,
  },
  promoCard: {
  width: Platform.OS === "web"
    ? "100%"
    : windowWidth * 0.9,
  maxWidth: Platform.OS === "web" ? 1100 : "100%",
  height: 160,
  borderRadius: 24,
  overflow: "hidden",
  alignSelf: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.10)" },
    }),
  },
  promoImg: { width: "100%", height: "100%", position: "absolute" },
  promoOverlay: {
    position: "absolute",
    left: 20,
    bottom: 20,
    gap: 10,
  },
  promoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    maxWidth: 260,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  promoBtn: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  promoBtnText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(17,24,39,0.22)",
  },
  dotActive: {
    width: 18,
    backgroundColor: theme.colors.primary,
  },

  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    width: 140,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
    }),
  },
  serviceImg: {
    width: "100%",
    height: 120,
    backgroundColor: "#f3f4f6",
  },
  serviceImgPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  serviceInfo: {
    padding: 12,
    gap: 4,
  },
  serviceName: {
    fontWeight: "800",
    fontSize: 14,
    color: "#1f1f1f",
    lineHeight: 18,
  },
  servicePrice: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },

  galleryImg: {
    width: 140,
    height: 100,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
    }),
  },

  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    minWidth: 220,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
    }),
  },
  reviewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  reviewName: {
    fontWeight: "800",
    color: "#1f1f1f",
    fontSize: 14,
    marginBottom: 2,
  },
  reviewComment: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  starRow: {
    flexDirection: "row",
    gap: 2,
  },

  bookCta: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 40,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
      web: { boxShadow: `0 4px 12px ${theme.colors.primary}40` },
    }),
  },
  bookCtaText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});