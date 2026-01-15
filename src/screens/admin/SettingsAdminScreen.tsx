import { HeaderBack } from "@/src/components/HeaderBack";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Alert, ScrollView, Switch, Text, View } from "react-native";
import { z } from "zod";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { db } from "../../lib/firebase";
import { useSettings } from "../../providers/SettingsProvider";
import { theme } from "../../theme/theme";
import { BusinessDayKey, GlobalSettings } from "../../types/settings";

const dayOrder: BusinessDayKey[] = ["mon","tue","wed","thu","fri","sat","sun"];

const dayLabels: Record<BusinessDayKey, string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo"
};

const hhmm = z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm");

const schema = z.object({
  timezone: z.string().min(1, "Requerido"),
  adminPhone: z.string().min(5, "Requerido"),
  adminEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  slotIntervalMinutes: z.string().regex(/^\d+$/, "Número").optional(),
  bookingMinLeadMinutes: z.string().regex(/^\d+$/, "Número").optional(),
  bookingMaxDays: z.string().regex(/^\d+$/, "Número").optional(),
  whatsAppPhone: z.string().optional(),
  whatsAppTemplate: z.string().optional(),
  paymentsEnabled: z.boolean(),
  businessHours: z.array(z.object({
    key: z.enum(["mon","tue","wed","thu","fri","sat","sun"]),
    enabled: z.boolean(),
    start: hhmm,
    end: hhmm
  }))
}).superRefine((v, ctx) => {
  v.businessHours.forEach((d, idx) => {
    const [sh, sm] = d.start.split(":").map(Number);
    const [eh, em] = d.end.split(":").map(Number);
    const startM = sh*60+sm;
    const endM = eh*60+em;
    if (endM <= startM) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["businessHours", idx, "end"], message: "Fin debe ser mayor a inicio" });
    }
  });
});

type FormValues = z.infer<typeof schema>;

export function SettingsAdminScreen() {
  const { settings } = useSettings();

  const { control, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      timezone: settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      adminPhone: settings?.adminPhone || "",
      adminEmail: settings?.adminEmail || "",
      slotIntervalMinutes: String(settings?.slotIntervalMinutes ?? 30),
      bookingMinLeadMinutes: String(settings?.bookingMinLeadMinutes ?? 60),
      bookingMaxDays: String(settings?.bookingMaxDays ?? 30),
      whatsAppPhone: settings?.whatsApp?.phone || "",
      whatsAppTemplate: settings?.whatsApp?.defaultMessageTemplate || "",
      paymentsEnabled: settings?.paymentsEnabled ?? false,
      businessHours: dayOrder.map(k => {
        const bh = settings?.businessHours?.[k] || { enabled: k !== "sun", start: "09:00", end: "19:00" };
        return { key: k, enabled: bh.enabled, start: bh.start, end: bh.end };
      })
    }
  });

  const { fields, update } = useFieldArray({ control, name: "businessHours" });

  useEffect(() => {
    if (settings) {
      reset({
        timezone: settings.timezone,
        adminPhone: settings.adminPhone,
        adminEmail: settings.adminEmail || "",
        slotIntervalMinutes: String(settings.slotIntervalMinutes ?? 30),
        bookingMinLeadMinutes: String(settings.bookingMinLeadMinutes ?? 60),
        bookingMaxDays: String(settings.bookingMaxDays ?? 30),
        whatsAppPhone: settings.whatsApp?.phone || "",
        whatsAppTemplate: settings.whatsApp?.defaultMessageTemplate || "",
        paymentsEnabled: settings.paymentsEnabled ?? false,
        businessHours: dayOrder.map(k => {
          const bh = settings.businessHours[k];
          return { key: k, enabled: bh.enabled, start: bh.start, end: bh.end };
        })
      });
    }
  }, [settings, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: GlobalSettings = {
        timezone: values.timezone.trim(),
        adminPhone: values.adminPhone.trim(),
        adminEmail: (values.adminEmail || "").trim() || undefined,
        slotIntervalMinutes: values.slotIntervalMinutes ? Number(values.slotIntervalMinutes) : 30,
        bookingMinLeadMinutes: values.bookingMinLeadMinutes ? Number(values.bookingMinLeadMinutes) : 60,
        bookingMaxDays: values.bookingMaxDays ? Number(values.bookingMaxDays) : 30,
        paymentsEnabled: values.paymentsEnabled,
        businessHours: values.businessHours.reduce((acc, cur) => {
          acc[cur.key] = { enabled: cur.enabled, start: cur.start, end: cur.end };
          return acc;
        }, {} as GlobalSettings["businessHours"]),
        whatsApp: {
          phone: (values.whatsAppPhone || "").trim(),
          defaultMessageTemplate: (values.whatsAppTemplate || "").trim() || undefined
        }
      };
      await setDoc(doc(db, "settings", "global"), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
      Alert.alert("Listo", "Configuración guardada");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "No se pudo guardar");
    }
  };

  return (
    <Screen>
      <HeaderBack />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Card style={{ gap: theme.spacing.md }}>
          <Controller control={control} name="timezone" render={({ field: { value, onChange } }) => (
            <TextField label="Zona horaria (IANA)" value={value} onChangeText={onChange} error={formState.errors.timezone?.message} placeholder="America/Mexico_City" />
          )} />
          <Controller control={control} name="adminPhone" render={({ field: { value, onChange } }) => (
            <TextField label="Teléfono admin" value={value} onChangeText={onChange} error={formState.errors.adminPhone?.message} />
          )} />
          <Controller control={control} name="adminEmail" render={({ field: { value, onChange } }) => (
            <TextField label="Email admin (opcional)" value={value} onChangeText={onChange} error={formState.errors.adminEmail?.message} />
          )} />
          <Controller control={control} name="slotIntervalMinutes" render={({ field: { value, onChange } }) => (
            <TextField label="Intervalo slots (min)" value={value} onChangeText={onChange} keyboardType="number-pad" error={formState.errors.slotIntervalMinutes?.message} />
          )} />
          <Controller control={control} name="bookingMinLeadMinutes" render={({ field: { value, onChange } }) => (
            <TextField label="Anticipación mínima (min)" value={value} onChangeText={onChange} keyboardType="number-pad" error={formState.errors.bookingMinLeadMinutes?.message} />
          )} />
          <Controller control={control} name="bookingMaxDays" render={({ field: { value, onChange } }) => (
            <TextField label="Máximo días hacia adelante" value={value} onChangeText={onChange} keyboardType="number-pad" error={formState.errors.bookingMaxDays?.message} />
          )} />
          <Controller control={control} name="whatsAppPhone" render={({ field: { value, onChange } }) => (
            <TextField label="WhatsApp teléfono" value={value ?? ""} onChangeText={onChange} />
          )} />
          <Controller control={control} name="whatsAppTemplate" render={({ field: { value, onChange } }) => (
            <TextField label="Plantilla mensaje WhatsApp (opcional)" value={value ?? ""} onChangeText={onChange} />
          )} />
          
          <View style={{ gap: 6, borderTopWidth: 1, borderColor: theme.colors.border, paddingTop: 12, marginTop: 8 }}>
            <Text style={{ fontWeight: "700", fontSize: 16 }}>Pagos</Text>
            <Controller control={control} name="paymentsEnabled" render={({ field: { value, onChange } }) => (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text>Habilitar pagos (Mercado Pago)</Text>
                <Switch value={value} onValueChange={onChange} />
              </View>
            )} />
            <Text style={{ color: theme.colors.muted, fontSize: 12 }}>
              Si está deshabilitado, las citas se confirman sin pago.
            </Text>
          </View>
        </Card>

        <Card style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <Text style={{ fontWeight: "800", fontSize: 16 }}>Horarios</Text>
          {fields.map((f, idx) => (
            <View key={f.id} style={{ gap: 6, borderTopWidth: 1, borderColor: theme.colors.border, paddingTop: 8, marginTop: 8 }}>
              <Text style={{ fontWeight: "700" }}>{dayLabels[f.key]}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text>Habilitado</Text>
                <Switch value={f.enabled} onValueChange={(v) => update(idx, { ...f, enabled: v })} />
              </View>
              <Controller control={control} name={`businessHours.${idx}.start`} render={({ field: { value, onChange } }) => (
                <TextField label="Inicio (HH:mm)" value={value} onChangeText={onChange} error={formState.errors.businessHours?.[idx]?.start?.message} />
              )} />
              <Controller control={control} name={`businessHours.${idx}.end`} render={({ field: { value, onChange } }) => (
                <TextField label="Fin (HH:mm)" value={value} onChangeText={onChange} error={formState.errors.businessHours?.[idx]?.end?.message} />
              )} />
            </View>
          ))}
        </Card>

        <Button title="Guardar" onPress={handleSubmit(onSubmit)} style={{ marginTop: theme.spacing.md }} />
      </ScrollView>
    </Screen>
  );
}