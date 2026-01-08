import React from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { theme } from "../theme/theme";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        Platform.OS === "web" && styles.webBase,
        variant === "primary" ? styles.primary : styles.secondary,
        isDisabled && { opacity: 0.6 },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={[styles.text, Platform.OS === "web" && styles.webText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  webBase: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: "#111827" },
  text: { color: "white", fontWeight: "800" },
  webText: { fontSize: 15 }
});