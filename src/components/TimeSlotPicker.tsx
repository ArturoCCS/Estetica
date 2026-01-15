import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { useBlockedSlots } from "../hooks/useBlockedSlots";
import { theme } from "../theme/theme";
import { isSlotBlocked } from "../utils/isSlotBlocked";
import { generateTimeSlots } from "../utils/timeSlots";
import { AppAlert } from "./AppAlert";

type Props = {
  dayKey: string;
  durationMinutes: number;
  onSelect: (start: Date, end: Date) => void;
};

export function TimeSlotPicker({
  dayKey,
  durationMinutes,
  onSelect,
}: Props) {
  const blocks = useBlockedSlots(dayKey);
  const [selected, setSelected] = useState<Date | null>(null);
  const [alert, setAlert] = useState<string | null>(null);

  const slots = useMemo(
    () => generateTimeSlots(dayKey),
    [dayKey]
  );

  function handlePress(start: Date) {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);

    const blocked = isSlotBlocked(start, end, blocks);

    if (blocked) {
      setAlert("Este horario ya está ocupado.");
      return;
    }

    setSelected(start);
    onSelect(start, end);
  }

  return (
    <>
      <FlatList
        data={slots}
        numColumns={3}
        keyExtractor={(i) => i.start.toISOString()}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item }) => {
          const end = new Date(item.start);
          end.setMinutes(end.getMinutes() + durationMinutes);

          const blocked = isSlotBlocked(item.start, end, blocks);
          const isSelected =
            selected?.getTime() === item.start.getTime();

          return (
            <Pressable
              onPress={() => handlePress(item.start)}
              disabled={blocked}
              style={[
                styles.slot,
                blocked && styles.blocked,
                isSelected && styles.selected,
              ]}
            >
              <Text
                style={[
                  styles.text,
                  blocked && styles.textBlocked,
                  isSelected && styles.textSelected,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      <AppAlert
        visible={!!alert}
        title="Horario no disponible"
        message={alert ?? ""}
        onClose={() => setAlert(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  blocked: {
    backgroundColor: theme.colors.border,
  },
  selected: {
    backgroundColor: theme.colors.primary,
  },
  text: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "600",
  },
  textBlocked: {
    color: theme.colors.muted,
    textDecorationLine: "line-through",
  },
  textSelected: {
    color: "#fff",
  },
});
