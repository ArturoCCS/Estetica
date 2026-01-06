import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthProvider";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
  });
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  // CRÍTICO: debe existir el projectId de EAS
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    undefined;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    (async () => {
      await ensureAndroidChannel();
      const token = await registerForPushNotificationsAsync();
      if (mounted && user && token) {
        await setDoc(
          doc(db, "users", user.uid),
          {
            expoPushToken: token,
            // opcional: asegura rol si ya sabes que este usuario es admin
            // role: "admin",
          },
          { merge: true }
        );
        console.log("Expo push token saved:", token);
      } else if (mounted && Platform.OS === "web") {
        console.warn("Web no genera token de expo-notifications.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  return <>{children}</>;
}