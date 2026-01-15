import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

export type GalleryImage = { id: string; imageUrl: string };

interface ImageLightboxProps {
  images: GalleryImage[];
  selectedIndex: number;
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({
  images,
  selectedIndex,
  isVisible,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const { width, height } = useWindowDimensions();
  const currentImage = images[selectedIndex];
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < images.length - 1;

  if (!currentImage) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>

        <Image
          source={{ uri: currentImage.imageUrl }}
          style={{
            width: width * 0.95,
            height: height * 0.85,
          }}
          resizeMode="contain"
        />

        {hasPrev && (
          <Pressable
            onPress={() => onNavigate(selectedIndex - 1)}
            style={[styles.navBtn, { left: 20, top: height / 2 - 20 }]}
            hitSlop={20}
          >
            <Ionicons name="chevron-back" size={32} color="#fff" />
          </Pressable>
        )}

        {hasNext && (
          <Pressable
            onPress={() => onNavigate(selectedIndex + 1)}
            style={[styles.navBtn, { right: 20, top: height / 2 - 20 }]}
            hitSlop={20}
          >
            <Ionicons name="chevron-forward" size={32} color="#fff" />
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.96)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "web" ? 30 : 60,
    right: 20,
    zIndex: 20,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 50,
  },
  navBtn: {
    position: "absolute",
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 50,
    zIndex: 10,
  },
});