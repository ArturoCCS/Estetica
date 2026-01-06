import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import "react-native-gesture-handler";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/providers/AuthProvider";
import { NotificationBadgeProvider } from "./src/providers/NotificationBadgeProvider";
import { NotificationsProvider } from "./src/providers/NotificationsProvider";
import { SettingsProvider } from "./src/providers/SettingsProvider";

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NotificationsProvider>
          <NotificationBadgeProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </NotificationBadgeProvider>
        </NotificationsProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}