import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { HeaderBack } from "../components/HeaderBack";
import { Screen } from "../components/Screen";
import { db } from "../lib/firebase";
import { theme } from "../theme/theme";
import { Appointment } from "../types/domain";


export function AppointmentDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { appointmentId } = route.params;

  const [appointment, setAppointment] =
    useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(
        doc(db, "appointments", appointmentId)
      );

      if (snap.exists()) {
        setAppointment({
          id: snap.id,
          ...(snap.data() as any),
        });
      }

      setLoading(false);
    };

    load();
  }, [appointmentId]);


  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString("es-MX") : "—";

  const hasRealChanges = useMemo(() => {
    if (!appointment?.finalStartAt) return false;
    return (
      appointment.finalStartAt !==
      appointment.requestedStartAt
    );
  }, [appointment]);

  const confirmAdjustments = async () => {
    if (!appointment) return;

    await updateDoc(
      doc(db, "appointments", appointment.id),
      {
        status: "confirmed",
        updatedAt: serverTimestamp(),
      }
    );

    navigation.goBack();
  };

  const rejectAdjustments = async () => {
    if (!appointment) return;

    Alert.alert(
      "Rechazar ajustes",
      "Rechazar los cambios cancelará la cita. ¿Deseas continuar?",
      [
        { text: "No" },
        {
          text: "Sí, rechazar",
          style: "destructive",
          onPress: async () => {
            await updateDoc(
              doc(db, "appointments", appointment.id),
              {
                status: "cancelled",
                updatedAt: serverTimestamp(),
              }
            );

            navigation.goBack();
          },
        },
      ]
    );
  };


  if (loading) {
    return (
      <Screen>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!appointment) {
    return (
      <Screen>
        <Text style={styles.empty}>
          No se pudo cargar la cita.
        </Text>
      </Screen>
    );
  }

  const showFinalDate =
    appointment.finalStartAt ??
    appointment.requestedStartAt;

  return (
    <Screen scroll>
      <HeaderBack title="Detalles de la cita" />

      <Card style={styles.card}>
        <Text style={styles.label}>Servicio</Text>
        <Text style={styles.value}>
          {appointment.serviceName}
        </Text>

        <Text style={styles.label}>Estado</Text>
        <Text style={styles.status}>
          {appointment.status === "requested"
            ? "Solicitud enviada"
            : appointment.status === "adjusted"
            ? "Cambios propuestos"
            : appointment.status === "confirmed"
            ? "Confirmada"
            : "Cancelada"}
        </Text>
      </Card>

      {appointment.status === "adjusted" &&
        hasRealChanges && (
          <>
            <Text style={styles.section}>
              Cambios propuestos
            </Text>

            <Card style={styles.card}>
              <Text style={styles.subTitle}>Antes</Text>
              <Text style={styles.value}>
                {formatDate(
                  appointment.requestedStartAt
                )}
              </Text>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.subTitle}>
                Después
              </Text>
              <Text style={styles.value}>
                {formatDate(
                  appointment.finalStartAt
                )}
              </Text>
            </Card>
          </>
        )}

      <Card style={styles.card}>
        <Text style={styles.label}>
          Fecha y hora
        </Text>
        <Text style={styles.value}>
          {formatDate(showFinalDate)}
        </Text>

        {!!appointment.durationMinutes && (
          <>
            <Text style={styles.label}>
              Duración estimada
            </Text>
            <Text style={styles.value}>
              ⏱️ {appointment.durationMinutes} min
            </Text>
          </>
        )}

        {!!appointment.price && (
          <>
            <Text style={styles.label}>
              Precio
            </Text>
            <Text style={styles.value}>
              💲 ${appointment.price} MXN
            </Text>
          </>
        )}

        {!!appointment.adminNotes && (
          <>
            <Text style={styles.label}>
              Notas del administrador
            </Text>
            <Text style={styles.notes}>
              📝 {appointment.adminNotes}
            </Text>
          </>
        )}
      </Card>

      {appointment.status === "adjusted" && (
        <View style={styles.actions}>
          <Button
            title="Confirmar cambios"
            onPress={confirmAdjustments}
          />
          <Button
            title="Rechazar cambios"
            variant="secondary"
            onPress={rejectAdjustments}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: theme.spacing.sm,
  },
  card: {
    marginBottom: theme.spacing.md,
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: theme.colors.muted,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
  },
  subTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  status: {
    fontWeight: "700",
    color: theme.colors.primary,
  },
  notes: {
    fontStyle: "italic",
    color: theme.colors.muted,
  },
  actions: {
    gap: 10,
    marginTop: theme.spacing.lg,
  },
  empty: {
    textAlign: "center",
    marginTop: 60,
    color: theme.colors.muted,
  },
});
