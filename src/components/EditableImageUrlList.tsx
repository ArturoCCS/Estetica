import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppAlert } from "./AppAlert";
type Props = {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

export function EditableImageUrlList({
  label = "Galería",
  value,
  onChange,
  placeholder = "https://...",
}: Props) {
  const [draft, setDraft] = useState("");
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

  const items = useMemo(() => value.filter(Boolean), [value]);

  function add() {
    const url = draft.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      setDraft("");
      return;
    }

    onChange([...value, url]);
    setDraft("");
  }

  function requestRemove(i: number) {
    setConfirmIndex(i);
  }

  function confirmRemove() {
    if (confirmIndex === null) return;

    onChange(value.filter((_, idx) => idx !== confirmIndex));
    setConfirmIndex(null);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;

    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>

      <View style={s.addRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor="#9aa0a6"
          style={s.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable style={s.addBtn} onPress={add}>
          <Ionicons name="add" size={18} color="#fff" />
        </Pressable>
      </View>

      {items.length === 0 ? (
        <Text style={s.empty}>Aún no hay imágenes. Agrega links arriba.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((url, i) => (
            <View key={`${url}-${i}`} style={s.item}>
              <View style={{ flex: 1 }}>
                <Text style={s.url} numberOfLines={2}>
                  {url}
                </Text>
              </View>

              <View style={s.actions}>
                <Pressable
                  onPress={() => move(i, -1)}
                  style={s.iconBtn}
                  disabled={i === 0}
                >
                  <Ionicons
                    name="chevron-up"
                    size={18}
                    color={i === 0 ? "#c6c6c6" : "#333"}
                  />
                </Pressable>

                <Pressable
                  onPress={() => move(i, 1)}
                  style={s.iconBtn}
                  disabled={i === items.length - 1}
                >
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={i === items.length - 1 ? "#c6c6c6" : "#333"}
                  />
                </Pressable>

                <Pressable
                  onPress={() => requestRemove(i)}
                  style={[s.iconBtn, { backgroundColor: "#fff1f2" }]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color="#e11d48"
                  />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
      <AppAlert
        visible={confirmIndex !== null}
        title="Eliminar imagen"
        message="¿Quitar esta imagen de la galería?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onCancel={() => setConfirmIndex(null)}
        onConfirm={confirmRemove}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  label: { fontWeight: "800", color: "#1f1f1f" },
  addRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fa4376",
  },
  empty: { color: "#7a7a7a", fontSize: 13 },
  item: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  url: { color: "#333", fontSize: 12 },
  actions: { flexDirection: "row", gap: 8, alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
});
