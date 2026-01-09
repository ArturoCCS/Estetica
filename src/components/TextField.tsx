import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { useTheme } from "../providers/ThemeProvider";

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function TextField({ label, error, style, ...props }: Props) {
  const { theme } = useTheme();
  
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text style={{ 
        fontWeight: "700", 
        color: theme.colors.text,
        fontSize: theme.typography.caption.fontSize,
      }}>
        {label}
      </Text>
      <TextInput
        {...props}
        style={[
          {
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            padding: 12,
            backgroundColor: theme.colors.card,
            color: theme.colors.text,
            fontSize: theme.typography.body.fontSize,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.textMuted}
      />
      {!!error && (
        <Text style={{ 
          color: theme.colors.error, 
          fontWeight: "600",
          fontSize: theme.typography.caption.fontSize,
        }}>
          {error}
        </Text>
      )}
    </View>
  );
}