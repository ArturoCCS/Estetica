import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";

import { HeaderBack } from "../components/HeaderBack";
import { Screen } from "../components/Screen";
import { db } from "../lib/firebase";
import { useAuth } from "../providers/AuthProvider";
import { theme } from "../theme/theme";
import { Appointment } from "../types/domain";

function normalizeDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "string") {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
  }
  if (typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }
  return null;
}

function toDateKeyUTC(value: any): string | null {
  const d = normalizeDate(value);
  if (!d) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getAppointmentDateValue(a: any) {
  return a?.finalStartAt ?? a?.requestedStartAt ?? null;
}

function useUserMap(userIds: string[]) {
  const [map, setMap] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    userIds.forEach(async (uid) => {
      if (map[uid]) return;

      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setMap((prev) => ({ ...prev, [uid]: snap.data() }));
      }
    });
  }, [userIds.join("|")]);

  return map;
}

export function CalendarScreen() {
  const { user, isAdmin } = useAuth();

  const [items, setItems] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [selectedDay, setSelectedDay] = React.useState(() => {
    const today = new Date();
    return `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getUTCDate()).padStart(2, "0")}`;
  });

  React.useEffect(() => {
    if (!user) return;

    const qy = isAdmin
      ? query(collection(db, "appointments"))
      : query(collection(db, "appointments"), where("userId", "==", user.uid));

    const unsub = onSnapshot(qy, (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Appointment[];

      setItems(rows);
      setLoading(false);
    });

    return unsub;
  }, [user?.uid, isAdmin]);

  const adminUserIds = React.useMemo(
    () => (isAdmin ? Array.from(new Set(items.map((i) => i.userId))) : []),
    [items, isAdmin]
  );
  const userMap = useUserMap(adminUserIds);


  const markedDates = React.useMemo(() => {
    const marks: Record<string, any> = {};

    for (const a of items) {
      const day = toDateKeyUTC(getAppointmentDateValue(a));
      if (!day) continue;

      marks[day] = {
        ...(marks[day] || {}),
        marked: true,
        dotColor: theme.colors.primary,
      };
    }

    marks[selectedDay] = {
      ...(marks[selectedDay] || {}),
      selected: true,
      selectedColor: theme.colors.primary,
    };

    return marks;
  }, [items, selectedDay]);

  const dayAppointments = React.useMemo(() => {
    return items
      .filter((a) => toDateKeyUTC(getAppointmentDateValue(a)) === selectedDay)
      .sort((a, b) => {
        const da = normalizeDate(getAppointmentDateValue(a))?.getTime() ?? 0;
        const db = normalizeDate(getAppointmentDateValue(b))?.getTime() ?? 0;
        return da - db;
      });
  }, [items, selectedDay]);

  if (!user) {
    return (
      <Screen>
        <HeaderBack title="Agenda" />
        <Text style={{ color: theme.colors.muted }}>
          Inicia sesión para ver tu agenda.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <HeaderBack title={isAdmin ? "Agenda general" : "Mi agenda"} />

      <View style={s.card}>
        <Calendar
          onDayPress={(d) => setSelectedDay(d.dateString)}
          markedDates={markedDates}
          enableSwipeMonths
          theme={{
            todayTextColor: theme.colors.primary,
            arrowColor: theme.colors.primary,
            selectedDayBackgroundColor: theme.colors.primary,
          }}
        />
      </View>

      <Text style={s.sectionTitle}>Citas del día</Text>

      {loading ? (
        <Text style={s.muted}>Cargando…</Text>
      ) : dayAppointments.length === 0 ? (
        <Text style={s.muted}>No hay citas este día.</Text>
      ) : (
        <FlatList
          data={dayAppointments}
          keyExtractor={(a) => a.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 20 }}
          renderItem={({ item }) =>
            isAdmin ? (
              <AdminItem item={item} user={userMap[item.userId]} />
            ) : (
              <UserItem item={item} />
            )
          }
        />
      )}
    </Screen>
  );
}

function AdminItem({ item, user }: { item: Appointment; user: any }) {
  const start = normalizeDate(item.finalStartAt);
  const end = normalizeDate(item.finalEndAt);

  return (
    <View style={s.item}>
      <Text style={s.time}>
        {start?.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} –{" "}
        {end?.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
      </Text>

      <Text style={s.title}>{item.serviceName}</Text>

      <Text style={s.sub}>Cliente: {user?.name ?? "Sin nombre"}</Text>
      
      <Text style={s.sub}>Contacto: {user?.phone ?? "Sin nombre"}</Text>
      
      <Text style={s.sub}>Tiempo estimado : {item.durationMinutes} min</Text>

   
      {item.price === undefined || item.price === null
        ? (<Text style={s.sub}>Precio no asignado</Text>)
        : (<Text style={s.sub}>Precio : ${item.price} MXN</Text>)}
        
        
      {item.notes && <Text style={s.sub}>Nota : {item.notes}</Text>}
      
      <Text style={s.badge}>{item.status}</Text>
    </View>
  );
}

function UserItem({ item }: { item: Appointment }) {
  const start = normalizeDate(item.finalStartAt);
  const end = normalizeDate(item.finalEndAt);

  return (
    <View style={s.item}>
      <Text style={s.title}>{item.serviceName}</Text>

      <Text style={s.sub}>
        {start?.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} –{" "}
        {end?.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
      </Text>

      <Text style={s.sub}>Tiempo estimado : {item.durationMinutes} min</Text>
            
      {item.price != null && <Text style={s.sub}>Precio : ${item.price} MXN</Text>}

      {item.adminNotes && <Text style={s.sub}>Nota : {item.adminNotes}</Text>}
      
      <Text style={s.badge}>{item.status}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    marginTop: theme.spacing.md,
    fontWeight: "900",
    fontSize: 16,
    color: theme.colors.text,
  },
  muted: {
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
  },
  item: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: 4,
  },
  time: {
    fontWeight: "900",
    color: theme.colors.primary,
  },
  title: {
    fontWeight: "900",
    color: theme.colors.text,
  },
  sub: {
    marginVertical: 2,
    color: theme.colors.muted,
  },
  badge: {
    marginTop: 6,
    color: theme.colors.primaryDark,
    fontWeight: "800",
  },
});
