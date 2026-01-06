import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { Alert, Button, Pressable, Text, TextInput, View } from "react-native";
import { auth } from "../lib/auth";

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <View style={{ flex: 1, justifyContent: "center", padding: 25 }}>
      <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 18 }}>Iniciar sesión</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{ borderBottomWidth: 1, marginBottom: 16 }}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderBottomWidth: 1, marginBottom: 22 }}
      />
      <Button title={loading ? "Entrando..." : "Entrar"} onPress={handleLogin} disabled={loading} />
      <Pressable onPress={() => navigation.navigate("Signup")}>
        <Text style={{ marginTop: 16, textAlign: "center", color: "blue" }}>¿No tienes cuenta? Regístrate</Text>
      </Pressable>
    </View>
  );
}