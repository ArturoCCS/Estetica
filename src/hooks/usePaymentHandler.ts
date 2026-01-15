import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert } from "react-native";

export function usePaymentHandler() {
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);

  const handlePayDeposit = async (appointmentId: string) => {
    try {
      setPaymentLoading(appointmentId);
      
      const functionUrl = process.env.EXPO_PUBLIC_CREATE_PAYMENT_URL || "";
      if (!functionUrl) {
        Alert.alert(
          "Servicio no disponible",
          "El sistema de pagos no está configurado. Por favor contacta al administrador."
        );
        setPaymentLoading(null);
        return;
      }

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "No se pudo crear el pago");
      }

      const data = await response.json();
      const initPoint = data.sandboxInitPoint || data.initPoint;

      if (!initPoint) {
        throw new Error("Respuesta inválida del servicio de pagos");
      }

      await WebBrowser.openBrowserAsync(initPoint);
      
      Alert.alert(
        "Pago iniciado",
        "Una vez completado el pago, tu cita será confirmada automáticamente."
      );
    } catch (error: any) {
      Alert.alert(
        "Error al procesar pago",
        "El servicio de pagos no está disponible en este momento. Por favor intenta más tarde o contacta al administrador."
      );
      console.error("Payment error:", error);
    } finally {
      setPaymentLoading(null);
    }
  };

  return { handlePayDeposit, paymentLoading };
}
