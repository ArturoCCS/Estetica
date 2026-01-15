import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { theme } from "../theme/theme";

type AboutData = {
  studioName?: string;
  ownerName?: string;
  ownerImageUrl?: string;
  aboutImageUrl?: string;
  description?: string;
  mission?: string;
  values?: string[];
};

export function AboutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  const defaultData: AboutData = {
    studioName: "Key Duran Beauty Studio",
    ownerName: "Key Duran",
    description:
      "En Key Duran Beauty Studio nos especializamos en maquillaje profesional, diseño de pestañas y cuidado estético, con un enfoque en realzar la belleza natural de cada persona a través de técnicas personalizadas, detalle y armonía. Nuestro trabajo se distingue por la calidad, el buen gusto y el respeto por los rasgos individuales, creando resultados elegantes que proyectan seguridad y presencia.",
    mission:
      "Creemos firmemente que la belleza no se trata de transformar, sino de potenciar lo que ya eres. Por ello, cada servicio está diseñado para que te veas impecable, te sientas cómoda y camines con mayor confianza.",
    values: [
      "Atención profesional y personalizada",
      "Resultados de alto nivel",
      "Experiencia donde te sientas valorada",
      "Respeto por tu belleza natural",
    ],
  };

  useEffect(() => {
    if (!user?.uid) {
      setAboutData(defaultData);
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AboutData;
          setAboutData({
            studioName: data.studioName || defaultData.studioName,
            ownerName: data.ownerName || defaultData.ownerName,
            ownerImageUrl: data.ownerImageUrl,
            aboutImageUrl: data.aboutImageUrl,
            description: data.description || defaultData.description,
            mission: data.mission || defaultData.mission,
            values: data.values || defaultData.values,
          });
        } else {
          setAboutData(defaultData);
        }
        setLoading(false);
      },
      () => {
        setAboutData(defaultData);
        setLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const heroImage = aboutData?.aboutImageUrl
    ? { uri: aboutData.aboutImageUrl }
    : require("../../assets/images/EsteticaInit.jpeg");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Sobre Mí</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
        </View>

        <View style={styles.contentCard}>
          <View style={styles.brandSection}>
            <Text style={styles.studioName}>{aboutData?.studioName}</Text>
            <View style={styles.divider} />
          </View>

          {aboutData?.ownerImageUrl && (
            <View style={styles.ownerSection}>
              <Image
                source={{ uri: aboutData.ownerImageUrl }}
                style={styles.ownerImage}
                resizeMode="cover"
              />
              <Text style={styles.ownerName}>{aboutData?.ownerName}</Text>
              <Text style={styles.ownerTitle}>Fundadora y Especialista</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nuestra Especialidad</Text>
            <Text style={styles.bodyText}>{aboutData?.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nuestra Filosofía</Text>
            <Text style={styles.bodyText}>{aboutData?.mission}</Text>
          </View>

          {aboutData?.values && aboutData.values.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nuestro Compromiso</Text>
              <View style={styles.valuesList}>
                {aboutData.values.map((value, index) => (
                  <View key={index} style={styles.valueItem}>
                    <View style={styles.valueBullet} />
                    <Text style={styles.valueText}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Pressable
            style={styles.ctaButton}
            onPress={() => navigation.navigate("Main", { screen: "Servicios" })}
          >
            <Text style={styles.ctaText}>Explora Nuestros Servicios</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "web" ? 20 : 50,
    paddingBottom: 16,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  heroSection: {
    height: 320,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  contentCard: {
    marginTop: -40,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        boxShadowColor: "#000",
        boxShadowOpacity: 0.1,
        boxShadowRadius: 20,
        boxShadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 5 },
      web: { boxboxShadow: "0 10px 30px rgba(0,0,0,0.1)" },
    }),
  },

  brandSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  studioName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },

  ownerSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  ownerImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  ownerName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  ownerTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    letterSpacing: 0.5,
  },

  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#4B5563",
    fontWeight: "400",
  },

  valuesList: {
    gap: 12,
  },
  valueItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  valueBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 8,
  },
  valueText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: "#4B5563",
    fontWeight: "400",
  },

  ctaButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    ...Platform.select({
      ios: {
        boxShadowColor: theme.colors.primary,
        boxShadowOpacity: 0.3,
        boxShadowRadius: 10,
        boxShadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
      web: { boxboxShadow: `0 4px 12px ${theme.colors.primary}4D` },
    }),
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});