import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { ImageLightbox } from "../components/ImageLightbox";
import { db } from "../lib/firebase";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../providers/AuthProvider";
import { useNotifications } from "../providers/NotificationsProvider";
import { theme } from "../theme/theme";

const windowWidth = Dimensions.get("window").width;
const isWeb = Platform.OS === "web";

const INITIAL_BLOCKS = 2;
const LOAD_MORE_BLOCKS = 1;
type GalleryLayout = "row3" | "hero2" | "wide" | "mosaic2x2";

const GALLERY_LAYOUTS: GalleryLayout[] = ["row3", "hero2", "wide", "mosaic2x2"];

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
type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  image?: string;
};

type UserProfileDoc = {
  name?: string;
  fullName?: string;
  firstName?: string;
  aboutTitle?: string;
  aboutSubtitle?: string;
  aboutImageUrl?: string;
};

function buildGalleryBlocks(images: GalleryImage[]) {
  const blocks: { layout: GalleryLayout; items: GalleryImage[] }[] = [];
  let i = 0;
  let lastLayout: GalleryLayout | null = null;

  while (i < images.length) {
    const candidates = GALLERY_LAYOUTS.filter((l) => l !== lastLayout);
    const layout = candidates[Math.floor(Math.random() * candidates.length)];

    const needed =
      layout === "mosaic2x2" ? 4 :
      layout === "hero2" ? 3 :
      layout === "row3" ? 3 : 1;

    if (i + needed > images.length) break;

    blocks.push({ layout, items: images.slice(i, i + needed) });
    i += needed;
    lastLayout = layout;
  }

  return blocks;
}

function GalleryBlock({
  layout,
  items,
  onImagePress,
}: {
  layout: GalleryLayout;
  items: GalleryImage[];
  onImagePress: (image: GalleryImage) => void;
}) {
  const Tile = ({ img, style }: { img: GalleryImage; style: any }) => (
    <Pressable onPress={() => onImagePress(img)} style={[g.tile, style]}>
      <Image source={{ uri: img.imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <View style={g.tileShade} />
    </Pressable>
  );

  if (layout === "row3") {
    return (
      <View style={g.row}>
        <Tile img={items[0]} style={g.tileSm} />
        <Tile img={items[1]} style={g.tileSm} />
        <Tile img={items[2]} style={g.tileSm} />
      </View>
    );
  }

  if (layout === "hero2") {
    return (
      <View style={g.row}>
        <Tile img={items[0]} style={g.tileHero} />
        <View style={g.col}>
          <Tile img={items[1]} style={g.tileMd} />
          <Tile img={items[2]} style={g.tileMd} />
        </View>
      </View>
    );
  }

  if (layout === "wide") {
    return (
      <View style={g.block}>
        <Tile img={items[0]} style={g.tileWide} />
      </View>
    );
  }

  if (layout === "mosaic2x2") {
    return (
      <View style={g.block}>
        <View style={g.row}>
          <Tile img={items[0]} style={g.tileSm} />
          <Tile img={items[1]} style={g.tileSm} />
        </View>
        <View style={g.row}>
          <Tile img={items[2]} style={g.tileSm} />
          <Tile img={items[3]} style={g.tileSm} />
        </View>
      </View>
    );
  }

  return null;
}
function getFirstName(input?: string | null) {
  if (!input) return "";
  const clean = input.split("@")[0].replace(/[._-]+/g, " ").trim();
  const first = clean.split(" ").filter(Boolean)[0];
  if (!first) return "";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function getGreetingByHour(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function getBeautySlogan(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "Hoy tu belleza empieza con un buen día.";
  if (h >= 12 && h < 20) return "Un toque de brillo y lista para todo.";
  return "Un momento para ti. Un look para brillar.";
}

export function HomeScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageIndexPromos, setCurrentImageIndexPromos] = useState(0);


  const [visibleBlockCount, setVisibleBlockCount] = useState(INITIAL_BLOCKS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [profileName, setProfileName] = useState<string>("");
  const [aboutTitle, setAboutTitle] = useState<string>("");
  const [aboutSubtitle, setAboutSubtitle] = useState<string>("");
  const [aboutImageUrl, setAboutImageUrl] = useState<string>("");

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const greeting = useMemo(() => getGreetingByHour(), []);
  const slogan = useMemo(() => getBeautySlogan(), []);

  const galleryBlocks = useMemo(
    () => buildGalleryBlocks(gallery),
    [gallery]
  );
  
  const promoBlocks = useMemo(
    () => buildGalleryBlocks(promos),
    [promos]
  );

  const visibleGalleryBlocks = useMemo(() => {
    return galleryBlocks.slice(0, visibleBlockCount);
  }, [galleryBlocks, visibleBlockCount]);


  const handleImagePress = (image: GalleryImage) => {
    const index = gallery.findIndex((img) => img.id === image.id);
    if (index !== -1) {
      setCurrentImageIndex(index);
      setIsModalVisible(true);
    }
  };

    const handlePromoPress = (image: Promo) => {
    const index = promos.findIndex((img) => img.id === image.id);
    if (index !== -1) {
      setCurrentImageIndexPromos(index);
      setIsModalVisible(true);
    }
  };
  
  const navigateLightbox = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < gallery.length) {
      setCurrentImageIndex(newIndex);
    }
  };

  const handleToggleGallery = () => {

    if (visibleBlockCount >= galleryBlocks.length) {
      setVisibleBlockCount(INITIAL_BLOCKS);
    } else {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleBlockCount((prev) =>
          Math.min(prev + LOAD_MORE_BLOCKS, galleryBlocks.length)
        );
        setIsLoadingMore(false);
      }, 400);
    }
  };

    const handleTogglePromos = () => {

    if (visibleBlockCount >= promoBlocks.length) {
      setVisibleBlockCount(INITIAL_BLOCKS);
    } else {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleBlockCount((prev) =>
          Math.min(prev + LOAD_MORE_BLOCKS, promoBlocks.length)
        );
        setIsLoadingMore(false);
      }, 400);
    }
  };


  const aboutHeroLocal = require("../../assets/images/EsteticaInit.jpeg");
  const heroSource = aboutImageUrl
    ? { uri: aboutImageUrl }
    : aboutHeroLocal;

  useEffect(() => {
    if (!user?.uid) {
      setProfileName("");
      setAboutTitle("");
      setAboutSubtitle("");
      setAboutImageUrl("");
      return;
    }

    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setProfileName("");
          setAboutTitle("");
          setAboutSubtitle("");
          setAboutImageUrl("");
          return;
        }

        const data = snap.data() as UserProfileDoc;

        const rawName = data.firstName || data.name || data.fullName || "";
        setProfileName(rawName ? getFirstName(rawName) : "");

        setAboutTitle(data.aboutTitle || "");
        setAboutSubtitle(data.aboutSubtitle || "");
        setAboutImageUrl(data.aboutImageUrl || "");
      },
      () => {
        setProfileName("");
        setAboutTitle("");
        setAboutSubtitle("");
        setAboutImageUrl("");
      }
    );

    return unsub;
  }, [user?.uid]);
  
  const displayName = useMemo(() => {
    if (profileName) return profileName;
    const anyUser = user as any;
    const fromAuth = getFirstName(anyUser?.displayName);
    if (fromAuth) return fromAuth;
    return getFirstName(user?.email);
  }, [profileName, user]);

  const resolvedAboutTitle = useMemo(() => {
    return aboutTitle || "Sobre mí";
  }, [aboutTitle]);

  const resolvedAboutSubtitle = useMemo(() => {
    return (
      aboutSubtitle ||
      "Especialista en belleza y cuidado personal. Detalles, armonía y un look que se sienta como tú."
    );
  }, [aboutSubtitle]);

  const promoListRef = useRef<FlatList<Promo>>(null);
  const [promoViewportW, setPromoViewportW] = useState(0);
  const [promoIndex, setPromoIndex] = useState(0);
  const userInteractedAtRef = useRef<number>(0);

  function canShowPromo(promo: Promo) {
    if (!promo.audience || promo.audience.length === 0) return true;
    if (!user) return false;
    return (
      promo.audience.includes(user.uid) ||
      promo.audience.includes((user.email || "").toLowerCase())
    );
  }

  const visiblePromos = useMemo(
    () => promos.filter(canShowPromo),
    [promos, user?.uid, user?.email]
  );

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

  async function saveCouponToProfile(
    promo: Promo,
    code: string,
    label: string = ""
  ) {
    if (!user) return;
    try {
      const ref = collection(db, "users", user.uid, "coupons");
      const snapshot = await getDocs(ref);
      const already = snapshot.docs.find(
        (d) => d.data().promoId === promo.id && d.data().code === code
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
      Alert.alert("Inicia sesión para participar en la promoción.");
      navigation.navigate("Main", { screen: "Perfil" });
      return;
    }
    if (promo.type === "ruleta" && promo.rewards && promo.rewards.length > 0) {
      navigation.navigate("PromoRoulette", {
        promoId: promo.id,
        rewards: promo.rewards,
      });
      return;
    }
    if (promo.type === "cupon" && promo.code) {
      saveCouponToProfile(promo, promo.code, promo.text);
      return;
    }
    Alert.alert("Promoción", promo.text);
  }

  const containerStyle: StyleProp<ViewStyle> = isWeb
    ? ({ maxWidth: 1200, alignSelf: "center", width: "100%" } as const)
    : undefined;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={containerStyle}
      showsVerticalScrollIndicator={Platform.OS === "web"}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.slogan}>{greeting},</Text>
          <Text style={styles.greeting}>
            {displayName ? `${displayName}` : "Bienvenida"}
          </Text>
          <Text style={styles.slogan}>{slogan}</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate("Notifications")}
          style={styles.bellContainer}
          hitSlop={10}
        >
          <Ionicons name="notifications-outline" size={24} color="#111827" />
          
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

        <Pressable
          style={styles.aboutHero}
          onPress={() => navigation.navigate("About")}
        >
        <Image
          source={heroSource}
          style={styles.aboutHeroImg}
          resizeMode="cover"
        />
        <View style={styles.aboutHeroShade} />

        <View style={styles.aboutHeroContent}>
          <Text style={styles.aboutHeroKicker}>BEAUTY STUDIO</Text>
          <Text style={styles.aboutHeroTitle}>{resolvedAboutTitle}</Text>
          <Text style={styles.aboutHeroSubtitle} numberOfLines={2}>
            {resolvedAboutSubtitle}
          </Text>

          <View style={styles.aboutHeroCta}>
            <Text style={styles.aboutHeroCtaText}>Conóceme</Text>
            <Ionicons name="arrow-forward" size={16} color="#111827" />
          </View>
        </View>
      </Pressable>

      <View style={[styles.section, styles.sectionTint]}>

        {loadingPromos ? (
          <SkeletonPromoCarousel />
        ) : visiblePromos.length > 0 ? (
          <View
            style={styles.promoCarouselWrap}
            onLayout={(e) => setPromoViewportW(e.nativeEvent.layout.width)}
          >
            {promoViewportW > 0 && (
              <>
                <FlatList
                  ref={promoListRef}
                  data={visiblePromos}
                  keyExtractor={(p) => p.id}
                  horizontal
                  pagingEnabled
                  bounces={false}
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={visiblePromos.length > 1}
                  onScrollBeginDrag={markUserInteracted}
                  onMomentumScrollBegin={markUserInteracted}
                  onMomentumScrollEnd={(e) => {
                    const x = e.nativeEvent.contentOffset.x;
                    const idx = Math.round(x / promoViewportW);
                    setPromoIndex(idx);
                  }}
                  scrollEventThrottle={16}
                  renderItem={({ item: promo }) => (
                    <Pressable
                      style={{ width: promoViewportW, padding: 5 }}
                      onPress={() => handlePromoPress(promo)} 
                    >
                      <View style={styles.promoCard}>
                        <View style={styles.promoImageWrap}>
                          <Image source={{ uri: promo.imageUrl }} style={styles.promoImg} />
                          <View style={styles.promoShade} />

                          {(promo.text || promo.cta) && (
                            <View style={styles.promoOverlay}>
                              {promo.text && (
                                <Text style={styles.promoText} numberOfLines={2}>
                                  {promo.text}
                                </Text>
                              )}

                              {promo.cta && (
                                <Pressable
                                  style={styles.promoBtn}
                                  onPress={() => handlePromoAction(promo)}
                                >
                                  <Text style={styles.promoBtnText}>{promo.cta}</Text>
                                  <Ionicons
                                    name="chevron-forward"
                                    size={16}
                                    color={theme.colors.primary}
                                  />
                                </Pressable>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  )}
                />

                {visiblePromos.length > 1 && (
                  <View style={styles.promoBase}>
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
                          style={[styles.baseDot, active && styles.baseDotActive]}
                        />
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>Sin novedades por ahora.</Text>
        )}
      </View>

      <View style={[styles.section, styles.sectionSurface]}>
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
                <Pressable
                  style={styles.serviceCard}
                  onPress={() =>
                    navigation.navigate("ServiceDetail", { serviceId: item.id })
                  }
                >
                  {hero ? (
                    <Image
                      source={{ uri: hero }}
                      style={styles.serviceImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.serviceImg, styles.serviceImgPlaceholder]}>
                      <Ionicons name="image-outline" size={28} color="#d1d5db" />
                    </View>
                  )}
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.price && (
                      <Text style={styles.servicePrice}>${item.price}</Text>
                    )}
                  </View>
                </Pressable>
              );
            }}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12, marginTop: 12, paddingHorizontal: 2 }}
            showsHorizontalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.emptyText}>Sin servicios disponibles.</Text>
        )}
      </View>

      {gallery.length > 0 && (
        <View style={[styles.section, styles.sectionTint, styles.end]}>
          <Text style={[styles.sectionTitle]}>Galería</Text>
          
          {loadingGallery ? (
            <SkeletonGallery />
          ) : (
            <View style={{ marginTop: 12 }}>
              {visibleGalleryBlocks.map((block, i) => (
                <GalleryBlock
                  key={i}
                  layout={block.layout}
                  items={block.items}
                  onImagePress={handleImagePress}
                />
              ))}
            </View>
          )}

          {galleryBlocks.length > INITIAL_BLOCKS && (
            <Pressable
              onPress={handleToggleGallery}
              style={styles.toggleGalleryButton}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Cargando...</Text>
                </View>
              ) :  visibleBlockCount >= galleryBlocks.length ? (
                <View style={styles.buttonContent}>
                  <Ionicons name="chevron-up-outline" size={22} color={theme.colors.primary} />
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="chevron-down-outline" size={22} color={theme.colors.primary} />
                </View>
              )}
            </Pressable>
          )}
        </View>
      )}

      {reviews.length > 0 && (
        <View style={[styles.section, styles.sectionSurface]}>
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
                    <View
                      style={[styles.reviewAvatar, { backgroundColor: "#f3f4f6" }]}
                    />
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
              contentContainerStyle={{ gap: 12, marginTop: 8, paddingHorizontal: 2 }}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </View>
      )}

      <View style={{ height: 26 }} />

      <ImageLightbox
        images={gallery}
        selectedIndex={currentImageIndex}
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onNavigate={navigateLightbox}
      />
      <ImageLightbox
        images={promos.map(p => ({ id: p.id, imageUrl: p.imageUrl }))}
        selectedIndex={currentImageIndexPromos}
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onNavigate={(newIndex) => setCurrentImageIndexPromos(newIndex)}
      />

    </ScrollView>
  );
}

function SkeletonPromoCarousel() {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 4, marginTop: 8 }}>
      {[1, 2].map((i) => (
        <View key={i} style={[styles.promoCard, { backgroundColor: "#f3f4f6" }]} />
      ))}
    </View>
  );
}

function SkeletonServices() {
  return (
    <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: 16,
            minWidth: 140,
            height: 180,
          }}
        />
      ))}
    </View>
  );
}

function SkeletonGallery() {
  return (
    <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{ width: 140, height: 100, borderRadius: 16, backgroundColor: "#f3f4f6" }}
        />
      ))}
    </View>
  );
}

function SkeletonReviews() {
  return (
    <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
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

const GALLERY_GAP = 6;
const GALLERY_RADIUS = 18;

const g = StyleSheet.create({
  block: {
    gap: GALLERY_GAP,
    marginBottom: GALLERY_GAP,
  },
  row: {
    flexDirection: "row",
    gap: GALLERY_GAP,
    marginBottom: GALLERY_GAP,
  },
  col: {
    flex: 1,
    gap: GALLERY_GAP,
  },

  tile: {
    borderRadius: GALLERY_RADIUS,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  tileShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  tileSm: { flex: 1, height: 110 },
  tileMd: { flex: 1, height: 112 },

  tileHero: { flex: 1.35, height: 230 },

  tileWide: { width: "100%", height: 170 },
});

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fbfafb",
    paddingTop: Platform.OS === "web" ? 10 : 40,
    paddingHorizontal: 16,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 12,
    marginBottom: 4,
  },
  bellContainer: {
    position: "relative",
    padding: 4,
    marginTop: 2,
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
    fontFamily: "Libre Caslon Display",
    fontSize: 26,
    fontWeight: "900",
    color: "#000",
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  slogan: {
    marginTop: 6,
    fontWeight: "500",
    fontSize: 14,
    color: "#717473",
    lineHeight: 20,
    maxWidth: 420,
  },

  section: {
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 12,
    marginBottom: 20,
  },
  sectionSurface: {
    marginBottom: -20,
    backgroundColor: "",
  },
  sectionTint: {
    marginTop: 30,
    
    marginBottom: -10,
    backgroundColor: "",
  },
  end: {
    marginBottom: 85,
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: "900",
    color: "#4f3e1d",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  emptyText: {
    color: "#9ca3af",
    marginTop: 10,
    fontSize: 13,
  },

  aboutHero: {
    height: 390,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 8,
    ...Platform.select({
      ios: {
        boxShadowColor: "#000",
        boxShadowOpacity: 0.12,
        boxShadowRadius: 14,
        boxShadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 4 },
      web: { boxboxShadow: "0 6px 16px rgba(0,0,0,0.14)" },
    }),
  },
  aboutHeroImg: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  aboutHeroShade: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  aboutHeroContent: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    gap: 8,
  },
  aboutHeroKicker: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.6,
  },
  aboutHeroTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  aboutHeroSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 520,
  },
  aboutHeroCta: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  aboutHeroCtaText: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 13,
  },

    promoCard: {
      borderRadius: 22,
      backgroundColor: "transparent",
      overflow: "hidden",
    },
    promoImageWrap: {
      height: 170,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      overflow: "hidden",
    },
    promoImg: {
      width: "100%",
      height: "100%",
      position: "absolute",
    },
    promoShade: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.18)",
    },
    promoBase: {
      height: 60,
      backgroundColor: "#fbfafb",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 15,
      borderRadius: 25,
      alignSelf: "center",
      width: "60%",
      marginTop: -20,
    },
    baseDot: {
      width: 16,
      height: 16,
      borderRadius: 10,
      backgroundColor: "#d1d5db",
    },
  baseDotActive: {
    width: 18,
    height: 18,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
  },
  promoCarouselWrap: {
    marginTop: 10,
    marginHorizontal: -5,
  },
  promoPage: {
    padding: 5,
  },
  promoOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    gap: 10,
  },
  promoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  promoBtn: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    borderRadius: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  promoBtnText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 13,
  },

  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderColor: "#dadadc",
    borderWidth: 1,
    marginVertical: Platform.OS === "web" ? 10: 5,
    marginHorizontal: Platform.OS === "web" ? 2: 0,
    overflow: "hidden",
    width: 140,
    ...Platform.select({
      ios: {
        boxShadowColor: "#000",
        boxShadowOpacity: 0.08,
        boxShadowRadius: 12,
        boxShadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 1 },
      web: { boxboxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
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

  galleryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  galleryCol: {
    flex: 1,
    gap: 10,
  },
  galleryImgBase: {
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    ...Platform.select({
      ios: {
        boxShadowColor: "#000",
        boxShadowOpacity: 0.08,
        boxShadowRadius: 10,
        boxShadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
      web: { boxboxShadow: "0 3px 10px rgba(0,0,0,0.08)" },
    }),
  },

  galleryBig: {
    width: "48%",
    height: 240,
  },
  galleryBigHalf: {
    width: "48%",
    height: 180,
  },
  galleryWide: {
    width: "100%",
    height: 220,
    marginBottom: 10,
  },
  galleryExtraWide: {
    width: "100%",
    height: 200,
    marginBottom: 10,
  },
  gallerySmall: {
    width: "100%",
    height: 115,
  },
  galleryMedium: {
    width: "100%",
    height: 140,
  },
  gallerySquare: {
    width: "48%",
    height: 180,
  },
  gallerySmallSquare: {
    width: "30%",
    height: 280,
  },
  galleryTall: {
    width: "40%",
    height: 280,
  },
  galleryExtraTall: {
    width: "48%",
    height: 340,
  },
  galleryTiny: {
    width: "100%",
    height: 77,
  },
  
  toggleGalleryButton: {
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
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
        boxShadowColor: "#000",
        boxShadowOpacity: 0.06,
        boxShadowRadius: 8,
        boxShadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      web: { boxboxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
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
});