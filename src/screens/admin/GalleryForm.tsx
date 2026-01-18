import { zodResolver } from "@hookform/resolvers/zod";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { z } from "zod";

import { HeaderBack } from "@/src/components/HeaderBack";
import { useNavigation } from "@react-navigation/native";
import { AppAlert } from "../../components/AppAlert";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { db } from "../../lib/firebase";
import { theme } from "../../theme/theme";

const schema = z.object({
  imageUrl: z
    .string()
    .trim()
    .url("Debes poner una URL válida")
    .refine(
      (val) =>
        val.startsWith("http://") || val.startsWith("https://"),
      "Debe ser una URL válida"
    ),
});


type FormValues = z.infer<typeof schema>;

type Props = {
  initialValues?: Partial<FormValues>;
  galleryId?: string;
  onDone: () => void;
};

export function GalleryForm({ initialValues, galleryId, onDone }: Props) {
  const navigation = useNavigation();

  const [alert, setAlert] = useState<{ title?: string; msg: string } | null>(
    null
  );

  function showAlert(msg: string, title?: string) {
    setAlert({ title, msg });
  }

  const { control, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      imageUrl: "",
      ...initialValues,
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset({ ...initialValues });
    }
  }, [initialValues]);

  async function getInstagramImageUrl(postUrl: string) {
    try {
      const match = postUrl.match(/\/p\/([a-zA-Z0-9_-]+)/);
      if (!match) return null;

      const shortcode = match[1];
      const apiUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;

      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      const data = await response.json();

      return data.graphql.shortcode_media.display_url;
    } catch (err) {
      console.error("Error obteniendo imagen de Instagram:", err);
      return null;
    }
  }

  const onSubmit = async (values: FormValues) => {
    try {
      let finalUrl = values.imageUrl.trim();

      if (finalUrl.includes("instagram.com/p/")) {
        const instaUrl = await getInstagramImageUrl(finalUrl);
        if (!instaUrl) {
          showAlert("No se pudo obtener la imagen de Instagram", "Error");
          return;
        }
        finalUrl = instaUrl;
      }

      const payload = {
        imageUrl: finalUrl,
        updatedAt: serverTimestamp(),
      };

      if (galleryId) {
        await updateDoc(doc(db, "gallery", galleryId), payload);
        showAlert("Foto editada correctamente", "Listo");
      } else {
        await addDoc(collection(db, "gallery"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        showAlert("Foto agregada a la galería", "Listo");
        reset();
      }
    } catch (e: any) {
      showAlert(e?.message ?? "No se pudo guardar", "Error");
    }
  };

  const handleAlertClose = () => {
    setAlert(null);
    onDone();
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
                placeholder="https://ejemplo.com/gallery.jpg o Instagram"
                error={formState.errors.imageUrl?.message}
                autoCapitalize="none"
              />
            )}
          />

          <Button
            title={galleryId ? "Guardar cambios" : "Agregar"}
            onPress={handleSubmit(onSubmit)}
          />
        </Card>
      </ScrollView>

      <AppAlert
        visible={!!alert}
        title={alert?.title}
        message={alert?.msg ?? ""}
        onClose={handleAlertClose}
      />
    </Screen>
  );
}
