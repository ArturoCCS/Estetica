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
import { theme } from "../theme/theme";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function NotificationsScreen() {
  const { user, isAdmin } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const notifications = useDerivedNotifications(isAdmin, user?.uid || null);
  const [loading, setLoading] = React.useState(true);

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
          styles.notificationItem,
          shouldShowAsUnread && styles.notificationItemUnread,
          pressed && styles.notificationItemPressed,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationIcon}>
          <Ionicons
            name={item.type === "appointment_pending" ? "calendar-outline" : "checkmark-circle-outline"}
            size={24}
            color={theme.colors.primary}
          />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
          
          <Text style={styles.notificationMessage} numberOfLines={2}>
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
        <Text style={styles.title}>Notificaciones</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No hay notificaciones</Text>
          <Text style={styles.emptySubtext}>
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
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: -0.5,
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
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6b7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 30,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      web: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      },
    }),
  },
  notificationItemUnread: {
    backgroundColor: "#fef3f5",
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  notificationItemPressed: {
    opacity: 0.7,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fef3f5",
    justifyContent: "center",
    alignItems: "center",
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
  notificationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
});
