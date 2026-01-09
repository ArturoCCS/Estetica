import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../providers/ThemeProvider";

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
  const { theme } = useTheme();

  const items = useMemo(() => value.filter(Boolean), [value]);

  function add() {
    const url = draft.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      Alert.alert("URL inválida", "Debe iniciar con http:// o https://");
      return;
    }
    onChange([...items, url]);
    setDraft("");
  }

  function removeAt(i: number) {
    Alert.alert("Eliminar", "¿Quitar esta imagen de la galería?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => onChange(items.filter((_, idx) => idx !== i)) },
    ]);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
    onChange(next);
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontWeight: "700", color: theme.colors.text }}>{label}</Text>

      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          style={{
            flex: 1,
            height: 44,
            borderRadius: theme.radius.md,
            paddingHorizontal: 12,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card,
            color: theme.colors.text,
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={{
            width: 44,
            height: 44,
            borderRadius: theme.radius.md,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.accent,
          }}
          onPress={add}
        >
          <Ionicons name="add" size={18} color={theme.colors.primary} />
        </Pressable>
      </View>

      {items.length === 0 ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
          Aún no hay imágenes. Agrega links arriba.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((url, i) => (
            <View
              key={`${url}-${i}`}
              style={{
                borderRadius: theme.radius.md,
                padding: 12,
                backgroundColor: theme.colors.card,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border,
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }} numberOfLines={2}>
                  {url}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <Pressable
                  onPress={() => move(i, -1)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.colors.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.border,
                  }}
                  disabled={i === 0}
                >
                  <Ionicons
                    name="chevron-up"
                    size={18}
                    color={i === 0 ? theme.colors.textMuted : theme.colors.text}
                  />
                </Pressable>
                <Pressable
                  onPress={() => move(i, 1)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.colors.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.border,
                  }}
                  disabled={i === items.length - 1}
                >
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={i === items.length - 1 ? theme.colors.textMuted : theme.colors.text}
                  />
                </Pressable>
                <Pressable
                  onPress={() => removeAt(i)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.colors.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
