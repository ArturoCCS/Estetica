import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { theme } from "../theme/theme";
import { Button } from "./Button";

type Props = {
  visible: boolean;
  title?: string;
  message: string;

  onClose?: () => void;

  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export function AppAlert({
  visible,
  title,
  message,
  onClose,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}: Props) {
  const isConfirm =
    typeof onConfirm === "function" &&
    typeof onCancel === "function";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose || onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {title && (
            <Text style={styles.title}>
              {title}
            </Text>
          )}

          <Text style={styles.message}>
            {message}
          </Text>

          <View style={styles.actions}>
            {isConfirm ? (
              <>
                <Button
                  title={cancelText}
                  variant="muted"
                  onPress={onCancel}
                />
                <Button
                  title={confirmText}
                  variant="danger"
                  onPress={onConfirm}
                />
              </>
            ) : (
              <Button
                title="OK"
                onPress={onClose ?? (() => {})}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  message: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
});
