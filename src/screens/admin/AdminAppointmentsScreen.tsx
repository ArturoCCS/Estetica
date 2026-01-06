import { HeaderBack } from "@/src/components/HeaderBack";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { z } from "zod";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { db } from "../../lib/firebase";
import { useSettings } from "../../providers/SettingsProvider";
import { theme } from "../../theme/theme";
import { Appointment, AppointmentStatus } from "../../types/domain";

const approvalSchema = z.object({
  finalDate: z.string().min(1, "Fecha requerida"),
  finalStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  finalEndTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  depositAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Monto válido"),
});

type ApprovalFormValues = z.infer<typeof approvalSchema>;

export function AdminAppointmentsScreen() {
  const { settings } = useSettings();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | "all">("requested");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const paymentsEnabled = settings?.paymentsEnabled ?? false;

  const { control, handleSubmit, formState, reset } = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      finalDate: "",
      finalStartTime: "",
      finalEndTime: "",
      depositAmount: "",
    },
  });

  useEffect(() => {
    const q = selectedStatus === "all" 
      ? query(collection(db, "appointments"), orderBy("requestedStartAt", "desc"))
      : query(
          collection(db, "appointments"),
          where("status", "==", selectedStatus),
          orderBy("requestedStartAt", "desc")
        );

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
      setAppointments(items);
      setLoading(false);
    });

    return unsub;
  }, [selectedStatus]);

  const openApprovalModal = (appointment: Appointment) => {
    const reqDate = new Date(appointment.requestedStartAt);
    const dateStr = reqDate.toISOString().split("T")[0];
    const startTime = reqDate.toTimeString().slice(0, 5);
    
    // Default end time: start + 1 hour
    const endDate = new Date(reqDate.getTime() + 60 * 60 * 1000);
    const endTime = endDate.toTimeString().slice(0, 5);

    reset({
      finalDate: dateStr,
      finalStartTime: startTime,
      finalEndTime: endTime,
      depositAmount: appointment.price ? String(appointment.price) : "200",
    });
    setSelectedAppointment(appointment);
    setModalVisible(true);
  };

  const onApprove = async (values: ApprovalFormValues) => {
    if (!selectedAppointment) return;

    try {
      const finalStartAt = `${values.finalDate}T${values.finalStartTime}:00`;
      const finalEndAt = `${values.finalDate}T${values.finalEndTime}:00`;
      const depositAmount = parseFloat(values.depositAmount);

      const updateData: any = {
        finalStartAt,
        finalEndAt,
        updatedAt: serverTimestamp(),
      };

      if (paymentsEnabled) {
        // Request payment
        const paymentDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        updateData.status = "awaiting_payment";
        updateData.depositAmount = depositAmount;
        updateData.paymentDueAt = paymentDueAt;
      } else {
        // Confirm without payment
        updateData.status = "confirmed";
      }

      await updateDoc(doc(db, "appointments", selectedAppointment.id), updateData);

      Alert.alert(
        "Éxito",
        paymentsEnabled
          ? "Cita aprobada. El usuario recibirá notificación para pagar."
          : "Cita confirmada sin pago."
      );
      setModalVisible(false);
      setSelectedAppointment(null);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo aprobar la cita.");
    }
  };

  const onCancel = async (appointmentId: string) => {
    Alert.alert("Cancelar cita", "¿Estás seguro?", [
      { text: "No", style: "cancel" },
      {
        text: "Sí",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "appointments", appointmentId), {
              status: "cancelled",
              updatedAt: serverTimestamp(),
            });
            Alert.alert("Listo", "Cita cancelada.");
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const statuses: Array<AppointmentStatus | "all"> = ["all", "requested", "awaiting_payment", "confirmed", "cancelled", "expired"];

  return (
    <Screen>
      <HeaderBack />
      <Text style={styles.title}>Gestión de Citas</Text>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {statuses.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterButton, selectedStatus === s && styles.filterButtonActive]}
            onPress={() => setSelectedStatus(s)}
          >
            <Text style={[styles.filterText, selectedStatus === s && styles.filterTextActive]}>
              {s === "all" ? "Todas" : s.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={theme.colors.primaryDark} />
      ) : appointments.length === 0 ? (
        <Text style={styles.empty}>No hay citas en este estado.</Text>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {appointments.map((apt) => (
            <Card key={apt.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.serviceName}>{apt.serviceName}</Text>
                <Text style={styles.status}>{apt.status}</Text>
              </View>
              <Text style={styles.label}>
                Solicitado: {new Date(apt.requestedStartAt).toLocaleString("es-MX")}
              </Text>
              {apt.finalStartAt && apt.finalEndAt && (
                <Text style={styles.label}>
                  Final: {new Date(apt.finalStartAt).toLocaleString("es-MX")} - {new Date(apt.finalEndAt).toLocaleTimeString("es-MX")}
                </Text>
              )}
              {apt.depositAmount && <Text style={styles.label}>Depósito: ${apt.depositAmount} MXN</Text>}
              {apt.paymentDueAt && <Text style={styles.label}>Límite pago: {new Date(apt.paymentDueAt).toLocaleString("es-MX")}</Text>}
              {apt.mpStatus && <Text style={styles.label}>Estado MP: {apt.mpStatus}</Text>}
              {apt.notes && <Text style={styles.notes}>Notas: {apt.notes}</Text>}

              <View style={styles.actions}>
                {apt.status === "requested" && (
                  <Button title="Aprobar" onPress={() => openApprovalModal(apt)} />
                )}
                {apt.status === "requested" && (
                  <Button title="Rechazar" variant="secondary" onPress={() => onCancel(apt.id)} />
                )}
                {(apt.status === "awaiting_payment" || apt.status === "confirmed") && (
                  <Button title="Cancelar" variant="secondary" onPress={() => onCancel(apt.id)} />
                )}
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Approval Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aprobar Cita</Text>
            <ScrollView>
              <Controller
                control={control}
                name="finalDate"
                render={({ field: { value, onChange } }) => (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.label}>Fecha final</Text>
                    <Calendar
                      onDayPress={(day) => onChange(day.dateString)}
                      markedDates={value ? { [value]: { selected: true } } : {}}
                    />
                    {formState.errors.finalDate && (
                      <Text style={styles.error}>{formState.errors.finalDate.message}</Text>
                    )}
                  </View>
                )}
              />
              <Controller
                control={control}
                name="finalStartTime"
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label="Hora inicio (HH:mm)"
                    value={value}
                    onChangeText={onChange}
                    error={formState.errors.finalStartTime?.message}
                    placeholder="09:00"
                  />
                )}
              />
              <Controller
                control={control}
                name="finalEndTime"
                render={({ field: { value, onChange } }) => (
                  <TextField
                    label="Hora fin (HH:mm)"
                    value={value}
                    onChangeText={onChange}
                    error={formState.errors.finalEndTime?.message}
                    placeholder="10:00"
                  />
                )}
              />
              {paymentsEnabled && (
                <Controller
                  control={control}
                  name="depositAmount"
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      label="Monto depósito (MXN)"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      error={formState.errors.depositAmount?.message}
                      placeholder="200"
                    />
                  )}
                />
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <Button
                title={paymentsEnabled ? "Aprobar y solicitar pago" : "Confirmar sin pago"}
                onPress={handleSubmit(onApprove)}
              />
              <Button title="Cancelar" variant="secondary" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: "700", fontSize: 22, marginBottom: 12, color: theme.colors.text },
  filterContainer: { maxHeight: 50, marginBottom: 16 },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  filterButtonActive: { backgroundColor: theme.colors.primary },
  filterText: { color: "#666", fontSize: 14, textTransform: "capitalize" },
  filterTextActive: { color: "#fff", fontWeight: "600" },
  empty: { alignSelf: "center", marginTop: 60, color: "#888", fontSize: 15 },
  card: { marginBottom: 12, gap: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  serviceName: { fontWeight: "700", fontSize: 16, color: theme.colors.text },
  status: {
    fontSize: 12,
    color: "#fff",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: "capitalize",
  },
  label: { fontSize: 14, color: "#555" },
  notes: { fontSize: 13, color: "#777", fontStyle: "italic" },
  actions: { flexDirection: "row", gap: 8, marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: { fontWeight: "700", fontSize: 20, marginBottom: 16, color: theme.colors.text },
  modalActions: { gap: 10, marginTop: 16 },
  error: { color: "red", fontSize: 12, marginTop: 4 },
});