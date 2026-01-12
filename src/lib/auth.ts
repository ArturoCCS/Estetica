import { getReactNativePersistence, indexedDBLocalPersistence, initializeAuth } from "firebase/auth";
import { Platform } from "react-native";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseApp } from "./firebase";

export const auth =
  Platform.OS === "web"
    ? initializeAuth(firebaseApp, { persistence: indexedDBLocalPersistence })
    : initializeAuth(firebaseApp, { persistence: getReactNativePersistence(ReactNativeAsyncStorage) });