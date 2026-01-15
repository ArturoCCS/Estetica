import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { AboutScreen } from "../screens/AboutScreen";
import { AdminAppointmentsScreen } from "../screens/admin/AdminAppointmentsScreen";
import { AdminScreen } from "../screens/admin/AdminScreen";
import { CreateServiceScreen } from "../screens/admin/CreateServiceScreen";
import { EditServiceScreen } from "../screens/admin/EditServicesScreen";
import { GalleryAdminScreen } from "../screens/admin/GalleryAdminScreen";
import { PromosAdminScreen } from "../screens/admin/PromosAdminScreen";
import { ServicesAdminScreen } from "../screens/admin/ServicesAdminScreen";
import { SettingsAdminScreen } from "../screens/admin/SettingsAdminScreen";
import { AppointmentDetailScreen } from "../screens/AppointmentDetailScreen";
import { BookServiceScreen } from "../screens/BookServiceScreen";
import { CalendarScreen } from "../screens/CalendarScreen";
import { LoginScreen } from "../screens/LoginScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import { PromoRouletteScreen } from "../screens/PromoRouletteScreen";
import { ServiceDetailScreen } from "../screens/ServiceDetailScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { TabNavigator } from "./TabNavigator";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="BookService" component={BookServiceScreen} />
      <Stack.Screen name="PromoRoulette" component={PromoRouletteScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="ServicesAdmin" component={ServicesAdminScreen} />
      <Stack.Screen name="CreateService" component={CreateServiceScreen} />
      <Stack.Screen name="EditService" component={EditServiceScreen} />
      <Stack.Screen name="PromosAdmin" component={PromosAdminScreen} />
      <Stack.Screen name="GalleryAdmin" component={GalleryAdminScreen} />
      <Stack.Screen name="AdminAppointments" component={AdminAppointmentsScreen} />
      <Stack.Screen name="SettingsAdmin" component={SettingsAdminScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}