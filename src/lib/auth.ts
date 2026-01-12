import { indexedDBLocalPersistence, initializeAuth } from "firebase/auth";
import { Platform } from "react-native";
import { firebaseApp } from "./firebase";
import { reactNativeAsyncStoragePersistence } from "./reactNativePersistence";

export const auth =
  Platform.OS === "web"
    ? initializeAuth(firebaseApp, { persistence: indexedDBLocalPersistence })
    : initializeAuth(firebaseApp, { persistence: reactNativeAsyncStoragePersistence });