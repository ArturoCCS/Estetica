import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Text } from "react-native";

import { HeaderBack } from "@/src/components/HeaderBack";
import { AppAlert } from "../../components/AppAlert";
import { Screen } from "../../components/Screen";
import { db } from "../../lib/firebase";
import { RootStackParamList } from "../../navigation/types";
import { theme } from "../../theme/theme";
import { ServiceForm, ServiceFormValues } from "./ServiceForm";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "EditService">;

export function EditServiceScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();

  const paramService = (route.params as any)?.service;
  const serviceId = paramService?.id;

  const [fullServiceData, setFullServiceData] =
    useState<ServiceFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState<{ title?: string; msg: string } | null>(
    null
  );

  function showAlert(msg: string, title?: string) {
    setAlert({ title, msg });
  }

  useEffect(() => {
    if (!serviceId) {
      showAlert("No se recibió el ID del servicio.", "Error");
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "services", serviceId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setFullServiceData({
            name: data.name ?? "",
            description: data.description ?? "",
            category: data.category ?? "",
            durationMin: String(data.durationMin ?? ""),
            durationMax: String(data.durationMax ?? ""),
            price: data.price ? String(data.price) : "",
            heroImageUrl: data.heroImageUrl ?? data.imageUrl ?? "",
            galleryUrls: Array.isArray(data.galleryUrls)
              ? data.galleryUrls
              : [],
          });
        } else {
          showAlert("El servicio ya no existe.", "Error");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching service:", error);
        showAlert("No se pudieron cargar los detalles.", "Error");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [serviceId]);

  const handleAlertClose = () => {
    setAlert(null);
    navigation.goBack();
  };

  if (loading || !fullServiceData) {
    return (
      <Screen>
        <HeaderBack title="Editar servicio" />
        <Text style={{ padding: 20, color: theme.colors.muted }}>
          Cargando datos completos…
        </Text>

        <AppAlert
          visible={!!alert}
          title={alert?.title}
          message={alert?.msg ?? ""}
          onClose={handleAlertClose}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll style={{ gap: theme.spacing.md }}>
      <HeaderBack title="Editar servicio" />

      <ServiceForm
        initialValues={fullServiceData}
        serviceId={serviceId}
        onDone={() => navigation.goBack()}
      />

      <AppAlert
        visible={!!alert}
        title={alert?.title}
        message={alert?.msg ?? ""}
        onClose={handleAlertClose}
      />
    </Screen>
  );
}
