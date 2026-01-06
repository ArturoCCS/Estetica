import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { TimeSlotsGrid } from "../components/TimeSlotsGrid";
import { db } from "../lib/firebase";
import { getAdminPushTokens } from "../lib/notify-helpers";
import { sendExpoPush } from "../lib/push";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../providers/AuthProvider";
import { useSettings } from "../providers/SettingsProvider";
import { theme } from "../theme/theme";
import { addMinutes, formatDateISO, toDayKey } from "../utils/date";
import { dateOnlyToTZ, dayKeyFor, filterSlotsByMinLeadOnSameDay, makeSlotsForDay, tzDayString } from "../utils/date-tz";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type BookRoute = RouteProp<RootStackParamList, "BookService">;

type Service = { id: string; name: string; price?: number; durationMin?: number; durationMax?: number };

type AppointmentPayload = {
  userId: string;
  serviceId: string;
  serviceName: string;
  price?: number;
  requestedStartAt: string;
  dayKey: string;
  notes?: string | null;
  status: "requested";
  createdAt: any;
};

export function BookServiceScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<BookRoute>();
  const { user } = useAuth();
  const { settings } = useSettings();

  const preselectedServiceId = route.params?.serviceId ?? "";
  const tz = settings?.timezone || "America/Mexico_City";
  const interval = settings?.slotIntervalMinutes ?? 30;
  const minLeadMinutes = settings?.bookingMinLeadMinutes ?? 60;
  const maxDays = settings?.bookingMaxDays ?? 30;

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId);
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [selectedTimeStr, setSelectedTimeStr] = useState("");
  const [notes, setNotes] = useState("");

  const selectedService = useMemo(() => services.find((s) => s.id === selectedServiceId), [services, selectedServiceId]);

  useEffect(() => {
    const fetchServices = async () => {
      const snap = await getDocs(query(collection(db, "services"), orderBy("name")));
      const rows: Service[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setServices(rows);
      setLoadingServices(false);
      if (preselectedServiceId && rows.some((s) => s.id === preselectedServiceId)) {
        setSelectedServiceId(preselectedServiceId);
      }
    };
    fetchServices();
  }, [preselectedServiceId]);

  // Rango de fechas permitido, respetando TZ
  const earliest = new Date(new Date().getTime() + minLeadMinutes * 60000);
  const minDate = tzDayString(earliest, tz);
  const maxDate = tzDayString(new Date(new Date().getTime() + maxDays * 24 * 3600000), tz);

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDateStr || !settings?.businessHours || !selectedService) return [];
    const k = dayKeyFor(selectedDateStr, tz);
    const bh = settings.businessHours[k];
    if (!bh?.enabled) return [];

    const serviceDuration = selectedService.durationMin || 60;
    const baseSlots = makeSlotsForDay(bh.start, bh.end, interval, serviceDuration);

    if (selectedDateStr === minDate) {
      const earliestInTZ = dateOnlyToTZ(minDate, tz);
      earliestInTZ.setHours(earliest.getHours(), earliest.getMinutes(), 0, 0);
      return filterSlotsByMinLeadOnSameDay(baseSlots, earliestInTZ);
    }
    if (selectedDateStr < minDate) return [];

    return baseSlots;
  }, [selectedDateStr, settings, selectedService, interval, minDate, tz, earliest]);

  async function hasConflict(dayKey: string, startAt: string, endAt: string): Promise<boolean> {
    // Check against appointments that block time slots:
    // - requested (admin might approve it)
    // - awaiting_payment (time is reserved)
    // - confirmed (time is booked)
    const q = query(
      collection(db, "appointments"),
      where("dayKey", "==", dayKey),
      where("status", "in" as any, ["requested", "awaiting_payment", "confirmed"])
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as any);
    return list.some((a: any) => {
      // Use finalStartAt/finalEndAt if available, otherwise requestedStartAt
      const aStart = a.finalStartAt ? new Date(a.finalStartAt).getTime() : new Date(a.requestedStartAt).getTime();
      const aEnd = a.finalEndAt ? new Date(a.finalEndAt).getTime() : new Date(a.requestedStartAt).getTime() + 60 * 60 * 1000; // default 1hr
      const sStart = new Date(startAt).getTime();
      const sEnd = new Date(endAt).getTime();
      return sStart < aEnd && sEnd > aStart;
    });
  }

  async function handleConfirm() {
    if (!user) {
      Alert.alert("Inicia sesión", "Debes iniciar sesión para agendar.");
      navigation.navigate("Main", { screen: "Profile" });
      return;
    }
    if (!selectedService) {
      Alert.alert("Selecciona un servicio");
      return;
    }
    if (!selectedDateStr || !selectedTimeStr) {
      Alert.alert("Selecciona fecha y hora");
      return;
    }

    const startAtISO = formatDateISO(selectedDateStr, selectedTimeStr);
    const duration = selectedService.durationMin || 60;
    const endAtISO = addMinutes(startAtISO, duration);
    const dayKey = toDayKey(startAtISO);

    // Validar contra fin del día (no exceder cierre)
    const k = dayKeyFor(selectedDateStr, tz);
    const bh = settings!.businessHours[k];
    const endDayMinutes = parseInt(bh.end.slice(0, 2)) * 60 + parseInt(bh.end.slice(3, 5));
    const startMinutes = parseInt(selectedTimeStr.slice(0, 2)) * 60 + parseInt(selectedTimeStr.slice(3, 5));
    if (startMinutes + duration > endDayMinutes) {
      Alert.alert("Fuera del horario", "La duración del servicio excede el horario de atención.");
      return;
    }

    const conflict = await hasConflict(dayKey, startAtISO, endAtISO);
    if (conflict) {
      Alert.alert("Horario no disponible", "Selecciona otro horario.");
      return;
    }

    const payloadBase = {
      userId: user.uid,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      requestedStartAt: startAtISO,
      dayKey,
      status: "requested" as const,
      createdAt: serverTimestamp(),
    };

    // Evitar undefined en notes
    const cleanNotes = notes.trim();
    const payload: AppointmentPayload = cleanNotes.length ? { ...payloadBase, notes: cleanNotes } : { ...payloadBase };

    await addDoc(collection(db, "appointments"), payload);

    try {
      const adminTokens = await getAdminPushTokens();
      console.log("Admin push tokens:", adminTokens);
      if (adminTokens.length > 0) {
        await sendExpoPush(
          adminTokens.map((t) => ({
            to: t,
            title: "Nueva cita pendiente",
            body: `${selectedService.name} • ${new Date(startAtISO).toLocaleString("es-MX")}`,
            data: { type: "appointment_pending" },
          }))
        );
      } else {
        console.warn("No hay tokens de admin para notificar.");
      }
    } catch (e) {
      console.error("Error enviando push a admins:", e);
    }

    Alert.alert("Reserva creada", "Tu cita quedó registrada.");
    navigation.navigate("Main", { screen: "Bookings" });
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: theme.spacing.lg }}>
      <Card style={{ gap: theme.spacing.md }}>
        <Text style={{ fontWeight: "700", fontSize: 18 }}>Agendar servicio</Text>

        {selectedService ? (
          <View style={{ gap: 4 }}>
            <Text style={{ fontWeight: "600" }}>
              {selectedService.name}
              {selectedService.price ? ` - $${selectedService.price}` : ""}
            </Text>
            <Button title="Cambiar servicio" variant="secondary" onPress={() => setSelectedServiceId("")} />
          </View>
        ) : loadingServices ? (
          <Text style={{ color: "#888" }}>Cargando servicios...</Text>
        ) : (
          <View>
            <Text style={{ fontWeight: "600", marginBottom: 6 }}>Servicio</Text>
            {/* Puedes usar tu selector de servicio aquí */}
          </View>
        )}

        <View style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>Fecha</Text>
          <Calendar
            minDate={minDate}
            maxDate={maxDate}
            onDayPress={(day) => {
              setSelectedDateStr(day.dateString);
              setSelectedTimeStr("");
            }}
            markedDates={selectedDateStr ? { [selectedDateStr]: { selected: true } } : {}}
            enableSwipeMonths
          />
        </View>

        <View>
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>Hora</Text>
          <TimeSlotsGrid slots={slotsForSelectedDay} value={selectedTimeStr} onChange={setSelectedTimeStr} />
        </View>

        <TextField label="Notas (opcional)" value={notes} onChangeText={setNotes} placeholder="Detalles adicionales" />

        <Button title="Confirmar reserva" onPress={handleConfirm} />
      </Card>
    </ScrollView>
  );
}