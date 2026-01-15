import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Pressable, Text } from "react-native";

import { AppAlert } from "../components/AppAlert";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { auth } from "../lib/auth";
import { db } from "../lib/firebase";
import { theme } from "../theme/theme";

const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL;

export function SignupScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<{ title?: string; msg: string } | null>(null);

  function showError(msg: string, title = "Error") {
    setAlert({ title, msg });
  }

  async function handleSignup() {
    if (!name.trim() || !phone.trim() || !email.trim() || !password) {
      return showError("Completa todos los campos.");
    }

    if (password.length < 6) {
      return showError("La contraseña debe tener al menos 6 caracteres.");
    }

    if (ADMIN_EMAIL && email.trim() === ADMIN_EMAIL) {
      return showError("Ese correo está reservado.");
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
        coupons: [],
      });

      setAlert({
        title: "Registro exitoso",
        msg: "Ya puedes iniciar sesión.",
      });
    } catch (e: any) {
      showError(e?.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentContainerStyle={{ justifyContent: "center", padding: 20 }}>
      <Card style={{ gap: 14, marginTop: 50  }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: theme.colors.text }}>
          Crear cuenta
        </Text>

        <TextField label="Nombre completo" value={name} onChangeText={setName} />
        <TextField
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Ej. 5512345678"
        />
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
          title={loading ? "Registrando..." : "Crear cuenta"}
          onPress={handleSignup}
          disabled={loading}
        />

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ textAlign: "center", color: theme.colors.primary }}>
            ¿Ya tienes cuenta? Inicia sesión
          </Text>
        </Pressable>
      </Card>

      <AppAlert
        visible={!!alert}
        title={alert?.title}
        message={alert?.msg ?? ""}
        onClose={() => {
          setAlert(null);
          if (alert?.title === "Registro exitoso") navigation.goBack();
        }}
      />
    </Screen>
  );
}
