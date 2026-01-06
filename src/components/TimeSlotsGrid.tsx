import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  slots: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

export function TimeSlotsGrid({ slots, value, onChange, disabled }: Props) {
  if (!slots?.length) return <Text style={styles.empty}>Sin horarios disponibles</Text>;

  return (
    <FlatList
      data={slots}
      keyExtractor={(t) => t}
      numColumns={4}
      columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
      renderItem={({ item }) => {
        const selected = item === value;
        return (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.chip, selected && styles.chipSelected, disabled && { opacity: 0.6 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => !disabled && onChange(item)}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{item}</Text>
          </TouchableOpacity>
        );
      }}
      contentContainerStyle={{ paddingVertical: 6 }}
    />
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    minWidth: 60,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: "#FA4376", borderColor: "#FA4376" },
  label: { color: "#111", fontWeight: "600" },
  labelSelected: { color: "#fff" },
  empty: { color: "#888" },
});