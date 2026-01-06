import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView } from "react-native";
import { z } from "zod";

import { HeaderBack } from "@/src/components/HeaderBack";
import { useNavigation } from "@react-navigation/native";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { db } from "../../lib/firebase";
import { theme } from "../../theme/theme";

const schema = z.object({
  imageUrl: z.string().url("Debes poner una URL válida"),
});

type FormValues = z.infer<typeof schema>;
type Props = {
  initialValues?: Partial<FormValues>;
  galleryId?: string;
  onDone: () => void;
};

export function GalleryForm({ initialValues, galleryId, onDone }: Props) {
  const navigation = useNavigation();
  const { control, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      imageUrl: "",
      ...initialValues
    }
  });

  useEffect(() => {
    if (initialValues) reset({ ...initialValues });
  }, [initialValues]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        imageUrl: values.imageUrl.trim(),
        updatedAt: serverTimestamp(),
      };
      if (galleryId) {
        await updateDoc(doc(db, "gallery", galleryId), payload);
        Alert.alert("Listo", "Foto editada");
      } else {
        await addDoc(collection(db, "gallery"), { ...payload, createdAt: serverTimestamp() });
        Alert.alert("Listo", "Foto agregada a galería");
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
        <HeaderBack />
        <Card style={{ gap: theme.spacing.md }}>
          <Controller
            control={control}
            name="imageUrl"
            render={({ field: { value, onChange } }) => (
              <TextField
                label="URL de la imagen"
                value={value}
                onChangeText={onChange}
                placeholder="https://ejemplo.com/galery.jpg"
                error={formState.errors.imageUrl?.message}
              />
            )}
          />
          <Button title={galleryId ? "Guardar cambios" : "Agregar"} onPress={handleSubmit(onSubmit)} />
        </Card>
      </ScrollView>
    </Screen>
  );
}