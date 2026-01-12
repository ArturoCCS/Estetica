import React from "react";
import { Platform, ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

let injectedWebScrollbarCSS = false;

function injectWebScrollbarCSS() {
  if (Platform.OS !== "web") return;
  if (injectedWebScrollbarCSS) return;
  injectedWebScrollbarCSS = true;
  const css = `
  /* Web scrollbar - más visible y limpio */
  ::-webkit-scrollbar { width: 18px; height: 14px; }
  ::-webkit-scrollbar-track { background: rgba(0,0,0,0.03); }
  ::-webkit-scrollbar-thumb {
    background: rgba(17, 24, 39, 0.30);
    border-radius: 999px;
    border: 4px solid rgba(0,0,0,0.03);
    background-clip: padding-box;
  }
  ::-webkit-scrollbar-thumb:hover { background: rgba(17, 24, 39, 0.42); }

  /* Firefox */
  * { scrollbar-width: auto; scrollbar-color: rgba(17,24,39,0.35) rgba(0,0,0,0.03); }
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

  React.useEffect(() => {
    injectWebScrollbarCSS();
  }, []);

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