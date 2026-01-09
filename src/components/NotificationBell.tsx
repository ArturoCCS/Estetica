import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import { useNotificationsBadge } from "../providers/NotificationsProvider";

export function NotificationBell() {
  const navigation = useNavigation<any>();
  const { unreadCount } = useNotificationsBadge();
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => navigation.navigate("Notifications")}
      style={({ pressed }) => [
        {
          width: 40,
          height: 40,
          borderRadius: theme.radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.overlay,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          ...Platform.select({
            ios: theme.shadows.sm,
            android: { elevation: 2 },
            default: {},
          }),
        },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
      ]}
      hitSlop={10}
    >
      <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
      {unreadCount > 0 && (
        <View style={{
          position: "absolute",
          top: 6,
          right: 6,
          minWidth: 16,
          height: 16,
          paddingHorizontal: 4,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.accent,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Text style={{ 
            color: theme.colors.primary, 
            fontSize: 10, 
            fontWeight: "800" 
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}