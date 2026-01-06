import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { addDoc, collection, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { db } from "../lib/firebase";
import { RootStackParamList } from "../navigation/types"; // Importa desde types.ts
import { useAuth } from "../providers/AuthProvider";
import { theme } from "../theme/theme";

const windowWidth = Dimensions.get("window").width;

type Service = {
  id: string;
  name: string;
  price?: number;
  icon?: string;
  imageUrl?: string;
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

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>(); // TYPED!
  const { user } = useAuth();

  // Servicios
  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const rows: Service[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];
      setServices(rows);
      setLoadingServices(false);
    });
    return unsubscribe;
  }, []);

  // Promociones
  useEffect(() => {
    const q = query(collection(db, "promos"), orderBy("text"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const rows: Promo[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Promo[];
      setPromos(rows);
      setLoadingPromos(false);
    });
    return unsubscribe;
  }, []);

  // Galería
  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("imageUrl"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const rows: GalleryImage[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GalleryImage[];
      setGallery(rows);
      setLoadingGallery(false);
    });
    return unsubscribe;
  }, []);

  // Reseñas
  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("id"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const rows: Review[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];
      setReviews(rows);
      setLoadingReviews(false);
    });
    return unsubscribe;
  }, []);

  function canShowPromo(promo: Promo) {
    if (!promo.audience || promo.audience.length === 0) return true;
    if (!user) return false;
    return (
      promo.audience.includes(user.uid) ||
      promo.audience.includes((user.email || "").toLowerCase())
    );
  }

  async function saveCouponToProfile(promo: Promo, code: string, label: string = "") {
    if (!user) return;
    try {
      const ref = collection(db, "users", user.uid, "coupons");
      const snapshot = await getDocs(ref);
      const already = snapshot.docs.find(
        d => d.data().promoId === promo.id && d.data().code === code
      );
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
      Alert.alert('Inicia sesión para participar en la promoción.');
      // 👇 Navega al tab Profile, ¡TIPADO!
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cityLabel}>New York, USA</Text>
        </View>
        <Ionicons name="location-sharp" size={22} color={theme.colors.primaryDark} />
      </View>

      {/* PROMO CAROUSEL */}
      <Text style={styles.sectionTitle}>Promociones</Text>
      {loadingPromos ? (
        <SkeletonPromoCarousel />
      ) : promos.filter(canShowPromo).length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8, marginBottom: 21 }}>
          {promos.filter(canShowPromo).map(promo => (
            <View key={promo.id} style={styles.promoCard}>
              <Image source={{ uri: promo.imageUrl }} style={styles.promoImg} />
              <View style={styles.promoOverlay}>
                <Text style={styles.promoText}>{promo.text}</Text>
                <Pressable
                  style={styles.promoBtn}
                  onPress={() => handlePromoAction(promo)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>{promo.cta}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>Sin promociones disponibles.</Text>
      )}

      {/* SERVICIOS */}
      <Text style={styles.sectionTitle}>Nuestros Servicios</Text>
      {loadingServices ? (
        <SkeletonServices />
      ) : services.length > 0 ? (
        <FlatList
          data={services}
          horizontal
          renderItem={({ item }) => (
            <Pressable style={styles.serviceCard} onPress={() => navigation.navigate("Main", { screen: "Services" })}>
              <View style={styles.iconCircle}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.serviceImg} resizeMode="cover" />
                ) : (
                  <MaterialCommunityIcons
                    title={item.icon || "spa"}
                    size={32}
                    color={theme.colors.primary}
                  />
                )}
              </View>
              <Text style={styles.serviceName}>{item.name}</Text>
              {item.price && <Text style={styles.servicePrice}>${item.price}</Text>}
            </Pressable>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={{ gap: 17, marginTop: 12, marginBottom: 19, paddingLeft: 5, paddingRight: 5 }}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.emptyText}>Sin servicios disponibles.</Text>
      )}

      {/* GALERÍA DE FOTOS */}
      <Text style={styles.sectionTitle}>Galería</Text>
      {loadingGallery ? (
        <SkeletonGallery />
      ) : gallery.length > 0 ? (
        <FlatList
          horizontal
          data={gallery}
          keyExtractor={img => img.id}
          renderItem={({ item }) =>
            item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.galleryImg} />
            ) : null
          }
          contentContainerStyle={{ gap: 10, marginTop: 7, marginBottom: 24, paddingLeft: 2 }}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.emptyText}>Sin fotos en galería aún.</Text>
      )}

      {/* TESTIMONIOS */}
      <Text style={styles.sectionTitle}>Clientes felices</Text>
      {loadingReviews ? (
        <SkeletonReviews />
      ) : reviews.length > 0 ? (
        <FlatList
          horizontal
          data={reviews}
          keyExtractor={r => r.id}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              {item.image ?
                <Image source={{ uri: item.image }} style={styles.reviewAvatar} />
                : <View style={[styles.reviewAvatar, { backgroundColor: "#eee" }]} /> }
              <View>
                <Text style={styles.reviewName}>{item.name}</Text>
                <View style={styles.starRow}>
                  {[...Array(Math.round(item.rating))].map((_, i) => (
                    <Ionicons key={i} name="star" size={14} color="#FA4376" />
                  ))}
                </View>
                <Text style={styles.reviewComment}>{item.comment}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={{ gap: 17, marginTop: 7, marginBottom: 30, paddingLeft: 2 }}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.emptyText}>Sin testimonios aún.</Text>
      )}

      {/* CTA importante */}
      <Pressable
        style={styles.bookCta}
        onPress={() => navigation.navigate("Main", { screen: "Services" })}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>¡Reserva tu cita ahora!</Text>
      </Pressable>
    </ScrollView>
  );
}

// SKELETONS (componentes insignificantes, solo UI)
function SkeletonPromoCarousel() {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
      {[1,2].map(i =>
        <View key={i} style={[styles.promoCard, { backgroundColor: "#f3f2f6" }]} />
      )}
    </View>
  );
}
function SkeletonServices() {
  return (
    <View style={{ flexDirection: "row", gap: 16, marginBottom: 18 }}>
      {[0,1,2].map(i =>
        <View key={i} style={[styles.serviceCard, { backgroundColor: "#f2f2f2", minWidth: 110, minHeight: 90 }]} />
      )}
    </View>
  );
}
function SkeletonGallery() {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
      {[0,1,2,3].map(i =>
        <View key={i} style={{ width: 110, height: 90, borderRadius: 12, backgroundColor: "#ebebeb" }} />
      )}
    </View>
  );
}
function SkeletonReviews() {
  return (
    <View style={{ flexDirection: "row", gap: 13, marginBottom: 26 }}>
      {[0,1].map(i =>
        <View key={i} style={{ backgroundColor: "#ede7ec", borderRadius: 16, flexDirection: "row", alignItems: "center", padding: 12, minWidth: 170, height: 58 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 16, paddingHorizontal: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingBottom: 3 },
  cityLabel: { fontWeight: "700", fontSize: 15, color: "#111" },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#FA4376", marginVertical: 10 },
  emptyText: { color: "#aaa", textAlign: "center", marginBottom: 14 },
  promoCard: { width: windowWidth * 0.89, height: 120, borderRadius: 26, overflow: "hidden", marginRight: 9 },
  promoImg: { width: "100%", height: "100%", position: "absolute" },
  promoOverlay: { position: "absolute", left: 17, bottom: 16 },
  promoText: { color: "#fff", fontSize: 19, fontWeight: "700", marginBottom: 7, maxWidth: 185 },
  promoBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 7, borderRadius: 13, marginTop: 2, alignSelf: "flex-start" },
  serviceCard: { backgroundColor: "#fdf3f8", borderRadius: 16, padding: 18, alignItems: "center", minWidth: 114, elevation: 2 },
  iconCircle: { backgroundColor: "#fff", width: 48, height: 48, justifyContent: "center", alignItems: "center", borderRadius: 15, marginBottom: 9, elevation: 1 },
  serviceImg: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#eee" },
  serviceName: { fontWeight: "700", fontSize: 15, marginBottom: 3 },
  servicePrice: { color: "#FA4376", fontWeight: "700", fontSize: 13 },
  galleryImg: { width: 110, height: 90, borderRadius: 12, backgroundColor: "#eee" },
  reviewCard: { backgroundColor: "#FCE9F1", borderRadius: 16, flexDirection: "row", alignItems: "center", padding: 10, minWidth: 180 },
  reviewAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 13 },
  reviewName: { fontWeight: "bold", color: "#222", fontSize: 15 },
  reviewComment: { color: "#555", fontSize: 13, marginTop: 4, maxWidth: 110 },
  starRow: { flexDirection: "row", gap: 1 },
  bookCta: { backgroundColor: "#FA4376", borderRadius: 23, paddingVertical: 16, alignItems: "center", marginHorizontal: 8, marginBottom: 35 }
});