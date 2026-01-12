/**
 * Custom persistence implementation for React Native using AsyncStorage
 * Based on Firebase Auth persistence interface
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const PERSISTENCE_KEY = "firebase:authUser";

// Match the Firebase Auth internal persistence structure
export const reactNativeAsyncStoragePersistence = {
  type: "LOCAL" as const,
  async _isAvailable(): Promise<boolean> {
    return true;
  },
  async _set(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`${PERSISTENCE_KEY}:${key}`, JSON.stringify(value));
    } catch (error) {
      console.error("Error setting persisted auth state:", error);
    }
  },
  async _get(key: string): Promise<any> {
    try {
      const item = await AsyncStorage.getItem(`${PERSISTENCE_KEY}:${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Error getting persisted auth state:", error);
      return null;
    }
  },
  async _remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${PERSISTENCE_KEY}:${key}`);
    } catch (error) {
      console.error("Error removing persisted auth state:", error);
    }
  },
  _addListener(_key: string, _listener: () => void): void {
    // Not implemented for React Native
  },
  _removeListener(_key: string, _listener: () => void): void {
    // Not implemented for React Native
  },
};

