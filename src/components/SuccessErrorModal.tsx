import LottieView from "lottie-react-native";
import React from "react";
import { Modal, Text, View } from "react-native";

export function SuccessModal({ visible, text }: { visible: boolean; text: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{
        flex:1, backgroundColor:"rgba(10,10,20,0.86)", justifyContent:"center", alignItems:"center"
      }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 40, alignItems: "center" }}>
          <LottieView source={require("../../assets/lottie/success.json")} autoPlay loop={false} style={{ width: 120, height: 120, marginBottom: 15 }} />
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111", textAlign:"center" }}>{text}</Text>
        </View>
      </View>
    </Modal>
  );
}

export function ErrorModal({ visible, text }: { visible: boolean; text: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{
        flex:1, backgroundColor:"rgba(100,5,20,0.86)", justifyContent:"center", alignItems:"center"
      }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 45, alignItems: "center" }}>
          <LottieView source={require("../../assets/lottie/error.json")} autoPlay loop={false} style={{ width: 90, height: 90, marginBottom: 17 }} />
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#C8143C", textAlign:"center" }}>¡Error!</Text>
          <Text style={{ fontSize: 16, color: "#aaa", marginTop:9, textAlign:"center" }}>{text}</Text>
        </View>
      </View>
    </Modal>
  );
}