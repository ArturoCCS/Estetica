import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { addDoc, collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Alert, FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { TextField } from "../../components/TextField";
import { db } from "../../lib/firebase";
import { theme } from "../../theme/theme";

const rewardSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1)
});

const schema = z.object({
  text: z.string().min(3),
  imageUrl: z.string().url(),
  cta: z.string().min(1),
  type: z.enum(["ruleta", "cupon", "info", "otro"]),
  code: z.string().optional(),
  rewards: z.array(rewardSchema).optional(),
  visibility: z.enum(["all", "include", "exclude"]),
  audience: z.array(z.object({ value: z.string() })).optional(),
  expiresAt: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.type === "cupon" && (!data.code || !data.code.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["code"],
      message: "Código de cupón requerido"
    });
  }
  if (data.type === "ruleta" && (!data.rewards || data.rewards.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["rewards"],
      message: "Debes agregar al menos un premio."
    });
  }
  if ((data.visibility === "include" || data.visibility === "exclude") &&
    (!data.audience || data.audience.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["audience"],
      message: "Selecciona al menos un usuario."
    });
  }
});

type Reward = z.infer<typeof rewardSchema>;
type FormValues = z.infer<typeof schema>;
type UserData = { uid: string; email?: string; displayName?: string };

interface PromotionFormProps {
  initialValues?: Partial<FormValues>;
  promoId?: string;
  onDone: () => void;
}

export function PromotionForm({ initialValues = {}, promoId, onDone }: PromotionFormProps) {
  const navigation = useNavigation();
  const [userSearch, setUserSearch] = useState<string>("");
  const [userList, setUserList] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    formState,
    reset,
    watch
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
      ...initialValues
    }
  });

  const { fields: rewardFields, append: appendReward, remove: removeReward } = useFieldArray({
    control,
    name: "rewards"
  });

  const { fields: audienceFields, append: appendUser, remove: removeUser } = useFieldArray({
    control,
    name: "audience"
  });

  const promoType = watch("type");
  const visibility = watch("visibility");
  const audienceValues = watch("audience");

  const isAlreadyInAudience = (uid: string) => !!audienceValues?.some((audObj) => audObj.value === uid);

  useEffect(() => {
    if (userSearch.length < 2) {
      setUserList([]);
      return;
    }
    setLoadingUsers(true);
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const allUsers: UserData[] = snap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Partial<UserData>)
      }));
      setUserList(
        allUsers
          .filter(
            (u) =>
              (u.displayName && u.displayName.toLowerCase().includes(userSearch.toLowerCase())) ||
              (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
              (u.uid && u.uid.includes(userSearch))
          )
          .filter((u) => !isAlreadyInAudience(u.uid))
      );
      setLoadingUsers(false);
    };
    fetchUsers();
  }, [userSearch, audienceValues]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: Record<string, any> = {
        text: values.text.trim(),
        imageUrl: values.imageUrl.trim(),
        cta: values.cta.trim(),
        type: values.type,
        visibility: values.visibility,
        expiresAt: values.expiresAt ?? null,
        updatedAt: serverTimestamp()
      };

      if (values.visibility !== "all") {
        payload.audience = (values.audience ?? []).map((aud) => aud.value);
      } else {
        payload.audience = [];
      }

      if (values.type === "ruleta") {
        if (!values.rewards?.length) return;
        payload.rewards = values.rewards.map((r) => ({
          code: r.code.trim(),
          label: r.label.trim()
        }));
      } else if (values.type === "cupon") {
        if (!values.code) return;
        payload.code = values.code?.trim() || "";
      }

      if (promoId) {
        await updateDoc(doc(db, "promos", promoId), payload);
        Alert.alert("Listo", "Promoción editada");
      } else {
        await addDoc(collection(db, "promos"), {
          ...payload,
          createdAt: serverTimestamp()
        });
        Alert.alert("Listo", "Promoción creada");
        reset();
      }
      onDone();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "No se pudo guardar");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
      <Button title="Volver al panel" onPress={() => navigation.goBack()} />
      <Card style={{ gap: theme.spacing.md, marginTop: 14 }}>
        <Controller
          control={control}
          name="text"
          render={({ field: { value, onChange } }) => (
            <TextField label="Mensaje de promoción" value={value} onChangeText={onChange} placeholder="Ejemplo: ¡15% de descuento!" error={formState.errors.text?.message} />
          )}
        />
        <Controller
          control={control}
          name="imageUrl"
          render={({ field: { value, onChange } }) => (
            <TextField label="URL de la imagen" value={value} onChangeText={onChange} placeholder="https://ejemplo.com/promo.png" error={formState.errors.imageUrl?.message} />
          )}
        />
        <Controller
          control={control}
          name="cta"
          render={({ field: { value, onChange } }) => (
            <TextField label="Texto del botón (CTA)" value={value} onChangeText={onChange} placeholder="Reservar ahora / Girar ruleta / Reclamar cupón" error={formState.errors.cta?.message} />
          )}
        />
        <Controller
          control={control}
          name="expiresAt"
          render={({ field: { value, onChange } }) => (
            <TextField label="Fecha de caducidad (YYYY-MM-DD HH:mm, opcional)" value={value || ""} onChangeText={onChange} placeholder="2025-05-30 23:59" error={formState.errors.expiresAt?.message} />
          )}
        />
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => (
            <View>
              <Text style={{ fontWeight: "600", marginBottom: 5 }}>Acción del botón:</Text>
              <Picker selectedValue={value} style={{ backgroundColor: "#f9f9f9", marginBottom: 5 }} onValueChange={onChange}>
                <Picker.Item label="Ruleta con premios (descuentos aleatorios)" value="ruleta" />
                <Picker.Item label="Cupón directo (el usuario recibe un código)" value="cupon" />
                <Picker.Item label="Solo información (popup)" value="info" />
                <Picker.Item label="Otro..." value="otro" />
              </Picker>
            </View>
          )}
        />
        <Controller
          control={control}
          name="visibility"
          render={({ field: { value, onChange } }) => (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: "600", marginBottom: 5 }}>Visibilidad de la promoción:</Text>
              <Picker selectedValue={value} onValueChange={onChange} style={{ backgroundColor: "#f9f9f9", marginBottom: 5 }}>
                <Picker.Item label="Para TODOS los usuarios" value="all" />
                <Picker.Item label="Solo los usuarios seleccionados" value="include" />
                <Picker.Item label="Todos menos los seleccionados" value="exclude" />
              </Picker>
            </View>
          )}
        />
        {promoType === "ruleta" && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Premios de la ruleta:</Text>
            {rewardFields.map((field, idx) => (
              <View key={field.id} style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, marginBottom: 7 }}>
                <Controller
                  control={control}
                  name={`rewards.${idx}.code`}
                  render={({ field: { value, onChange } }) => (
                    <TextField label="Código" value={value} onChangeText={onChange} style={{ flex: 1, minWidth: 75 }} error={formState.errors.rewards?.[idx]?.code?.message} />
                  )}
                />
                <Controller
                  control={control}
                  name={`rewards.${idx}.label`}
                  render={({ field: { value, onChange } }) => (
                    <TextField label="Etiqueta" value={value} onChangeText={onChange} style={{ flex: 1, minWidth: 90 }} error={formState.errors.rewards?.[idx]?.label?.message} />
                  )}
                />
                <Button title="Quitar" variant="secondary" onPress={() => removeReward(idx)} style={{ paddingHorizontal: 7 }} />
              </View>
            ))}
            <Button title="Agregar premio" onPress={() => appendReward({ code: "", label: "" })} style={{ alignSelf: "flex-start", marginTop: 4 }} />
          </View>
        )}
        {promoType === "cupon" && (
          <Controller
            control={control}
            name="code"
            render={({ field: { value, onChange } }) => (
              <TextField label="Código de cupón" value={value ?? ""} onChangeText={onChange} placeholder="EJEMPLO15" error={formState.errors.code?.message} />
            )}
          />
        )}
        {(visibility === "include" || visibility === "exclude") && (
          <View style={{ marginTop: 10, marginBottom: 10 }}>
            <Text style={{ fontWeight: "600", marginBottom: 5 }}>Selecciona los usuarios {visibility === "include" ? "INCLUIDOS" : "EXCLUIDOS"}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {audienceFields.map((u, idx) => (
                <View key={u.id} style={{ backgroundColor: "#E1EAFE", borderRadius: 14, flexDirection: "row", alignItems: "center", paddingVertical: 4, paddingHorizontal: 8, marginBottom: 3 }}>
                  <Text>{u.value}</Text>
                  <TouchableOpacity style={{ backgroundColor: "#DC143C", width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", marginLeft: 4 }} onPress={() => removeUser(idx)}>
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "bold" }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TextField value={userSearch} onChangeText={setUserSearch} label="Buscar usuario (nombre, email o uid)" placeholder="ejemplo@email.com o uid" style={{ marginTop: 8, marginBottom: 4 }} />
            {loadingUsers && <Text style={{ color: "#888" }}>Buscando...</Text>}
            {userList.length > 0 && (
              <FlatList
                data={userList}
                keyExtractor={u => u.uid}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomColor: "#eee", borderBottomWidth: 1 }} onPress={() => { if (!isAlreadyInAudience(item.uid)) { appendUser({ value: item.uid }); setUserSearch(""); } }}>
                    <Text style={{ flex: 1 }}>{item.displayName || item.email || item.uid}</Text>
                    <Text style={{ color: "#1a6dff" }}>Agregar</Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 120, marginVertical: 3 }}
              />
            )}
            {!!formState.errors.audience && (<Text style={{ color: "red", marginTop: 8 }}>{formState.errors.audience?.message?.toString()}</Text>)}
          </View>
        )}
        {Object.entries(formState.errors).map(([k, v]) => k !== "audience" && (
          <Text key={k} style={{ color: "red" }}>{(v as any)?.message || JSON.stringify(v)}</Text>
        ))}
        <Button title={promoId ? "Guardar cambios" : "Crear promoción"} onPress={handleSubmit(onSubmit)} />
      </Card>
    </ScrollView>
  );
}