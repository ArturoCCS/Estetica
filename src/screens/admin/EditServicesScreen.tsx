import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Alert, Text } from "react-native";

import { HeaderBack } from "@/src/components/HeaderBack";
import { Screen } from "../../components/Screen";
import { RootStackParamList } from "../../navigation/types";
import { theme } from "../../theme/theme";
import { ServiceForm } from "./ServiceForm";

// Tipos para navegación
type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "EditService">;

// Si tu param no es "service" sino "serviceId" o "id", dímelo y lo ajusto.
export function EditServiceScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();

  const service = (route.params as any)?.service;

  React.useEffect(() => {
    if (!service) {
      Alert.alert("Error", "No se recibió el servicio a editar.");
      navigation.goBack();
    }
  }, [service, navigation]);

  if (!service) {
    return (
      <Screen>
        <HeaderBack title="Editar servicio" />
        <Text style={{ color: theme.colors.muted }}>Cargando…</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll style={{ gap: theme.spacing.md }}>
      <HeaderBack title="Editar servicio" />

      <ServiceForm
        initialValues={{
          name: service.name ?? "",
          description: service.description ?? "",
          category: service.category ?? "",
          durationMin: String(service.durationMin ?? ""),
          durationMax: String(service.durationMax ?? ""),
          price: service.price ? String(service.price) : "",
          imageUrl: service.imageUrl ?? service.heroImageUrl ?? "",

          // Si tu ServiceForm ya soporta estos campos nuevos, pásalos:
         heroImageUrl: service.heroImageUrl ?? "",
           galleryUrls: Array.isArray(service.galleryUrls) ? service.galleryUrls : [],
        }}
        serviceId={service.id}
        onDone={() => navigation.goBack()}
      />
    </Screen>
  );
}