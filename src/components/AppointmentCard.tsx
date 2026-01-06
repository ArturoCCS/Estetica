import React from "react";
import { Text, View } from "react-native";
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
  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 12, elevation: 2 }}>
      <Text style={{ fontWeight: "700" }}>{serviceName}</Text>
      <Text>{new Date(startAt).toLocaleString()} - {new Date(endAt).toLocaleTimeString()}</Text>
      {price ? <Text>Precio: ${price}</Text> : null}
      <Text>Estado: {status}</Text>
      {notes ? <Text>Notas: {notes}</Text> : null}
      {status !== "cancelled" && onCancel ? <Button title="Cancelar" variant="secondary" onPress={onCancel} /> : null}
    </View>
  );
}