import React, { ReactNode } from "react";
import { StyleSheet, Text, View, ViewProps } from "react-native";
import { theme } from "../theme/theme";

type CardProps = ViewProps & {
  children?: ReactNode;
};

export function Card({ style, children, ...props }: CardProps) {
  const wrapTextNodes = (node: ReactNode): ReactNode => {
    if (node === null || node === undefined) return null;
    if (typeof node === "string" || typeof node === "number") return <Text>{node}</Text>;
    if (Array.isArray(node)) return node.map((child, i) => <React.Fragment key={i}>{wrapTextNodes(child)}</React.Fragment>);
    return node;
  };

  return (
    <View {...props} style={[styles.card, style]}>
      {wrapTextNodes(children)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
});
