import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import "react-native-gesture-handler";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/providers/AuthProvider";
import { NotificationsProvider } from "./src/providers/NotificationsProvider";
import { SettingsProvider } from "./src/providers/SettingsProvider";

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NotificationsProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
        </NotificationsProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}