import { useRoute } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { Pressable, Text } from "react-native";

import { AppAlert } from "../components/AppAlert";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { auth } from "../lib/auth";
import { theme } from "../theme/theme";

export function LoginScreen({ navigation }: any) {
  const route = useRoute<any>();
  const redirectTo = route.params?.redirectTo;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ title?: string; msg: string } | null>(null);

  function showError(msg: string, title = "Error") {
    setAlert({ title, msg });
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      return showError("Ingresa tu correo y contraseña.");
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);

      if (redirectTo) {
        navigation.replace(redirectTo.name, redirectTo.params);
      } else {
        navigation.replace("Main");
      }
    } catch (e: any) {
      showError(
        e?.code === "auth/invalid-credential"
          ? "Correo o contraseña incorrectos."
          : e?.message || "No se pudo iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", padding: 20 }}>
      <Card style={{ gap: 14, marginTop: 50 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: theme.colors.text }}>
          Iniciar sesión
        </Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title={loading ? "Ingresando..." : "Entrar"}
          onPress={handleLogin}
          disabled={loading}
        />

        <Pressable onPress={() => navigation.navigate("Signup")}>
          <Text style={{ textAlign: "center", color: theme.colors.primary }}>
            ¿No tienes cuenta? Crear cuenta
          </Text>
        </Pressable>
      </Card>

      <AppAlert
        visible={!!alert}
        title={alert?.title}
        message={alert?.msg ?? ""}
        onClose={() => setAlert(null)}
      />
    </Screen>
  );
}
