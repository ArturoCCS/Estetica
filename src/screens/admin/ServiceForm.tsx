import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView } from "react-native";
import { z } from "zod";

import { useNavigation } from "@react-navigation/native";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { db } from "../../lib/firebase";
import { theme } from "../../theme/theme";

const schema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  description: z.string().optional(),
  category: z.string().optional(),
  durationMin: z.string().min(1, "Requerido"),
  durationMax: z.string().min(1, "Requerido"),
  price: z.string().optional(),
  imageUrl: z.string().url("Debes poner una URL válida").optional().or(z.literal(""))
}).superRefine((v, ctx) => {
  const min = Number(v.durationMin); const max = Number(v.durationMax);
  if (Number.isNaN(min) || min < 10)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["durationMin"], message: "Mínimo 10 min" });
  if (Number.isNaN(max) || max < 10)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["durationMax"], message: "Mínimo 10 min" });
  if (!Number.isNaN(min) && !Number.isNaN(max) && max < min)
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["durationMax"], message: "La duración máxima debe ser mayor o igual a la mínima" });
  const priceTrim = (v.price ?? "").trim();
  if (priceTrim.length > 0) {
    const p = Number(priceTrim.replace(",", "."));
    if (Number.isNaN(p) || p < 0)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["price"], message: "Precio inválido" });
  }
});

type FormValues = z.infer<typeof schema>;
type Props = {
  initialValues?: Partial<FormValues>;
  serviceId?: string;
  onDone: () => void;
};

export function ServiceForm({ initialValues, serviceId, onDone }: Props) {
  const navigation = useNavigation();
  const { control, handleSubmit, formState, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      category: "general",
      durationMin: "60",
      durationMax: "90",
      price: "",
      imageUrl: "",
      ...initialValues
    }
  });

  useEffect(() => {
    if (initialValues) {
      reset({ ...initialValues });
    }
  }, [initialValues]);

  const onSubmit = async (values: FormValues) => {
    try {
      const durationMin = Number(values.durationMin);
      const durationMax = Number(values.durationMax);
      const priceTrim = (values.price ?? "").trim();
      const price = priceTrim.length === 0 ? null : Number(priceTrim.replace(",", "."));
      const payload = {
        name: values.name.trim(),
        description: (values.description ?? "").trim(),
        category: (values.category ?? "general").trim(),
        durationMin,
        durationMax,
        price,
        active: true,
        photos: [],
        imageUrl: (values.imageUrl ?? "").trim(),
        updatedAt: serverTimestamp(),
      };
      if (serviceId) {
        // Editar servicio existente
        await updateDoc(doc(db, "services", serviceId), payload);
        Alert.alert("Editado", "El servicio fue actualizado");
      } else {
        // Crear nuevo servicio
        await addDoc(collection(db, "services"), { ...payload, createdAt: serverTimestamp() });
        Alert.alert("Listo", "Servicio creado");
        reset();
      }
      onDone();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo guardar");
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Button title="Volver al panel" onPress={() => navigation.goBack()} />
        <Card style={{ gap: theme.spacing.md }}>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <TextField
                label="Nombre"
                value={value}
                onChangeText={onChange}
                error={formState.errors.name?.message}
                placeholder="Ej. Uñas acrílicas"
              />
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <TextField
                label="Descripción"
                value={value ?? ""}
                onChangeText={onChange}
                placeholder="Qué incluye, recomendaciones, etc."
                multiline
                style={{ height: 90 }}
              />
            )}
          />
          <Controller
            control={control}
            name="category"
            render={({ field: { value, onChange } }) => (
              <TextField
                label="Categoría"
                value={value ?? ""}
                onChangeText={onChange}
                placeholder="uñas, cabello, maquillaje…"
              />
            )}
          />
          <Controller
            control={control}
            name="durationMin"
            render={({ field: { value, onChange } }) => (
              <TextField
                label="Duración mínima (min)"
                value={value}
                onChangeText={onChange}
                keyboardType="number-pad"
                error={formState.errors.durationMin?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="durationMax"
            render={({ field: { value, onChange } }) => (
              <TextField
                label="Duración máxima (min)"
                value={value}
                onChangeText={onChange}
                keyboardType="number-pad"
                error={formState.errors.durationMax?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="price"
            render={({ field: { value, onChange } }) => (
              <TextField
                label="Precio (opcional)"
                value={value ?? ""}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                placeholder="Ej. 350"
                error={formState.errors.price?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="imageUrl"
            render={({ field: { value, onChange } }) => (
              <TextField
                label="URL de foto de referencia (opcional)"
                value={value ?? ""}
                onChangeText={onChange}
                placeholder="https://ejemplo.com/foto.jpg"
                error={formState.errors.imageUrl?.message}
              />
            )}
          />
          <Button title={serviceId ? "Guardar cambios" : "Guardar"} onPress={handleSubmit(onSubmit)} />
        </Card>
      </ScrollView>
    </Screen>
  );
}