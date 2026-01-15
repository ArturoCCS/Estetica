import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Modal, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { HeaderBack } from "../components/HeaderBack";
import WheelOfFortune from "../components/WheelOfFortune";
import { db } from "../lib/firebase";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../providers/AuthProvider";

type PromoRouletteRoute = RouteProp<RootStackParamList, "PromoRoulette">;

export function PromoRouletteScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<PromoRouletteRoute>();
  const { promoId, rewards } = route.params;
  const wheelRef = useRef<any>(null);

  const [prizes, setPrizes] = useState(rewards || []);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<{ code: string; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const checkClaimed = async () => {
      if (!user) return;
      const cuponesRef = collection(db, "users", user.uid, "coupons");
      const snap = await getDocs(cuponesRef);
      const already = snap.docs.find(
        d => d.data().promoId === promoId && !d.data().redeemed && (!d.data().expiresAt || new Date(d.data().expiresAt) > new Date())
      );
      if (already) setAlreadyClaimed(true);
    };
    checkClaimed();
  }, [user]);

const handleFinish = (reward: string, winnerIndex: number) => {
  const idx = prizes.findIndex(p => p.label === reward);
  setCurrentPrize(prizes[idx]);
  setShowPrizeModal(true);
};

  const handleSaveCoupon = async () => {
    if (!user || !currentPrize) return;
    setSaving(true);

    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      await addDoc(collection(db, "users", user.uid, "coupons"), {
        promoId,
        code: currentPrize.code,
        label: currentPrize.label,
        redeemed: false,
        createdAt: serverTimestamp(),
        expiresAt: expirationDate.toISOString(),
      });
      setShowPrizeModal(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigation.goBack();
      }, 1800);
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar el cupón.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return (
    <View style={styles.center}>
      <HeaderBack title="Ruleta de premios" />
      <Text>Inicia sesión para jugar la ruleta</Text>
    </View>
  );
  if (alreadyClaimed) {
    return (
      <View style={styles.center}>
        <HeaderBack title="Ruleta de premios" />
        <LottieView source={require("../../assets/lottie/denied.json")} autoPlay loop={false} style={{ width: 140, height: 140 }} />
        <Text style={styles.bigPrize}>¡Ya jugaste esta promoción!</Text>
        <Button title="Regresar" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBack title="Ruleta de premios" />
      <Text style={styles.title}>¡Gira la ruleta y gana tu premio!</Text>
     <WheelOfFortune
        options={{
          rewards: prizes.map(p => p.label),
          knobSize: 30,
          borderWidth: 6,
          borderColor: "#FA4376",
          innerRadius: 10,
          duration: 6000,
          backgroundColor: "#f8f8f8",
          onRef: ref => (wheelRef.current = ref),
          colors: ["#FA4376", "#FFE169", "#CCF5AC", "#9EC9F7", "#ED9D8D", "#C2C2F0"],
        }}
        getWinner={handleFinish}
      />
      <Button
        title="Girar Ruleta"
        onPress={() => wheelRef.current && wheelRef.current._onPress()}
        style={{ marginTop: 28 }}
      />

      <Modal visible={showPrizeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.prizeBox}>
            <LottieView source={require("../../assets/lottie/confetti.json")} autoPlay loop={false} style={{ width: 180, height: 180 }} />
            <Text style={styles.prizePopupText}>¡Ganaste!</Text>
            <Text style={styles.bigPrize}>{currentPrize?.label}</Text>
            <Text selectable style={styles.couponCode}>{currentPrize?.code}</Text>
            <Button
              title={saving ? "Guardando..." : "Guardar en mi perfil"}
              onPress={handleSaveCoupon}
              disabled={saving}
              style={{ marginTop: 17 }}
            />
            <Button
              title="Cancelar"
              onPress={() => setShowPrizeModal(false)}
              variant="secondary"
              style={{ marginTop: 13 }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.prizeBox}>
            <LottieView source={require("../../assets/lottie/success.json")} autoPlay loop={false} style={{ width: 130, height: 130, marginBottom: 14 }} />
            <Text style={styles.prizePopupText}>¡Cupón guardado en tu perfil!</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  title: { fontWeight: "bold", fontSize: 24, color: "#FA4376", textAlign: "center", marginVertical: 22 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(10,10,20,0.8)", justifyContent: "center", alignItems: "center" },
  prizeBox: { backgroundColor: "#fff", padding: 25, paddingTop: 30, borderRadius: 23, alignItems: "center", width: 305, elevation: 16 },
  prizePopupText: { fontSize: 24, fontWeight: "bold", color: "#222", textAlign: "center", marginBottom: 10 },
  bigPrize: { fontSize: 28, color: "#FA4376", fontWeight: "800", marginBottom: 11, textAlign: "center" },
  couponCode: { fontSize: 18, color: "#1a6dff", fontWeight: "bold", marginBottom: 2, textAlign: "center", letterSpacing: 2 }
});