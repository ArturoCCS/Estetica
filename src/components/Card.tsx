import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { useTheme } from "../providers/ThemeProvider";

export function Card({ style, ...props }: ViewProps) {
  const { theme } = useTheme();
  
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.md,
        },
        style,
      ]}
    />
  );
}