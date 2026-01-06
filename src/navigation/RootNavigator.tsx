import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useAuth } from "../providers/AuthProvider";
import { AdminAppointmentsScreen } from "../screens/admin/AdminAppointmentsScreen";
import { AdminScreen } from "../screens/admin/AdminScreen";
import { CreateServiceScreen } from "../screens/admin/CreateServiceScreen";
import { EditServiceScreen } from "../screens/admin/EditServicesScreen";
import { GalleryAdminScreen } from "../screens/admin/GalleryAdminScreen";
import { PromosAdminScreen } from "../screens/admin/PromosAdminScreen";
import { ServicesAdminScreen } from "../screens/admin/ServicesAdminScreen";
import { SettingsAdminScreen } from "../screens/admin/SettingsAdminScreen";
import { BookServiceScreen } from "../screens/BookServiceScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { PromoRouletteScreen } from "../screens/PromoRouletteScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { TabNavigator } from "./TabNavigator";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="ServicesAdmin" component={ServicesAdminScreen} />
          <Stack.Screen name="CreateService" component={CreateServiceScreen} />
          <Stack.Screen name="EditService" component={EditServiceScreen} />
          <Stack.Screen name="PromosAdmin" component={PromosAdminScreen} />
          <Stack.Screen name="GalleryAdmin" component={GalleryAdminScreen} />
          <Stack.Screen name="PromoRoulette" component={PromoRouletteScreen} />
          <Stack.Screen name="BookService" component={BookServiceScreen} />
          <Stack.Screen name="AdminAppointments" component={AdminAppointmentsScreen} />
          {/* Registra SettingsAdmin en el Root Stack */}
          <Stack.Screen name="SettingsAdmin" component={SettingsAdminScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export { RootStackParamList };
