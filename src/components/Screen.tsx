import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { theme } from "../theme/theme";

export function Screen({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.container, style]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.md
  }
});