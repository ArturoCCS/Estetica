import React, { useEffect, useState } from "react";
import { Control, Controller } from "react-hook-form";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../components/Button";
import { theme } from "../theme/theme";
import { Appointment } from "../types/domain";
import { BlockedTimeList } from "./BlockedTimeList";

type Props = {
  control: Control<any>;
  appointments: Appointment[];
};

export function ApprovalTimeSelector({
  control,
  appointments,
}: Props) {
  const [duration, setDuration] = useState<number>(60);

  return (
    <>

      <Controller
        control={control}
        name="finalDate"
        render={({ field: { value } }) => (
          <BlockedTimeList
            appointments={appointments}
            selectedDate={value}
          />
        )}
      />


      <Controller
        control={control}
        name="finalStartTime"
        render={({ field: { value, onChange } }) => (
          <View style={styles.section}>
            <Text style={styles.label}>Hora de inicio</Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="HH:mm"
              style={styles.input}
            />
          </View>
        )}
      />

      <View style={styles.section}>
        <Text style={styles.label}>Duración (minutos)</Text>

        <TextInput
          keyboardType="numeric"
          value={String(duration)}
          onChangeText={(v) => setDuration(Number(v || 0))}
          style={styles.input}
        />

        <View style={styles.quickRow}>
          {[30, 45, 60, 90, 120].map((m) => (
            <Button
              key={m}
              title={`${m}`}
              variant={duration === m ? "primary" : "secondary"}
              onPress={() => setDuration(m)}
            />
          ))}
        </View>
      </View>

      <Controller
        control={control}
        name="finalEndTime"
        render={({ field: { value, onChange }, formState }) => {
          const start = formState.defaultValues?.finalStartTime;

          useEffect(() => {
            if (start && duration > 0) {
              onChange(calculateEndTime(start, duration));
            }
          }, [start, duration]);

          return (
            <View style={styles.section}>
              <Text style={styles.label}>Hora de fin</Text>
              <Text style={styles.readonly}>{value}</Text>
            </View>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
  },
  label: {
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 6,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 10,
  },
  readonly: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    fontWeight: "700",
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
});

function calculateEndTime(startTime: string, durationMin: number) {
  const [h, m] = startTime.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m + durationMin, 0, 0);
  return date.toTimeString().slice(0, 5);
}
