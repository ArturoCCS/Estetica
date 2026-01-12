import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, onSnapshot } from "firebase/firestore"; // 1. Importar firestore
import React, { useEffect, useState } from "react";
import { Alert, Text } from "react-native";

import { HeaderBack } from "@/src/components/HeaderBack";
import { Screen } from "../../components/Screen";
import { db } from "../../lib/firebase"; // Asegúrate de importar tu 'db' correctamente
import { RootStackParamList } from "../../navigation/types";
import { theme } from "../../theme/theme";
import { ServiceForm, ServiceFormValues } from "./ServiceForm";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "EditService">;

export function EditServiceScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  
  // Obtenemos el servicio básico de los params para tener el ID
  const paramService = (route.params as any)?.service;
  const serviceId = paramService?.id;

  // Estado local para guardar la data FRESCA y COMPLETA de la BD
  const [fullServiceData, setFullServiceData] = useState<ServiceFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Efecto para descargar los datos reales usando el ID
  useEffect(() => {
    if (!serviceId) {
      Alert.alert("Error", "No se recibió el ID del servicio.");
      navigation.goBack();
      return;
    }

    // Escuchamos el documento en tiempo real
    const unsubscribe = onSnapshot(doc(db, "services", serviceId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Mapeamos los datos de Firestore a la estructura del Formulario
        setFullServiceData({
          name: data.name ?? "",
          description: data.description ?? "",
          category: data.category ?? "", // ✅ Ahora sí traerá la categoría
          durationMin: String(data.durationMin ?? ""),
          durationMax: String(data.durationMax ?? ""),
          price: data.price ? String(data.price) : "",
          heroImageUrl: data.heroImageUrl ?? data.imageUrl ?? "",
          // ✅ Aseguramos que sea array para que no falle la galería
          galleryUrls: Array.isArray(data.galleryUrls) ? data.galleryUrls : [],
        });
      } else {
        Alert.alert("Error", "El servicio ya no existe.");
        navigation.goBack();
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching service:", error);
      Alert.alert("Error", "No se pudieron cargar los detalles.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [serviceId, navigation]);

  if (loading || !fullServiceData) {
    return (
      <Screen>
        <HeaderBack title="Editar servicio" />
        <Text style={{ padding: 20, color: theme.colors.muted }}>Cargando datos completos...</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll style={{ gap: theme.spacing.md }}>
      <HeaderBack title="Editar servicio" />

      {/* 2. Pasamos 'fullServiceData' que contiene la categoría y galería reales */}
      <ServiceForm
        initialValues={fullServiceData}
        serviceId={serviceId}
        onDone={() => navigation.goBack()}
      />
    </Screen>
  );
}