import { HeaderBack } from "@/src/components/HeaderBack";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

import { AppAlert } from "../../components/AppAlert";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { db } from "../../lib/firebase";
import { theme } from "../../theme/theme";

const rewardSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
});

const schema = z
  .object({
    text: z.string().optional(),
    cta: z.string().optional(),
    code: z.string().optional(),
    imageUrl: z.string().url(),
    type: z.enum(["ruleta", "cupon", "info", "otro"]),
    rewards: z.array(rewardSchema).optional(),
    visibility: z.enum(["all", "include", "exclude"]),
    audience: z.array(z.object({ value: z.string() })).optional(),
    expiresAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "cupon" && (!data.code || !data.code.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["code"],
        message: "Código de cupón requerido",
      });
    }
    if (data.type === "ruleta" && (!data.rewards || data.rewards.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rewards"],
        message: "Debes agregar al menos un premio.",
      });
    }
    if (
      (data.visibility === "include" || data.visibility === "exclude") &&
      (!data.audience || data.audience.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["audience"],
        message: "Selecciona al menos un usuario.",
      });
    }
  });

type FormValues = z.infer<typeof schema>;
type UserData = { uid: string; email?: string; displayName?: string };


interface PromotionFormProps {
  initialValues?: Partial<FormValues>;
  promoId?: string;
  onDone: () => void;
  showButton?: boolean;
  buttonTitle?: string;
  showHeader?: boolean;
}

export function PromotionForm({
  initialValues = {},
  promoId,
  onDone,
  showButton = true,
  buttonTitle,
  showHeader = true,
}: PromotionFormProps) {
  const navigation = useNavigation();

  const [alert, setAlert] = useState<{ title?: string; msg: string } | null>(null);
  const showAlert = (msg: string, title?: string) => setAlert({ msg, title });

  const [userSearch, setUserSearch] = useState("");
  const [userList, setUserList] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      text: "",
      imageUrl: "",
      cta: "",
      type: "info",
      code: "",
      rewards: [],
      visibility: "all",
      audience: [],
      expiresAt: "",
      ...initialValues,
    },
  });

  const { fields: rewardFields, append: appendReward, remove: removeReward } =
    useFieldArray({ control, name: "rewards" });

  const { fields: audienceFields, append: appendUser, remove: removeUser } =
    useFieldArray({ control, name: "audience" });

  const promoType = watch("type");
  const visibility = watch("visibility");
  const audienceValues = watch("audience");

  const isAlreadyInAudience = (uid: string) =>
    !!audienceValues?.some((a) => a.value === uid);

  useEffect(() => {
    if (userSearch.length < 2) {
      setUserList([]);
      return;
    }

    setLoadingUsers(true);
    (async () => {
      const snap = await getDocs(collection(db, "users"));
      const users: UserData[] = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
      setUserList(
        users.filter(
          (u) =>
            !isAlreadyInAudience(u.uid) &&
            (u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
              u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
              u.uid.includes(userSearch))
        )
      );
      setLoadingUsers(false);
    })();
  }, [userSearch, audienceValues]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: any = {
        text: values.text ? values.text.trim() : "",
        imageUrl: values.imageUrl.trim(),
        cta: values.cta ? values.cta.trim() : "",
        type: values.type,
        visibility: values.visibility,
        expiresAt: values.expiresAt || null,
        updatedAt: serverTimestamp(),
        audience:
          values.visibility === "all"
            ? []
            : values.audience?.map((a) => a.value) ?? [],
      };

      if (values.type === "ruleta") {
        payload.rewards = values.rewards?.map((r) => ({
          code: r.code.trim(),
          label: r.label.trim(),
        }));
      }

      if (values.type === "cupon") {
        payload.code = values.code?.trim();
      }

      if (promoId) {
        await updateDoc(doc(db, "promos", promoId), payload);
        showAlert("Promoción editada correctamente", "Listo");
      } else {
        await addDoc(collection(db, "promos"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        showAlert("Promoción creada correctamente", "Listo");
        reset();
      }
    } catch (e: any) {
      showAlert(e?.message || "No se pudo guardar", "Error");
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        {showHeader && <HeaderBack />}

        {/* Campos del formulario */}
        <Card style={{ gap: theme.spacing.sm }}>
          <Text>Texto de la promoción</Text>
          <TextInput
            placeholder="Texto de la promoción"
            value={watch("text")}
            onChangeText={(val) => setValue("text", val)}
            style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6 }}
          />
          {errors.text && <Text style={{ color: "red" }}>{errors.text.message}</Text>}
        </Card>

        <Card style={{ gap: theme.spacing.sm }}>
          <Text>URL de la imagen</Text>
          <TextInput
            placeholder="https://..."
            value={watch("imageUrl")}
            onChangeText={(val) => setValue("imageUrl", val)}
            style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6 }}
          />
          {errors.imageUrl && <Text style={{ color: "red" }}>{errors.imageUrl.message}</Text>}
        </Card>

        <Card style={{ gap: theme.spacing.sm }}>
          <Text>CTA (botón)</Text>
          <TextInput
            placeholder="Texto del botón"
            value={watch("cta")}
            onChangeText={(val) => setValue("cta", val)}
            style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6 }}
          />
          {errors.cta && <Text style={{ color: "red" }}>{errors.cta.message}</Text>}
        </Card>

        {promoType === "cupon" && (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text>Código del cupón</Text>
            <TextInput
              placeholder="Código"
              value={watch("code")}
              onChangeText={(val) => setValue("code", val)}
              style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6 }}
            />
            {errors.code && <Text style={{ color: "red" }}>{errors.code.message}</Text>}
          </Card>
        )}

        {promoType === "ruleta" && (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text>Premios</Text>
            {rewardFields.map((r, i) => (
              <View key={r.id} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  placeholder="Código"
                  value={r.code}
                  onChangeText={(val) => setValue(`rewards.${i}.code`, val)}
                  style={{ borderWidth: 1, borderColor: "#ccc", padding: 6, flex: 1 }}
                />
                <TextInput
                  placeholder="Etiqueta"
                  value={r.label}
                  onChangeText={(val) => setValue(`rewards.${i}.label`, val)}
                  style={{ borderWidth: 1, borderColor: "#ccc", padding: 6, flex: 1 }}
                />
                <Button title="Eliminar" onPress={() => removeReward(i)} />
              </View>
            ))}
            <Button title="Agregar premio" onPress={() => appendReward({ code: "", label: "" })} />
            {errors.rewards && <Text style={{ color: "red" }}>{errors.rewards.message}</Text>}
          </Card>
        )}

        <Card style={{ gap: theme.spacing.sm }}>
          <Text>Visibilidad</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {["all", "include", "exclude"].map((v) => (
              <Button
                key={v}
                title={v}
                onPress={() => setValue("visibility", v as any)}
                style={{
                  backgroundColor: visibility === v ? theme.colors.primary : "#eee",
                }}
              />
            ))}
          </View>
        </Card>

        {(visibility === "include" || visibility === "exclude") && (
          <Card style={{ gap: theme.spacing.sm }}>
            <Text>Seleccionar usuarios</Text>
            <TextInput
              placeholder="Buscar usuarios..."
              value={userSearch}
              onChangeText={setUserSearch}
              style={{ borderWidth: 1, borderColor: "#ccc", padding: 8, borderRadius: 6 }}
            />
            {loadingUsers && <ActivityIndicator />}
            {userList.map((u) => (
              <Button
                key={u.uid}
                title={u.displayName || u.email || u.uid}
                onPress={() => appendUser({ value: u.uid })}
              />
            ))}

            {audienceFields.map((a, i) => (
              <View key={a.id} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <Text>{a.value}</Text>
                <Button title="Eliminar" onPress={() => removeUser(i)} />
              </View>
            ))}

            {errors.audience && <Text style={{ color: "red" }}>{errors.audience.message}</Text>}
          </Card>
        )}

        {showButton && (
          <Card>
            <Button
              title={buttonTitle ?? (promoId ? "Guardar cambios" : "Crear promoción")}
              onPress={handleSubmit(onSubmit)}
            />
          </Card>
        )}
      </ScrollView>

      <AppAlert
        visible={!!alert}
        title={alert?.title}
        message={alert?.msg ?? ""}
        onClose={() => {
          setAlert(null);
          onDone();
        }}
      />
    </>
  );
}
