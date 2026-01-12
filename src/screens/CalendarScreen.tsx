import { collection, onSnapshot, query, Timestamp, where } from "firebase/firestore";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { HeaderBack } from "../components/HeaderBack";
import { Screen } from "../components/Screen";
import { db } from "../lib/firebase";
import { useAuth } from "../providers/AuthProvider";
import { useTheme } from "../providers/ThemeProvider";
import { Appointment } from "../types/domain";

function toJSDate(value: any): Date | null {
  if (!value) return null;

  // Firestore Timestamp
  if (value instanceof Timestamp) return value.toDate();

  // Date object
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  // millis
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // ISO string
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Some apps accidentally store { seconds, nanoseconds }
  if (typeof value === "object" && typeof value.seconds === "number") {
    const d = new Date(value.seconds * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function toDateKeySafe(value: any): string | null {
  const d = toJSDate(value);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function getAppointmentDateValue(a: any) {
  // Prefer finalStartAt if present, else requestedStartAt
  return a?.finalStartAt ?? a?.requestedStartAt ?? null;
}

export function CalendarScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [items, setItems] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDay, setSelectedDay] = React.useState<string>(new Date().toISOString().slice(0, 10));

  React.useEffect(() => {
    // Guard: Don't attempt query until user is hydrated
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Firestore composite index required: userId (ASC) + requestedStartAt (DESC or ASC)
    // Ensure index exists in firestore.indexes.json
    const qy = query(collection(db, "appointments"), where("userId", "==", user.uid));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Appointment[];
        setItems(rows);
        setLoading(false);
      },
      (err) => {
        console.error("CalendarScreen snapshot error:", err);
        setLoading(false);
        // Keep UI state consistent on error
        setItems([]);
      }
    );

    return unsub;
  }, [user?.uid]);

  const markedDates = React.useMemo(() => {
    const marks: Record<string, any> = {};

    for (const a of items) {
      const day = toDateKeySafe(getAppointmentDateValue(a));
      if (!day) continue;
      marks[day] = { ...(marks[day] || {}), marked: true, dotColor: theme.colors.accent };
    }

    marks[selectedDay] = {
      ...(marks[selectedDay] || {}),
      selected: true,
      selectedColor: theme.colors.accent,
    };

    return marks;
  }, [items, selectedDay, theme]);

  const dayAppointments = React.useMemo(() => {
    return items
      .filter((a) => {
        const day = toDateKeySafe(getAppointmentDateValue(a));
        return day === selectedDay;
      })
      .sort((a: any, b: any) => {
        const da = toJSDate(getAppointmentDateValue(a))?.getTime() ?? 0;
        const dbb = toJSDate(getAppointmentDateValue(b))?.getTime() ?? 0;
        return da - dbb;
      });
  }, [items, selectedDay]);

  if (!user) {
    return (
      <Screen>
        <HeaderBack title="Mi agenda" />
        <Text style={{ color: theme.colors.muted }}>Inicia sesión para ver tu agenda.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <HeaderBack title="Mi agenda" />

      <View style={{
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: theme.colors.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        marginTop: 10,
      }}>
        <Calendar
          onDayPress={(d) => setSelectedDay(d.dateString)}
          markedDates={markedDates}
          enableSwipeMonths
          theme={{
            backgroundColor: theme.colors.background,
            calendarBackground: theme.colors.card,
            textSectionTitleColor: theme.colors.textSecondary,
            selectedDayBackgroundColor: theme.colors.accent,
            selectedDayTextColor: theme.colors.primary,
            todayTextColor: theme.colors.accent,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.textMuted,
            dotColor: theme.colors.accent,
            selectedDotColor: theme.colors.primary,
            arrowColor: theme.colors.accent,
            monthTextColor: theme.colors.text,
          }}
        />
      </View>

      <Text style={{ marginTop: 14, fontWeight: "900", fontSize: 16, color: theme.colors.text }}>
        Citas del día
      </Text>

      {loading ? (
        <Text style={{ color: theme.colors.textMuted }}>Cargando…</Text>
      ) : dayAppointments.length === 0 ? (
        <Text style={{ color: theme.colors.textMuted }}>No tienes citas este día.</Text>
      ) : (
        <FlatList
          data={dayAppointments}
          keyExtractor={(a) => a.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const d = toJSDate(getAppointmentDateValue(item));
            return (
              <View style={{
                borderRadius: theme.radius.lg,
                padding: 14,
                backgroundColor: theme.colors.card,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border,
                gap: 4,
              }}>
                <Text style={{ fontWeight: "900", color: theme.colors.text }}>
                  {(item as any).serviceName ?? "Servicio"}
                </Text>
                <Text style={{ color: theme.colors.textSecondary }}>
                  {d ? d.toLocaleString("es-MX") : "Fecha inválida"}
                </Text>
                <Text style={{ 
                  alignSelf: "flex-start", 
                  marginTop: 6, 
                  color: theme.colors.accent, 
                  fontWeight: "800" 
                }}>
                  {(item as any).status ?? ""}
                </Text>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}