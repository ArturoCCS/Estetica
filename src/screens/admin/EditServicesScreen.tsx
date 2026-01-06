import { useNavigation, useRoute } from "@react-navigation/native";
import React from "react";
import { ServiceForm } from "./ServiceForm";

// Suponiendo que le mandas { service } por navigation
export function EditServiceScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { service } = route.params as any; // O tipa el param

  return (
    <ServiceForm
      initialValues={{
        name: service.name,
        description: service.description,
        category: service.category,
        durationMin: String(service.durationMin ?? ""),
        durationMax: String(service.durationMax ?? ""),
        price: service.price ? String(service.price) : "",
        imageUrl: service.imageUrl ?? ""
      }}
      serviceId={service.id}
      onDone={() => navigation.goBack()}
    />
  );
}