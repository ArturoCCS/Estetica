/**
 * NotificationsScreen - Inbox for in-app notifications
 * 
 * Shows derived notifications from appointments:
 * - Admin: pending appointment requests (status='requested')
 * - User: appointment status changes and updates
 */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { HeaderBack } from "../components/HeaderBack";
import { Screen } from "../components/Screen";
import { DerivedNotification, updateLastSeen, useDerivedNotifications } from "../lib/notifications-derived";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../providers/AuthProvider";
import { useTheme } from "../providers/ThemeProvider";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function NotificationsScreen() {
  const { user, isAdmin } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const notifications = useDerivedNotifications(isAdmin, user?.uid || null);
  const [loading, setLoading] = React.useState(true);
  const { theme } = useTheme();

  // Mark as read when screen opens (for non-admin users)
  useEffect(() => {
    if (user && !isAdmin) {
      updateLastSeen(user.uid);
    }
  }, [user, isAdmin]);

  // Stop loading after a brief moment
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNotificationPress = (notification: DerivedNotification) => {
    if (isAdmin) {
      // Navigate to admin appointments screen
      navigation.navigate("AdminAppointments");
    } else {
      // Navigate to user bookings screen
      navigation.navigate("Main", { screen: "Bookings" });
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Justo ahora";
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString("es-MX", { 
      month: "short", 
      day: "numeric",
      ...(date.getFullYear() !== new Date().getFullYear() && { year: "numeric" })
    });
  };

  const renderNotification = ({ item }: { item: DerivedNotification }) => {
    const shouldShowAsUnread = !isAdmin; // For users, items in this list are considered unread
    
    return (
      <Pressable
        style={({ pressed }) => [
          {
            flexDirection: "row",
            padding: 16,
            backgroundColor: shouldShowAsUnread ? theme.colors.cardSecondary : theme.colors.card,
            borderRadius: 12,
            marginBottom: 12,
            gap: 12,
            borderLeftWidth: shouldShowAsUnread ? 3 : 0,
            borderLeftColor: shouldShowAsUnread ? theme.colors.accent : "transparent",
            ...Platform.select({
              ios: theme.shadows.sm,
              android: { elevation: 2 },
              web: {},
            }),
          },
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.colors.surface,
          justifyContent: "center",
          alignItems: "center",
        }}>
          <Ionicons
            name={item.type === "appointment_pending" ? "calendar-outline" : "checkmark-circle-outline"}
            size={24}
            color={theme.colors.accent}
          />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text, flex: 1 }} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 }} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen>
      <HeaderBack />
      <View style={styles.header}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: theme.colors.text, letterSpacing: -0.5 }}>
          Notificaciones
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textMuted} />
          <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.textSecondary, marginTop: 16 }}>
            No hay notificaciones
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.textMuted, textAlign: "center", marginTop: 8 }}>
            {isAdmin 
              ? "Las citas solicitadas aparecerán aquí" 
              : "Las actualizaciones de tus citas aparecerán aquí"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  listContent: {
    paddingBottom: 30,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
});
