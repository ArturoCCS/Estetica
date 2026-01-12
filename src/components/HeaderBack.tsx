import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title?: string;
  right?: React.ReactNode;
};

export function HeaderBack({ title, right }: Props) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const canGoBack = navigation.canGoBack();

  return (
    <View style={[s.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={s.row}>
        <Pressable
          disabled={!canGoBack}
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            s.back,
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            !canGoBack && { opacity: 0.4 },
          ]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color="#1f1f1f" />
        </Pressable>

        <View style={{ flex: 1 }}>
          {!!title && <Text numberOfLines={1} style={s.title}>{title}</Text>}
        </View>

        <View style={s.right}>{right}</View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 18, fontWeight: "800", color: "#1f1f1f" },
  right: { minWidth: 40, alignItems: "flex-end" },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
});