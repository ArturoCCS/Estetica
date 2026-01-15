import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { AppAlert } from "../components/AppAlert";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { HeaderBack } from "../components/HeaderBack";
import { TextField } from "../components/TextField";
import { TimeSlotsGrid } from "../components/TimeSlotsGrid";
import { db } from "../lib/firebase";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../providers/AuthProvider";
import { useSettings } from "../providers/SettingsProvider";
import { theme } from "../theme/theme";

import { AppointmentStatus } from "../types/domain";
import {
  dateOnlyToTZ,
  dayKeyFor,
  filterSlotsByMinLeadOnSameDay,
  makeSlotsForDay,
  tzDayString,
} from "../utils/date-tz";

LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type BookRoute = RouteProp<RootStackParamList, "BookService">;

type Service = {
  id: string;
  name: string;
  price?: number;
  durationMin?: number;
};

function parseAppointmentStart(raw: any): Date | null {
  if (!raw) return null;

  if (typeof raw === "object" && raw.toDate) {
    return raw.toDate();
  }

  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}



const ACTIVE_STATUSES: AppointmentStatus[] = [
  "requested",
  "adjusted",
  "awaiting_payment",
  "confirmed",
];

function addMinutesSafe(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}


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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authAlertVisible, setAuthAlertVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId]
  );

  const occupiedSlotsForSelectedDay = useMemo(() => {
    if (!selectedDateStr || !selectedService) return new Set<string>();

    const serviceDuration = selectedService.durationMin ?? 60;
    const occupied = new Set<string>();

    appointments.forEach((a) => {
      const raw = a.finalStartAt ?? a.requestedStartAt;
      const apptStart = parseAppointmentStart(raw);
      if (!apptStart) return;

      if (tzDayString(apptStart, tz) !== selectedDateStr) return;

      const apptEnd = addMinutesSafe(apptStart, a.durationMinutes ?? serviceDuration);

      let cursor = new Date(apptStart);
      while (cursor < apptEnd) {
        const h = cursor.getHours().toString().padStart(2, "0");
        const m = cursor.getMinutes().toString().padStart(2, "0");
        occupied.add(`${h}:${m}`);
        cursor = addMinutesSafe(cursor, interval);
      }
    });

    return occupied;
  }, [appointments, selectedDateStr, selectedService, tz, interval]);


  function requireAuth(action?: () => void) {
    if (user) {
      action?.();
      return true;
    }
    setAuthAlertVisible(true);
    return false;
  }

  useEffect(() => {
    const fetchServices = async () => {
      const snap = await getDocs(
        query(collection(db, "services"), orderBy("name"))
      );
      const rows: Service[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setServices(rows);
      setLoadingServices(false);
      if (preselectedServiceId && rows.some((s) => s.id === preselectedServiceId)) {
        setSelectedServiceId(preselectedServiceId);
      }
    };
    fetchServices();
  }, [preselectedServiceId]);

  useEffect(() => {
    const fetchAppointments = async () => {
      const snap = await getDocs(collection(db, "appointments"));
      const allAppts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
 
      const activeAppts = allAppts.filter((a) => ACTIVE_STATUSES.includes(a.status));
      setAppointments(activeAppts);
    };
    fetchAppointments();
  }, []);

  const earliest = new Date(Date.now() + minLeadMinutes * 60000);
  const minDate = tzDayString(earliest, tz);
  const maxDate = tzDayString(new Date(Date.now() + maxDays * 24 * 3600000), tz);

  function timeRangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDateStr || !settings?.businessHours || !selectedService) return [];

    const k = dayKeyFor(selectedDateStr, tz);
    const bh = settings.businessHours[k];
    if (!bh?.enabled) return [];

    const serviceDuration = selectedService.durationMin || 60;
    const baseSlots = makeSlotsForDay(bh.start, bh.end, interval, serviceDuration);

    const dayAppointments = appointments.filter((a) => {
      const raw = a.finalStartAt ?? a.requestedStartAt;
      if (!raw) return false;
      return tzDayString(dateOnlyToTZ(raw, tz), tz) === selectedDateStr;
    });

    const availableSlots = baseSlots.filter((slot) => {
      const slotStart = dateOnlyToTZ(selectedDateStr, tz);
      const [h, m] = slot.split(":").map(Number);
      slotStart.setHours(h, m, 0, 0);

      const slotEnd = addMinutesSafe(slotStart, serviceDuration);

      const hasConflict = dayAppointments.some((a) => {
        const raw = a.finalStartAt ?? a.requestedStartAt;
        if (!raw) return false;

        const apptStart = parseAppointmentStart(raw);
        if (!apptStart) return false;

        const apptDuration = a.durationMinutes || serviceDuration;
        const apptEnd = addMinutesSafe(apptStart, apptDuration);

        return timeRangesOverlap(slotStart, slotEnd, apptStart, apptEnd);
      });

      return !hasConflict;
    });

    if (selectedDateStr === minDate) {
      const earliestInTZ = dateOnlyToTZ(minDate, tz);
      earliestInTZ.setHours(earliest.getHours(), earliest.getMinutes(), 0, 0);
      return filterSlotsByMinLeadOnSameDay(availableSlots, earliestInTZ);
    }

    return availableSlots;
  }, [
    selectedDateStr,
    selectedService,
    settings,
    appointments,
    tz,
    interval,
    minDate,
    earliest,
  ]);


  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    if (!selectedService || !settings?.businessHours) return marks;

    const serviceDuration = selectedService.durationMin || 60;

    for (let d = 0; d <= maxDays; d++) {
      const dayDate = new Date(Date.now() + d * 86400000);
      const day = tzDayString(dayDate, tz);
      const k = dayKeyFor(day, tz);
      const bh = settings.businessHours[k];

      if (!bh?.enabled) {
        marks[day] = { disabled: true, disableTouchEvent: true };
        continue;
      }

      const baseSlots = makeSlotsForDay(bh.start, bh.end, interval, serviceDuration);

      const dayAppointments = appointments.filter((a) => {
        const raw = a.finalStartAt ?? a.requestedStartAt;
        if (!raw) return false;
        return tzDayString(dateOnlyToTZ(raw, tz), tz) === day;
      });

      let freeSlots = baseSlots.filter((slot) => {
        const slotStart = dateOnlyToTZ(day, tz);
        const [h, m] = slot.split(":").map(Number);
        slotStart.setHours(h, m, 0, 0);

        const slotEnd = addMinutesSafe(slotStart, serviceDuration);

        const hasConflict = dayAppointments.some((a) => {
          const raw = a.finalStartAt ?? a.requestedStartAt;
          if (!raw) return false;
          const apptStart = parseAppointmentStart(raw);
          if (!apptStart) return false;

          const apptDuration = a.durationMinutes || serviceDuration;
          const apptEnd = addMinutesSafe(apptStart, apptDuration);

          return timeRangesOverlap(slotStart, slotEnd, apptStart, apptEnd);
        });

        return !hasConflict;
      }).length;

      marks[day] = {
        disabled: freeSlots === 0,
        disableTouchEvent: freeSlots === 0,
        dotColor: freeSlots === 0 ? "red" : "green",
      };
    }

    if (selectedDateStr && marks[selectedDateStr]) {
      marks[selectedDateStr] = {
        ...marks[selectedDateStr],
        selected: true,
        selectedColor: theme.colors.primary,
      };
    }

    return marks;
  }, [
    appointments,
    settings,
    selectedDateStr,
    tz,
    interval,
    selectedService,
    maxDays,
  ]);

  const handleConfirm = async () => {
    if (!requireAuth()) return;

    if (!selectedDateStr || !selectedTimeStr || !selectedService) {
      setAlertMessage("Selecciona fecha y hora.");
      setAlertVisible(true);
      return;
    }

    try {
      setSubmitting(true);

      const requestStart = dateOnlyToTZ(selectedDateStr, tz);
      const [h, m] = selectedTimeStr.split(":").map(Number);
      requestStart.setHours(h, m, 0, 0);

      if (isNaN(requestStart.getTime())) {
        throw new Error("Fecha inválida");
      }

      const duration = selectedService.durationMin ?? 60;
      const requestEnd = addMinutesSafe(requestStart, duration);

      const conflict = appointments.some((a) => {
        const raw = a.finalStartAt ?? a.requestedStartAt;
        if (!raw) return false;

        const apptStart = parseAppointmentStart(raw);
        if (!apptStart) return false;

        const apptDuration = a.durationMinutes ?? duration;
        const apptEnd = addMinutesSafe(apptStart, apptDuration);

        return timeRangesOverlap(requestStart, requestEnd, apptStart, apptEnd);
      });

      if (conflict) {
        setAlertMessage("Este horario ya no está disponible.");
        setAlertVisible(true);
        return;
      }

      const docRef = await addDoc(collection(db, "appointments"), {
        userId: user!.uid,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price ?? null,
        durationMinutes: duration,
        requestedStartAt: requestStart.toISOString(),
        dayKey: dayKeyFor(selectedDateStr, tz),
        notes: notes || null,
        status: "requested",
        createdAt: serverTimestamp(),
      });

      setAppointments((prev) => [
        ...prev,
        {
          id: docRef.id,
          requestedStartAt: requestStart.toISOString(),
          durationMinutes: duration,
          status: "requested",
        },
      ]);

      navigation.navigate("Main", { screen: "Agenda" });

      setSelectedDateStr("");
      setSelectedTimeStr("");
      setNotes("");

    } catch (err) {
      console.error(err);
      setAlertMessage("Ocurrió un error al agendar la cita.");
      setAlertVisible(true);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#fff" }}
        contentContainerStyle={{ padding: theme.spacing.lg }}
      >
        <HeaderBack title="Agendar servicio" />
        <Card style={{ gap: theme.spacing.md }}>

          <Button
            title={selectedDateStr ? `Fecha: ${selectedDateStr}` : "Seleccionar fecha"}
            variant="secondary"
            onPress={() => requireAuth(() => setCalendarOpen(true))}
          />

          <Text style={{ fontWeight: "600", marginTop: 10 }}>Hora</Text>
          <TimeSlotsGrid
            slots={user ? slotsForSelectedDay : []}
            value={selectedTimeStr}
            disabledSlots={occupiedSlotsForSelectedDay}
            onChange={(v) => {
              if (!requireAuth()) return;
              setSelectedTimeStr(v);
            }}
          />


          {slotsForSelectedDay.length === 0 && selectedDateStr && user && (
            <Text style={{ color: "red", fontSize: 13, marginTop: 8 }}>
              No hay horarios disponibles para este día. Selecciona otro.
            </Text>
          )}

          <TextField
            label="Notas (opcional)"
            value={notes}
            editable={!!user}
            onChangeText={(t) => {
              if (!requireAuth()) return;
              setNotes(t);
            }}
          />

          {submitting && <ActivityIndicator style={{ marginTop: 10 }} />}

          <Button
            title="Confirmar reserva"
            onPress={handleConfirm}
            disabled={!user || submitting || !selectedTimeStr || !selectedDateStr}
          />
        </Card>
      </ScrollView>

      <Modal visible={calendarOpen} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            padding: 20,
          }}
          onPress={() => setCalendarOpen(false)}
        >
          <Pressable
            style={{ backgroundColor: "#fff", borderRadius: 12, padding: 16 }}
            onPress={(e) => e.stopPropagation()}
          >
            <Calendar
              minDate={minDate}
              maxDate={maxDate}
              onDayPress={(day) => {
                if (markedDates[day.dateString]?.disabled) {
                  setAlertMessage("Este día no tiene horarios disponibles.");
                  setAlertVisible(true);
                  return;
                }
                setSelectedDateStr(day.dateString);
                setSelectedTimeStr("");
                setCalendarOpen(false);
              }}
              markedDates={markedDates}
              enableSwipeMonths
              theme={{
                todayTextColor: theme.colors.primary,
                selectedDayBackgroundColor: theme.colors.primary,
                dotColor: theme.colors.primary,
                arrowColor: theme.colors.primary,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <AppAlert
        visible={authAlertVisible}
        title="Inicia sesión"
        message="Debes iniciar sesión o crear una cuenta para agendar una cita."
        onClose={() => {
          setAuthAlertVisible(false);
          navigation.navigate("Login", {
            redirectTo: {
              name: "BookService",
              params: route.params,
            },
          });
        }}
      />

      <AppAlert
        visible={alertVisible}
        title="Horario no disponible"
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </>
  );
}
