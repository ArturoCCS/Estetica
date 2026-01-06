import type { ExpoConfig } from "expo/config";
import appJson from "./app.json";

export default (): ExpoConfig => {
  console.log("USING app.config.ts", {
    hasApiKey: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY
  });

  const expo = appJson.expo as unknown as ExpoConfig;

  return {
    ...expo,
    extra: {
      ...(expo.extra ?? {}),
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXO_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
      }
    }
  };
};