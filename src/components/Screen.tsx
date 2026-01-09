import React from "react";
import { Platform, ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../providers/ThemeProvider";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

let injectedWebScrollbarCSS = false;

function injectWebScrollbarCSS(scrollbarTrack: string, scrollbarThumb: string, scrollbarThumbHover: string) {
  if (Platform.OS !== "web") return;
  if (injectedWebScrollbarCSS) {
    // Update existing styles
    const existingStyle = document.querySelector('[data-estetica-scrollbar]');
    if (existingStyle) {
      existingStyle.remove();
      injectedWebScrollbarCSS = false;
    }
  }
  
  injectedWebScrollbarCSS = true;

  const css = `
  /* Web scrollbar - theme aware */
  ::-webkit-scrollbar { width: 14px; height: 14px; }
  ::-webkit-scrollbar-track { background: ${scrollbarTrack}; }
  ::-webkit-scrollbar-thumb {
    background: ${scrollbarThumb};
    border-radius: 999px;
    border: 4px solid ${scrollbarTrack};
    background-clip: padding-box;
  }
  ::-webkit-scrollbar-thumb:hover { background: ${scrollbarThumbHover}; }

  /* Firefox */
  * { scrollbar-width: auto; scrollbar-color: ${scrollbarThumb} ${scrollbarTrack}; }
  `;

  if (typeof document !== "undefined") {
    const style = document.createElement("style");
    style.setAttribute("data-estetica-scrollbar", "true");
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }
}

export function Screen({ children, style, scroll = false, contentContainerStyle }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  React.useEffect(() => {
    injectWebScrollbarCSS(
      theme.colors.scrollbarTrack,
      theme.colors.scrollbarThumb,
      theme.colors.scrollbarThumbHover
    );
  }, [theme]);

  const base: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingHorizontal: theme.spacing.md,
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
        // ✅ show indicator on web; keep hidden on native
        showsVerticalScrollIndicator={Platform.OS === "web"}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[base, style]}>{children}</View>;
}