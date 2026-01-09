import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import { Button } from "./Button";

type Props = {
  serviceName: string;
  startAt: string;
  endAt: string;
  status: "pending" | "confirmed" | "cancelled";
  price?: number;
  notes?: string;
  onCancel?: () => void;
};

export function AppointmentCard({ serviceName, startAt, endAt, status, price, notes, onCancel }: Props) {
  const { theme } = useTheme();
  
  return (
    <View style={{ 
      backgroundColor: theme.colors.card, 
      borderRadius: theme.radius.md, 
      padding: 12, 
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 6,
    }}>
      <Text style={{ fontWeight: "700", color: theme.colors.text }}>{serviceName}</Text>
      <Text style={{ color: theme.colors.textSecondary }}>
        {new Date(startAt).toLocaleString()} - {new Date(endAt).toLocaleTimeString()}
      </Text>
      {price ? <Text style={{ color: theme.colors.textSecondary }}>Precio: ${price}</Text> : null}
      <Text style={{ color: theme.colors.textSecondary }}>Estado: {status}</Text>
      {notes ? <Text style={{ color: theme.colors.textMuted }}>Notas: {notes}</Text> : null}
      {status !== "cancelled" && onCancel ? <Button title="Cancelar" variant="secondary" onPress={onCancel} /> : null}
    </View>
  );
}