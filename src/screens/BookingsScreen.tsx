import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppAlert } from "../components/AppAlert";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { db } from "../lib/firebase";
import { createNotification } from "../lib/notifications";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../providers/AuthProvider";
import { theme } from "../theme/theme";
import { Appointment } from "../types/domain";

type Tab = "requested" | "adjusted" | "confirmed" | "cancelled";

type AlertPayload =
  | { type: "cancel"; apt: Appointment }
  | { type: "delete"; apt: Appointment }
  | null;

export function BookingsScreen() {
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("requested");
  const [alert, setAlert] = useState<AlertPayload>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
      orderBy("requestedStartAt", "desc")
    );

    return onSnapshot(q, async (snap) => {
      const now = new Date();
      const rows: Appointment[] = [];

      for (const d of snap.docs) {
        const apt = { id: d.id, ...(d.data() as any) } as Appointment;
        const raw = apt.finalStartAt ?? apt.requestedStartAt;
        const aptDate = raw ? new Date(raw) : null;

        if (
          apt.status === "cancelled" &&
          aptDate &&
          aptDate < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        ) {
          await deleteDoc(doc(db, "appointments", apt.id));
          continue;
        }
        rows.push(apt);
      }

      setItems(rows);
      setLoading(false);
    });
  }, [user]);

  const data = useMemo(() => {
    return items.filter((a) => {
      if (a.status !== tab) return false;

      if (tab === "cancelled") {
        return a.cancelledBy === "admin";
      }

      return true;
    });
  }, [items, tab]);

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleString("es-MX") : "—";

  if (!user) return null;

  const counts = useMemo(() => {
    return {
      requested: items.filter((a) => a.status === "requested").length,
      adjusted: items.filter((a) => a.status === "adjusted").length,
      confirmed: items.filter((a) => a.status === "confirmed").length,
      cancelled: items.filter(
        (a) => a.status === "cancelled" && a.cancelledBy === "admin"
      ).length,
    };
  }, [items]);

  const confirmCancel = async () => {
    if (!alert || alert.type !== "cancel" || processing) return;
    setProcessing(true);
    try {
      await updateDoc(doc(db, "appointments", alert.apt.id), {
        status: "cancelled",
        cancelledBy: "user",
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        recipientId: "ADMIN",
        appointmentId: alert.apt.id,
        type: "appointment_cancelled_by_user",
        title: "Cita Cancelada por Cliente",
        message: `El cliente ${alert.apt.userName || 'Usuario'} ha cancelado su cita de ${alert.apt.serviceName}. Haz clic para ver los detalles en el panel.`,
        read: false,
        route: {
          screen: "AdminAppointments",
          params: { tab: "cancelled" },
        },
        createdAt: serverTimestamp(),
      });

    } catch (error) {
      console.error("Error al cancelar:", error);
    } finally {
      setProcessing(false);
      setAlert(null);
    }
  };

  const confirmDelete = async () => {
    if (!alert || alert.type !== "delete" || processing) return;
    setProcessing(true);
    try {
      await deleteDoc(doc(db, "appointments", alert.apt.id));
    } finally {
      setProcessing(false);
      setAlert(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis citas</Text>
        <Text style={styles.subtitle}>
          Gestiona tus reservaciones y revisa tu agenda
        </Text>
      </View>

      <Button
        title="Ver mi agenda"
        onPress={() => navigation.navigate("Calendar")}
        style={styles.calendarBtn}
      />

      <View style={styles.tabs}>
        {[
          ["requested", "Solicitudes", counts.requested],
          ["adjusted", "Cambios", counts.adjusted],
          ["confirmed", "Confirmadas", counts.confirmed],
          ["cancelled", "Canceladas", counts.cancelled],
        ].map(([key, label, count]) => (
          <Pressable
            key={key}
            onPress={() => setTab(key as Tab)}
            style={[styles.tab, tab === key && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>
              {label}
            </Text>
            {Number(count) > 0 && (
              <View style={[styles.badge, tab === key && styles.badgeActive]}>
                <Text
                  style={[
                    styles.badgeText,
                    tab === key && styles.badgeTextActive,
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
            {tab === "requested"
              ? "No tienes solicitudes pendientes"
              : tab === "adjusted"
              ? "No hay citas con cambios"
              : tab === "confirmed"
              ? "No tienes citas confirmadas"
              : "No hay citas canceladas por el administrador"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isAdjusted = item.status === "adjusted";
            const isCancelled = item.status === "cancelled";
            const dateToShow = item.finalStartAt ?? item.requestedStartAt;

            return (
              <Card style={styles.card}>
                <Pressable
                  onPress={() =>
                    navigation.navigate("AppointmentDetail", {
                      appointmentId: item.id,
                    })
                  }
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.serviceName}>{item.serviceName}</Text>
                      {isAdjusted && (
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>Ajustada</Text>
                        </View>
                      )}
                      {isCancelled && (
                        <View style={[styles.statusBadge, styles.statusBadgeCancelled]}>
                          <Text style={styles.statusBadgeText}>Cancelada</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Fecha y hora</Text>
                      <Text style={styles.infoValue}>{formatDate(dateToShow)}</Text>
                    </View>

                    {item.durationMinutes && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Duración</Text>
                        <Text style={styles.infoValue}>
                          {item.durationMinutes} min
                        </Text>
                      </View>
                    )}

                    {item.price && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Precio</Text>
                        <Text style={styles.infoValue}>${item.price}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.detailLink}>Ver detalles completos</Text>
                  </View>
                </Pressable>

                {!isCancelled && <View style={styles.divider} />}

                {item.status !== "cancelled" ? (
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => setAlert({ type: "cancel", apt: item })}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar cita</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => setAlert({ type: "delete", apt: item })}
                  >
                    <Text style={styles.deleteBtnText}>
                      Eliminar definitivamente
                    </Text>
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
          title={alert.type === "delete" ? "Eliminar cita" : "Cancelar cita"}
          message={
            alert.type === "delete"
              ? "Esta acción elimina la cita definitivamente."
              : "¿Deseas cancelar esta cita?"
          }
          confirmText={alert.type === "delete" ? "Eliminar" : "Rechazar"}
          onConfirm={alert.type === "delete" ? confirmDelete : confirmCancel}
          onCancel={() => setAlert(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
  },
  calendarBtn: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
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
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabLabelActive: {
    color: theme.colors.primary,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeActive: {
    backgroundColor: theme.colors.primary,
  },
  badgeText: {
    fontSize: 11,
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
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  serviceName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    backgroundColor: "#DBEAFE",
  },
  statusBadgeCancelled: {
    backgroundColor: theme.colors.primaryDark,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#DBEAFE",
  },
  cardBody: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 10,
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
  cardFooter: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  detailLink: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: theme.spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },
  deleteBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#991B1B",
  },
});