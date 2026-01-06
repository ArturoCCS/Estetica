import LottieView from "lottie-react-native";
import React from "react";
import { Modal, Text, View } from "react-native";
import { Button } from "../components/Button";

export function PrizePopupModal({
  visible,
  prize,
  onSave,
  saving,
  onCancel,
}: {
  visible: boolean;
  prize: { label: string; code: string };
  onSave: () => void;
  saving: boolean;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{
        flex:1, backgroundColor:"rgba(40,8,86,0.82)", justifyContent:"center", alignItems:"center"
      }}>
        <View style={{
          backgroundColor: "#fff",
          borderRadius: 28,
          minWidth: 310,
          padding: 28,
          alignItems: "center",
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 9 },
          shadowOpacity: 0.19,
          shadowRadius: 15,
        }}>
          <LottieView source={require("../../assets/lottie/confetti.json")} autoPlay loop={false} style={{ width: 160, height: 160 }} />
          <Text style={{ fontSize: 30, fontWeight:"bold", color: "#FA4376", marginTop: 14, marginBottom: 15 }}>¡Ganaste!</Text>
          <Text style={{ fontSize: 23, color: "#5A0080", fontWeight:"bold", marginBottom: 2, textAlign:"center" }}>{prize.label}</Text>
          <Text selectable style={{
            fontSize: 28,
            color: "#1a6dff",
            fontWeight: "bold",
            backgroundColor:"#F2F7FF",
            paddingHorizontal: 24,
            paddingVertical: 11,
            borderRadius: 20,
            letterSpacing: 4,
            marginVertical: 13
          }}>{prize.code}</Text>
          <Button title={saving ? "Guardando..." : "Guardar en mi perfil"}
                  onPress={onSave}
                  disabled={saving}
                  style={{ marginTop: 23 }} />
          <Button title="Cancelar" onPress={onCancel} variant="secondary" style={{ marginTop: 13 }} />
        </View>
      </View>
    </Modal>
  );
}