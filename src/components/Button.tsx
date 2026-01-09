import React from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { useTheme } from "../providers/ThemeProvider";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = "primary", loading, disabled, style }: Props) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: theme.colors.accent,
          borderWidth: 0,
        };
      case "secondary":
        return {
          backgroundColor: theme.colors.primary,
          borderWidth: 0,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      default:
        return {
          backgroundColor: theme.colors.accent,
          borderWidth: 0,
        };
    }
  };

  const getTextColor = () => {
    if (variant === "ghost") {
      return theme.colors.text;
    }
    return variant === "primary" ? theme.colors.primary : theme.colors.surface;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        Platform.OS === "web" && styles.baseWeb,
        getVariantStyles(),
        isDisabled && { opacity: 0.6 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text 
          style={[
            styles.text,
            { 
              color: getTextColor(),
              fontSize: theme.typography.button.fontSize,
              fontWeight: theme.typography.button.fontWeight,
            },
            Platform.OS === "web" && styles.textWeb
          ]}
        >
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
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  baseWeb: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    cursor: "pointer",
  },
  text: {
    fontWeight: "700",
  },
  textWeb: {
    fontSize: 14,
  },
});