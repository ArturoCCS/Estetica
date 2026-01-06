import { indexedDBLocalPersistence, initializeAuth, inMemoryPersistence } from "firebase/auth";
import { Platform } from "react-native";
import { firebaseApp } from "./firebase";

export const auth =
  Platform.OS === "web"
    ? initializeAuth(firebaseApp, { persistence: indexedDBLocalPersistence })
    : initializeAuth(firebaseApp, { persistence: inMemoryPersistence });