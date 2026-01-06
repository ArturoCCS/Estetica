import React, { useRef } from "react";
import { Button, View } from "react-native";
import WheelOfFortune from "react-native-wheel-of-fortune";

type Prize = { label: string; code: string };
type WheelRefType = { _onPress: () => void };

export function WheelOfFortuneWithKnob({ rewards, onWin }) {
  const wheelRef = useRef(null);
  const labelArr = rewards.map(r => r.label);
  const getWinner = winnerIndex => {
    const prize = rewards[winnerIndex];
    onWin(prize, winnerIndex);
  };
  return (
    <View style={{ alignItems: "center", marginVertical: 30 }}>
      <WheelOfFortune
        options={{
          rewards: labelArr,
          knobSize: 45,
          borderWidth: 8,
          borderColor: "#FA4376",
          innerRadius: 13,
          colors: ["#FA4376", "#FFC300", "#8AC7DB", "#A3F7BF", "#F76E6E", "#ED9D8D", "#C2C2F0"],
          backgroundColor: "#fff",
          textStyle: { fontSize: 21, fontWeight: "bold", color: "#333" },
          duration: 7000,
        }}
        getWinner={getWinner}
        onRef={ref => (wheelRef.current = ref)}
      />
      <Button title="Girar Ruleta" onPress={() => wheelRef.current && wheelRef.current._onPress()} />
    </View>
  );
}