import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { useAuth } from "../providers/AuthProvider";

import { AdminScreen } from "../screens/admin/AdminScreen";
import { BookingsScreen } from "../screens/BookingsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ServicesScreen } from "../screens/ServicesScreen";
import { MainTabsParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function TabNavigator() {
  const { user, isAdmin } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, focused }) => {
          let icon: any = "home-outline";

          if (route.name === "Inicio") icon = focused ? "home" : "home-outline";
          if (route.name === "Servicios") icon = focused ? "cut" : "cut-outline";
          if (route.name === "Agenda") icon = focused ? "calendar" : "calendar-outline";
          if (route.name === "Perfil") icon = focused ? "person" : "person-outline";
          if (route.name === "Login") icon = focused ? "log-in" : "log-in-outline";
          if (route.name === "Admin") icon = focused ? "construct" : "construct-outline";

          return <Ionicons name={icon} size={25} color={color} />;
        },
        tabBarActiveTintColor: "#DAB1B8",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#0A0A0A",
          paddingTop: 5,
          borderRadius: 999,
          height: 65,
          marginHorizontal: 15,
          marginBottom: 14,
          borderTopWidth: 0,
          elevation: 0,
          boxShadowOpacity: 0,
          position: 'absolute',
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Servicios" component={ServicesScreen} />
      <Tab.Screen name="Agenda" component={BookingsScreen} />

      {!user ? (
        <Tab.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Iniciar sesión" }}
        />
      ) : (
        <Tab.Screen
          name="Perfil"
          component={ProfileScreen}
          options={{ title: "Perfil" }}
        />
      )}

      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{ title: "Admin" }}
        />
      )}
    </Tab.Navigator>
  );
}