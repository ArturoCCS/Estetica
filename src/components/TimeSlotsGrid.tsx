import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { theme } from "../theme/theme";

type Props = {
  slots: string[];
  value?: string;
  disabledSlots?: Set<string>;
  onChange: (slot: string) => void;
};

export function TimeSlotsGrid({
  slots,
  value,
  disabledSlots,
  onChange,
}: Props) {
  if (!slots || slots.length === 0) {
    return (
      <Text style={styles.empty}>
        No hay horarios disponibles
      </Text>
    );
  }

  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const disabled = disabledSlots?.has(slot) ?? false;
        const selected = value === slot;

        return (
          <Pressable
            key={slot}
            disabled={disabled}
            onPress={() => {
              if (!disabled) {
                onChange(slot);
              }
            }}
            style={({ pressed }) => [
              styles.slot,
              selected && styles.selected,
              disabled && styles.disabled,
              pressed && !disabled && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.slotText,
                selected && styles.selectedText,
                disabled && styles.disabledText,
              ]}
            >
              {slot}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  slot: {
    minWidth: 72,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  selected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  disabled: {
    backgroundColor: "#f1f1f1",
    borderColor: "#ddd",
  },
  slotText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  selectedText: {
    color: "#fff",
  },
  disabledText: {
    color: "#999",
    textDecorationLine: "line-through",
  },
  empty: {
    marginTop: 10,
    fontSize: 13,
    color: "#999",
  },
});
