import React from "react";
import { Platform, ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, style, scroll = false, contentContainerStyle }: Props) {
  const insets = useSafeAreaInsets();

  const base: ViewStyle = {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingHorizontal: 16,
  };

  if (scroll) {
    return (
      <ScrollView
        style={[
          base,
          Platform.OS === "web" && ({ overflowY: "auto" } as any),
        ]}
        contentContainerStyle={[
          { flexGrow: 1, paddingBottom: insets.bottom + 24 },
          contentContainerStyle,
          style,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[base, style]}>{children}</View>;
}