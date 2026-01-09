import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../providers/ThemeProvider";

type Props = {
  title?: string;
  right?: React.ReactNode;
};

export function HeaderBack({ title, right }: Props) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const canGoBack = navigation.canGoBack();
  const { theme } = useTheme();

  return (
    <View style={[s.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={s.row}>
        <Pressable
          disabled={!canGoBack}
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            {
              width: 40,
              height: 40,
              borderRadius: theme.radius.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.overlay,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border,
              ...Platform.select({
                ios: theme.shadows.sm,
                android: { elevation: 2 },
                default: {},
              }),
            },
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            !canGoBack && { opacity: 0.4 },
          ]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          {!!title && (
            <Text 
              numberOfLines={1} 
              style={{ 
                fontSize: 18, 
                fontWeight: "800", 
                color: theme.colors.text 
              }}
            >
              {title}
            </Text>
          )}
        </View>

        <View style={s.right}>{right}</View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  right: { minWidth: 40, alignItems: "flex-end" },
});