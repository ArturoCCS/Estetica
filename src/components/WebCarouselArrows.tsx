import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

type Props = {
  onPrevious: () => void;
  onNext: () => void;
  showPrevious?: boolean;
  showNext?: boolean;
};

export function WebCarouselArrows({ onPrevious, onNext, showPrevious = true, showNext = true }: Props) {
  // Only render on web
  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <>
      {showPrevious && (
        <Pressable
          onPress={onPrevious}
          style={[styles.arrowButton, styles.leftArrow]}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
      )}
      {showNext && (
        <Pressable
          onPress={onNext}
          style={[styles.arrowButton, styles.rightArrow]}
        >
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  arrowButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    // @ts-ignore - web-only properties
    cursor: "pointer",
    backdropFilter: "blur(8px)",
  } as any,
  leftArrow: {
    left: 12,
  },
  rightArrow: {
    right: 12,
  },
});
