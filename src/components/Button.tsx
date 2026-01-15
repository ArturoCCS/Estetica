import React from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { theme } from "../theme/theme";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "muted" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = "primary", loading, disabled, style }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        Platform.OS === "web" && styles.baseWeb,
        variant === "primary" ? styles.primary : variant === "secondary" ? styles.secondary : variant === "muted" ? styles.muted : variant === "danger" ? styles.danger : {},
        isDisabled && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "muted" ? "black" : "white"} />
      ) : (
        <Text style={[
          styles.text, 
          Platform.OS === "web" && styles.textWeb,
          variant === "muted" && styles.textMuted
        ]}>
          {title}
        </Text>
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
    justifyContent: "center",
  },
  baseWeb: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: "#111827" },
  muted: { backgroundColor: "#dadadc" },
  danger: { backgroundColor: "#a32c2c" },
  text: { color: "white", fontWeight: "800" },
  textWeb: { fontSize: 13.5 },
  textMuted: { color: "black" },
});