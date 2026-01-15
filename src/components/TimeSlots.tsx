import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

type Props = {
  slots: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

export function TimeSlots({ slots, value, onChange, disabled }: Props) {
  if (!slots?.length) {
    return <Text style={styles.empty}>Sin horarios disponibles</Text>;
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {slots.map((t) => {
        const selected = t === value;
        return (
          <Pressable
            key={t}
            style={[styles.chip, selected && styles.chipSelected, disabled && { opacity: 0.6 }]}
            onPress={() => !disabled && onChange(t)}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{t}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingVertical: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#dadadc"
  },
  chipSelected: { backgroundColor: "#FA4376", borderColor: "#FA4376" },
  label: { color: "#111", fontWeight: "600" },
  labelSelected: { color: "#fff" },
  empty: { color: "#888" }
});