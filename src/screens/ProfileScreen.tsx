import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { db } from "../lib/firebase";
import { useAuth } from "../providers/AuthProvider";
import { useTheme } from "../providers/ThemeProvider";

export function ProfileScreen() {
  const { user, isAdmin, logout } = useAuth();
  const { theme, mode, toggleTheme } = useTheme();
  const [cupons, setCupons] = useState<any[]>([]);

  useEffect(() => {
    // Guard: Don't attempt query until user is hydrated
    if (!user?.uid) return;

    const ref = collection(db, "users", user.uid, "coupons");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setCupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        console.error("ProfileScreen coupons snapshot error:", error);
        setCupons([]);
      }
    );
    return unsub;
  }, [user?.uid]);

  if (!user) return null;

  return (
    <Screen scroll>
      <View style={{ gap: theme.spacing.lg, paddingVertical: theme.spacing.lg }}>
        <Text style={{ 
          fontWeight: "800", 
          fontSize: 28, 
          color: theme.colors.text,
          marginBottom: theme.spacing.sm,
        }}>
          Perfil
        </Text>

        {/* Theme Toggle */}
        <View style={{
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}>
          <View style={{ 
            flexDirection: "row", 
            alignItems: "center", 
            justifyContent: "space-between" 
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Ionicons 
                name={mode === "dark" ? "moon" : "sunny"} 
                size={24} 
                color={theme.colors.accent} 
              />
              <View>
                <Text style={{ 
                  fontWeight: "700", 
                  fontSize: 16, 
                  color: theme.colors.text 
                }}>
                  Tema oscuro
                </Text>
                <Text style={{ 
                  fontSize: 13, 
                  color: theme.colors.textMuted,
                  marginTop: 2,
                }}>
                  {mode === "dark" ? "Activado" : "Desactivado"}
                </Text>
              </View>
            </View>
            <Switch
              value={mode === "dark"}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </View>

        {/* User Info */}
        <View style={{
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: theme.spacing.sm,
        }}>
          <View>
            <Text style={{ 
              fontWeight: "600", 
              fontSize: 13, 
              color: theme.colors.textMuted,
              marginBottom: 4,
            }}>
              Email
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: theme.colors.text,
              fontWeight: "500",
            }}>
              {user.email}
            </Text>
          </View>

          <View>
            <Text style={{ 
              fontWeight: "600", 
              fontSize: 13, 
              color: theme.colors.textMuted,
              marginBottom: 4,
            }}>
              Rol
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: theme.colors.text,
              fontWeight: "500",
            }}>
              {isAdmin ? "Admin" : "Usuario"}
            </Text>
          </View>
        </View>

        {/* Coupons */}
        <View style={{
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: theme.spacing.sm,
        }}>
          <Text style={{ 
            fontWeight: "700", 
            fontSize: 16, 
            color: theme.colors.text,
            marginBottom: 4,
          }}>
            Cupones activos
          </Text>
          
          {cupons.length === 0 ? (
            <Text style={{ color: theme.colors.textMuted }}>Sin cupones</Text>
          ) : (
            cupons.map(c => (
              <View 
                key={c.id}
                style={{
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.sm,
                  borderRadius: theme.radius.sm,
                }}
              >
                <Text style={{ 
                  color: theme.colors.success, 
                  fontWeight: "600",
                  fontSize: 15,
                }}>
                  {c.code || c.promoId} {c.redeemed ? "(usado)" : ""}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={logout}
          style={({ pressed }) => ({
            backgroundColor: theme.colors.error,
            padding: theme.spacing.md,
            borderRadius: theme.radius.md,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
            transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
          })}
        >
          <Text style={{ 
            color: theme.colors.surface, 
            fontWeight: "700",
            fontSize: 16,
          }}>
            Cerrar sesión
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}