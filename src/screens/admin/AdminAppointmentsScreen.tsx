import { HeaderBack } from "@/src/components/HeaderBack";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { AppAlert } from "../../components/AppAlert";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { db } from "../../lib/firebase";
import { createNotification } from "../../lib/notifications";
import { theme } from "../../theme/theme";
import { Appointment } from "../../types/domain";

type UserProfile = {
  uid: string;
  name: string;
  phone?: string;
  email?: string;
};

type ViewTab = "requested" | "pending" | "confirmed" | "cancelled";

type AlertPayload =
  | { type: "cancel"; apt: Appointment }
  | { type: "delete"; apt: Appointment }
  | { type: "error"; message: string }
  | null;

function calcEnd(date: string, start: string, min: number) {
  const s = new Date(`${date}T${start}:00`);
  return new Date(s.getTime() + min * 60000);
}

function formatDate(iso?: string) {
  return iso ? new Date(iso).toLocaleString("es-MX") : "—";
}


function hasConflict(
  start: Date,
  end: Date,
  appointments: Appointment[],
  excludeId?: string
) {
  return appointments.some((a) => {
    if (excludeId && a.id === excludeId) return false;
    if (a.status === "cancelled") return false;
    const aStart = new Date(a.finalStartAt ?? a.requestedStartAt);
    const aDuration = a.durationMinutes ?? 30;
    const aEnd = new Date(aStart.getTime() + aDuration * 60000);
    return start < aEnd && end > aStart;
  });
}

export function AdminAppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewTab>("requested");
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [alert, setAlert] = useState<AlertPayload>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "appointments"),
      orderBy("requestedStartAt", "desc")
    );
    return onSnapshot(q, async (snap) => {
      const now = new Date();
      const rows: Appointment[] = [];
      for (const d of snap.docs) {
        const apt = { id: d.id, ...d.data() } as Appointment;
        const raw = apt.finalStartAt ?? apt.requestedStartAt;
        const aptDate = raw ? new Date(raw) : null;

        if (apt.status === "cancelled" && aptDate && aptDate < now) {
          await deleteDoc(doc(db, "appointments", apt.id));
          continue;
        }
        rows.push(apt);
      }
      setAppointments(rows);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      const missing = Array.from(
        new Set(appointments.map((a) => a.userId))
      ).filter((uid) => !users[uid]);
      if (!missing.length) return;

      const entries: [string, UserProfile][] = [];
      for (const uid of missing) {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const d = snap.data();
          entries.push([
            uid,
            { uid, name: d.name, phone: d.phone, email: d.email },
          ]);
        }
      }
      setUsers((p) => ({ ...p, ...Object.fromEntries(entries) }));
    };
    loadUsers();
  }, [appointments]);

  const data = useMemo(() => {
    return appointments.filter((a) => {
      if (view === "requested") return a.status === "requested";
      if (view === "pending") return a.status === "adjusted";
      if (view === "confirmed") return a.status === "confirmed";
      if (view === "cancelled") {
        return a.status === "cancelled" && a.cancelledBy === "user";
      }
      return false;
    });
  }, [appointments, view]);

  const counts = useMemo(() => {
    return {
      requested: appointments.filter((a) => a.status === "requested").length,
      pending: appointments.filter((a) => a.status === "adjusted").length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      cancelled: appointments.filter(
        (a) => a.status === "cancelled" && a.cancelledBy === "user"
      ).length,
    };
  }, [appointments]);

  const openEdit = (a: Appointment) => {
    const base = new Date(a.finalStartAt ?? a.requestedStartAt);
    setDate(base.toISOString().slice(0, 10));
    setStartTime(base.toTimeString().slice(0, 5));
    
    setDuration(a.durationMinutes ? String(a.durationMinutes) : ""); 
    setPrice(a.price ? String(a.price) : "");
    setNotes(a.adminNotes ?? "");
    setEditing(a);
  };


  const saveChanges = async () => {
    if (!editing) return;

    const durNum = Number(duration);
    if (!duration || isNaN(durNum) || durNum <= 0) {
      setAlert({ type: "error", message: "Debes asignar una duración válida antes de confirmar." });
      return;
    }

    if (!date || !startTime) {
      setAlert({ type: "error", message: "Debes seleccionar fecha y hora." });
      return;
    }

    try {
      setProcessing(true);
      const start = new Date(`${date}T${startTime}:00`);
      const end = new Date(start.getTime() + durNum * 60000);

      const overlap = hasConflict(start, end, appointments, editing.id);
      if (overlap) {
        setAlert({ type: "error", message: "¡Conflicto de horario! Ya hay una cita en este rango." });
        return;
      }

      const isInitialRequest = editing.status === "requested";
      const finalStatus = isInitialRequest ? "confirmed" : "adjusted";

      await updateDoc(doc(db, "appointments", editing.id), {
        finalStartAt: start.toISOString(),
        durationMinutes: durNum,
        price: price ? Number(price) : null,
        adminNotes: notes,
        status: finalStatus,
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        recipientId: editing.userId,
        title: isInitialRequest ? "Cita confirmada" : "Cita modificada",
        message: isInitialRequest 
          ? `Tu cita para ${editing.serviceName} ha sido confirmada.`
          : `Se han realizado cambios en tu cita de ${editing.serviceName}.`,
        read: false,
        route: {
          screen: "Agenda",
          params: { tab: isInitialRequest ? "confirmed" : "pending" },
        },
        appointmentId: editing.id,
        createdAt: serverTimestamp(),
        type: "appointment_update"
      });

      setEditing(null);
    } catch (error) {
      console.error(error);
      setAlert({ type: "error", message: "No se pudo procesar la cita." });
    } finally {
      setProcessing(false);
    }
  };

  const cancelByAdmin = async (a: Appointment) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, "appointments", a.id), {
        status: "cancelled",
        cancelledBy: "admin",
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        recipientId: a.userId,
        title: "Cita cancelada",
        message: "El administrador ha cancelado tu cita",
        read: false,
        route: {
          screen: "Agenda",
          params: { tab: "cancelled" },
        },
        appointmentId: "",
        type: "",
        createdAt: undefined
      });
    } finally {
      setProcessing(false);
      setAlert(null);
    }
  };

  const confirmAction = async () => {
    if (!alert || processing) return;
    setProcessing(true);
    try {
      if (alert.type === "cancel") {
        await cancelByAdmin(alert.apt);
      }
      if (alert.type === "delete") {
        await deleteDoc(doc(db, "appointments", alert.apt.id));
      }
    } finally {
      setProcessing(false);
      setAlert(null);
    }
  };

  const confirmDirectly = async (a: Appointment) => {
    setProcessing(true);
    try {
      await updateDoc(doc(db, "appointments", a.id), {
        finalStartAt: a.requestedStartAt, 
        status: "confirmed",
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        recipientId: a.userId,
        title: "Cita confirmada",
        message: `Tu cita para ${a.serviceName} ha sido confirmada.`,
        read: false,
        route: {
          screen: "Agenda",
          params: { tab: "confirmed" },
        },
        appointmentId: a.id,
        createdAt: serverTimestamp(),
        type: ""
      });
    } catch (error) {
      console.error(error);
      setAlert({ type: "error", message: "Error al confirmar la cita" });
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPress = (item: Appointment) => {
    openEdit(item);
    

    if (!item.durationMinutes) setDuration("");
  };
  return (
    <Screen>
      <HeaderBack />

      <View style={styles.tabs}>
        {[
          ["requested", "Solicitudes", counts.requested],
          ["pending", "Pendientes", counts.pending],
          ["confirmed", "Confirmadas", counts.confirmed],
          ["cancelled", "Canceladas", counts.cancelled],
        ].map(([k, l, count]) => (
          <Pressable
            key={k}
            onPress={() => setView(k as ViewTab)}
            style={[styles.tab, view === k && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, view === k && styles.tabLabelActive]}>
              {l}
            </Text>
            {Number(count) > 0 && (
              <View style={[styles.badge, view === k && styles.badgeActive]}>
                <Text
                  style={[
                    styles.badgeText,
                    view === k && styles.badgeTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando citas...</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <View style={styles.emptyIconInner} />
          </View>
          <Text style={styles.emptyTitle}>No hay citas</Text>
          <Text style={styles.emptySubtitle}>
            {view === "requested"
              ? "No hay solicitudes pendientes"
              : view === "pending"
              ? "No hay citas pendientes de confirmación"
              : view === "confirmed"
              ? "No hay citas confirmadas"
              : "No hay citas canceladas por clientes"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const user = users[item.userId];
            const shownDate = item.finalStartAt ?? item.requestedStartAt;
            const isCancelled = view === "cancelled";

            return (
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {user?.name?.charAt(0)?.toUpperCase() ?? "C"}
                    </Text>
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.clientName}>
                      {user?.name ?? "Cliente"}
                    </Text>
                    <Text style={styles.serviceName}>{item.serviceName}</Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Fecha y hora</Text>
                    <Text style={styles.infoValue}>{formatDate(shownDate)}</Text>
                  </View>

                  {item.durationMinutes && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Duración</Text>
                      <Text style={styles.infoValue}>{item.durationMinutes} min</Text>
                    </View>
                  )}

                  {item.price && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Precio</Text>
                      <Text style={styles.infoValue}>${item.price}</Text>
                    </View>
                  )}

                  {user?.phone && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Teléfono</Text>
                      <Text style={styles.infoValue}>{user.phone}</Text>
                    </View>
                  )}

                  {user?.email && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{user.email}</Text>
                    </View>
                  )}
                </View>

                {!!item.notes && (
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteLabel}>Nota del cliente</Text>
                    <Text style={styles.noteText}>{item.notes}</Text>
                  </View>
                )}

                {!!item.adminNotes && (
                  <View style={[styles.noteContainer, styles.adminNote]}>
                    <Text style={styles.noteLabel}>Nota admin</Text>
                    <Text style={styles.noteText}>{item.adminNotes}</Text>
                  </View>
                )}

                {!isCancelled && <View style={styles.divider} />}

                {!isCancelled ? (
                  <View style={styles.actionsRow}>
                    {(view === "requested" || view === "pending") && (
                      <Pressable
                        style={[styles.confirmBtn, { flex: 1.2 }]}
                        onPress={() => handleConfirmPress(item)}
                      >
                        <Text style={styles.confirmBtnText}>Confirmar</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={styles.adjustBtn}
                      onPress={() => openEdit(item)}
                    >
                      <Text style={styles.adjustBtnText}>
                        {view === "requested" ? "Ajustar" : "Editar"}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => setAlert({ type: "cancel", apt: item })}
                    >
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => setAlert({ type: "delete", apt: item })}
                  >
                    <Text style={styles.deleteBtnText}>Eliminar definitivamente</Text>
                  </Pressable>
                )}
              </Card>
            );
          }}
        />
      )}

      {alert && (
        <AppAlert
          visible
          title={
            alert.type === "delete"
              ? "Eliminar cita"
              : alert.type === "cancel"
              ? "Cancelar cita"
              : "Error"
          }
          message={
            alert.type === "error"
              ? alert.message
              : alert.type === "delete"
              ? "Esta acción no se puede deshacer."
              : "¿Deseas cancelar esta cita?"
          }
          confirmText={
            alert.type === "delete"
              ? "Eliminar"
              : alert.type === "cancel"
              ? "Rechazar cita"
              : "Aceptar"
          }
          onConfirm={alert.type === "error" ? () => setAlert(null) : confirmAction}
          onCancel={() => setAlert(null)}
        />
      )}

      <Modal visible={!!editing} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Ajustar cita</Text>

              <Text style={styles.label}>Fecha</Text>
              <Calendar
                onDayPress={(d) => setDate(d.dateString)}
                markedDates={{
                  [date]: {
                    selected: true,
                    selectedColor: theme.colors.primary,
                  },
                }}
                theme={{
                  selectedDayBackgroundColor: theme.colors.primary,
                  todayTextColor: theme.colors.primary,
                  arrowColor: theme.colors.primary,
                }}
              />

              <Text style={styles.label}>Hora de inicio</Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Duración (minutos)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Precio (opcional)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="500"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Notas del administrador</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                placeholder="Agregar notas internas..."
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <Button
                  title={editing?.status === "requested" ? "Confirmar Cita" : "Guardar cambios"}
                  onPress={saveChanges}
                  style={{
                    flex: 1,
                    backgroundColor:
                      editing?.status === "requested"
                        ? theme.colors.primaryDark
                        : theme.colors.primary,
                  }}
                />
                <Button
                  title="Cerrar"
                  variant="secondary"
                  onPress={() => setEditing(null)}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: theme.radius.md,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "transparent",
    minHeight: 60,
  },
  tabActive: {
    backgroundColor: "#fff",
    borderColor: theme.colors.primary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },
  tabLabelActive: {
    color: theme.colors.primary,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeActive: {
    backgroundColor: theme.colors.primary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
  },
  badgeTextActive: {
    color: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  confirmBtn: {
    backgroundColor: theme.colors.primaryDark,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.muted,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyIconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 12,
    padding: 0,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  serviceName: {
    fontSize: 14,
    color: theme.colors.muted,
    fontWeight: "500",
  },
  infoSection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
    color: theme.colors.muted,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  noteContainer: {
    marginHorizontal: theme.spacing.md,
    marginBottom: 8,
    padding: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: theme.radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  adminNote: {
    borderLeftColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: theme.spacing.md,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  adjustBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  adjustBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 14,
  },
  deleteBtn: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    backgroundColor: "#991B1B",
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: theme.radius.md,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#F9FAFB",
    color: "#111827",
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
});