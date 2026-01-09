import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Button } from "../components/Button";
import { Screen } from "../components/Screen";
import { auth } from "../lib/auth";
import { useTheme } from "../providers/ThemeProvider";

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Completa todos los campos");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Si tienes observer, aquí redirige automáticamente.
    } catch (e: any) {
      Alert.alert(
        "Error al iniciar sesión",
        `CODE: ${e.code}\nMSG: ${e?.message || "No se pudo iniciar sesión"}`
      );
      console.log("Login error:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 25, gap: 16 }}>
        <Text style={{ 
          fontWeight: "800", 
          fontSize: 32, 
          marginBottom: 32, 
          color: theme.colors.text,
          textAlign: "center",
        }}>
          Iniciar sesión
        </Text>
        
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={{ 
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            padding: 14,
            backgroundColor: theme.colors.card,
            color: theme.colors.text,
            fontSize: 16,
          }}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="email-address"
        />
        
        <TextInput
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ 
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            padding: 14,
            backgroundColor: theme.colors.card,
            color: theme.colors.text,
            fontSize: 16,
          }}
          placeholderTextColor={theme.colors.textMuted}
        />
        
        <Button 
          title={loading ? "Entrando..." : "Entrar"} 
          onPress={handleLogin} 
          disabled={loading} 
        />
        
        <Pressable onPress={() => navigation.navigate("Signup")}>
          <Text style={{ 
            marginTop: 16, 
            textAlign: "center", 
            color: theme.colors.accent,
            fontWeight: "600",
          }}>
            ¿No tienes cuenta? Regístrate
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}