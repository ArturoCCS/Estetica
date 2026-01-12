import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Platform } from "react-native";
import { useAuth } from "../providers/AuthProvider";
import { AdminScreen } from "../screens/admin/AdminScreen";
import { BookingsScreen } from "../screens/BookingsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ServicesScreen } from "../screens/ServicesScreen";
import { MainTabsParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function TabNavigator() {
  const { isAdmin } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          if (route.name === "Home") iconName = focused ? "home" : "home-outline";
          if (route.name === "Services") iconName = focused ? "cut" : "cut-outline";
          if (route.name === "Bookings") iconName = focused ? "calendar" : "calendar-outline";
          if (route.name === "Profile") iconName = focused ? "person" : "person-outline";
          if (route.name === "Admin") iconName = focused ? "construct" : "construct-outline";
          return <Ionicons name={iconName} size={24} color={color} />;
        },

        tabBarActiveTintColor: "#DAB1B8",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 15,

          height: Platform.OS === "ios" ? 76 : 72,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 18 : 12,
          marginHorizontal: Platform.OS === "web" ? 0 : 17,

          borderRadius: 999,
          backgroundColor: "#0A0A0A",
          borderTopWidth: 0,

          shadowColor: "#000",
          shadowOpacity: 0.14,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        },

        // ✅ Texto más visible
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          lineHeight: 12,
          marginTop: 4,
        },

        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Services" component={ServicesScreen} options={{ title: "Servicios" }} />
      <Tab.Screen name="Bookings" component={BookingsScreen} options={{ title: "Turnos" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />
      {isAdmin ? <Tab.Screen name="Admin" component={AdminScreen} options={{ title: "Admin" }} /> : null}
    </Tab.Navigator>
  );
}