import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";
import { Appointment } from "../types/domain";

type Props = {
  appointments: Appointment[];
  selectedDate: string;
};

export function BlockedTimeList({ appointments, selectedDate }: Props) {
  const dayAppointments = appointments.filter(
    (a) =>
      a.finalStartAt &&
      a.finalEndAt &&
      a.finalStartAt.startsWith(selectedDate)
  );

  if (dayAppointments.length === 0) {
    return (
      <Text style={styles.empty}>No hay horarios bloqueados este día</Text>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Horarios ocupados</Text>

      {dayAppointments.map((apt) => {
        const start = apt.finalStartAt ? apt.finalStartAt.slice(11, 16) : "";
        const end = apt.finalEndAt ? apt.finalEndAt.slice(11, 16) : "";

        return (
          <View key={apt.id} style={styles.block}>
            <Text style={styles.time}>
              {start} – {end}
            </Text>
            <Text style={styles.service}>{apt.serviceName}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 8,
  },
  title: {
    fontWeight: "700",
    fontSize: 14,
    color: theme.colors.text,
  },
  block: {
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 10,
  },
  time: {
    fontWeight: "700",
    color: "#991B1B",
  },
  service: {
    fontSize: 12,
    color: "#7F1D1D",
  },
  empty: {
    marginTop: 12,
    fontSize: 13,
    color: theme.colors.muted,
  },
});
