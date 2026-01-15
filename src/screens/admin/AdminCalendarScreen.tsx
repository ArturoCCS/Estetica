import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Card } from "../../components/Card";
import { HeaderBack } from "../../components/HeaderBack";
import { db } from "../../lib/firebase";
import { theme } from "../../theme/theme";
import { Appointment } from "../../types/domain";

LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom.','Lun.','Mar.','Mié.','Jue.','Vie.','Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

type UserProfile = {
  uid: string;
  name: string;
  phone?: string;
  email?: string;
};

export function AdminCalendarScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    const loadAppointments = async () => {
      const snap = await getDocs(
        query(collection(db, "appointments"), orderBy("requestedStartAt", "desc"))
      );
      const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Appointment));
      setAppointments(rows);
      setLoading(false);
    };
    loadAppointments();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      const missing = Array.from(new Set(appointments.map(a => a.userId)))
        .filter(uid => !users[uid]);

      if (missing.length === 0) return;

      const entries: [string, UserProfile][] = [];
      for (const uid of missing) {
        const snap = await getDocs(collection(db, "users"));
        const userDoc = snap.docs.find(d => d.id === uid);
        if (userDoc) {
          const d = userDoc.data();
          entries.push([uid, {
            uid,
            name: d.name,
            phone: d.phone,
            email: d.email,
          }]);
        }
      }
      setUsers(prev => ({ ...prev, ...Object.fromEntries(entries) }));
    };
    loadUsers();
  }, [appointments]);

  const appointmentsByDay = useMemo(() => {
    return appointments.filter(a => a.dayKey === selectedDate);
  }, [appointments, selectedDate]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked: boolean; dotColor?: string; selected?: boolean }> = {};
    appointments.forEach(a => {
      marks[a.dayKey] = { marked: true, dotColor: a.status === "cancelled" ? "#DC2626" : "#2563EB" };
    });
    if (selectedDate) marks[selectedDate] = { ...marks[selectedDate], selected: true };
    return marks;
  }, [appointments, selectedDate]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <HeaderBack title="Agenda de citas" />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <>
          <Calendar
            onDayPress={d => setSelectedDate(d.dateString)}
            markedDates={markedDates}
            enableSwipeMonths
          />

          <View style={{ padding: theme.spacing.md }}>
            {appointmentsByDay.length === 0 ? (
              <Text style={{ textAlign: "center", marginTop: 40, color: theme.colors.muted }}>
                No hay citas este día
              </Text>
            ) : (
              appointmentsByDay.map(apt => {
                const user = users[apt.userId];
                return (
                  <Card key={apt.id} style={{ marginBottom: 12 }}>
                    <Text style={{ fontWeight: "700" }}>{apt.serviceName}</Text>
                    <Text style={{ color: theme.colors.muted }}>
                      {apt.status === "requested" ? "Solicitud enviada" :
                       apt.status === "adjusted" ? "Pendiente de confirmación" :
                       apt.status === "confirmed" ? "Confirmada" : "Cancelada"}
                    </Text>

                    <Text style={{ fontSize: 13, color: theme.colors.muted }}>
                      Fecha y hora: {new Date(apt.finalStartAt ?? apt.requestedStartAt).toLocaleString("es-MX")}
                    </Text>

                    {!!apt.durationMinutes && (
                      <Text style={{ fontSize: 13, color: theme.colors.muted }}>
                        Duración: ⏱️ {apt.durationMinutes} min
                      </Text>
                    )}

                    {!!apt.price && (
                      <Text style={{ fontSize: 13, color: theme.colors.muted }}>
                        Precio: 💲 {apt.price} MXN
                      </Text>
                    )}

                    {!!apt.adminNotes && (
                      <Text style={{ fontStyle: "italic", color: theme.colors.muted }}>
                        📝 {apt.adminNotes}
                      </Text>
                    )}

                    {!!user && (
                      <>
                        <Text style={{ fontSize: 13, color: theme.colors.muted }}>
                          Cliente: {user.name}
                        </Text>
                        {!!user.phone && <Text>📞 {user.phone}</Text>}
                        {!!user.email && <Text>✉️ {user.email}</Text>}
                      </>
                    )}
                  </Card>
                );
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
