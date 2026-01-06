import { useNavigation } from "@react-navigation/native";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { HeaderBack } from "../components/HeaderBack";
import { Screen } from "../components/Screen";
import {
    AppNotification,
    markAllNotificationsRead,
    markNotificationRead,
    subscribeNotifications,
} from "../lib/notifications";
import { useAuth } from "../providers/AuthProvider";
import { theme } from "../theme/theme";

export function NotificationsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.uid, (rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, [user?.uid]);

  async function markAll() {
    if (!user) return;
    const unread = items.filter((n) => !n.readAt).map((n) => n.id);
    if (unread.length === 0) return;
    await markAllNotificationsRead(user.uid, unread);
  }

  async function open(n: AppNotification) {
    if (!user) return;

    await markNotificationRead(user.uid, n.id);

    const appointmentId = n.data?.appointmentId;
    if (appointmentId) {
      // Puedes mejorar esto para navegar a un detalle específico
      navigation.navigate("Main", { screen: "Bookings" });
    }
  }

  return (
    <Screen>
      <HeaderBack
        title="Notificaciones"
        right={
          <Pressable onPress={markAll} hitSlop={10}>
            <Text style={{ color: theme.colors.primary, fontWeight: "900" }}>✓</Text>
          </Pressable>
        }
      />

      {loading ? (
        <Text style={{ color: theme.colors.muted, marginTop: 12 }}>Cargando…</Text>
      ) : items.length === 0 ? (
        <Text style={{ color: "#888", marginTop: 12 }}>No tienes notificaciones.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingVertical: 10, gap: 10 }}
          renderItem={({ item }) => {
            const unread = !item.readAt;
            return (
              <Pressable onPress={() => open(item)} style={[s.card, unread && s.cardUnread]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={s.body} numberOfLines={2}>
                    {item.body}
                  </Text>
                </View>
                {unread && <View style={s.dot} />}
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  cardUnread: {
    backgroundColor: "#fff1f2",
    borderColor: "rgba(250,67,118,0.18)",
  },
  title: { fontWeight: "900", color: "#222" },
  body: { color: "#666", marginTop: 4, lineHeight: 18, fontSize: 13 },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: "#fa4376" },
});