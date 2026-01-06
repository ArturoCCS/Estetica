import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Usaremos setDoc y doc para uid como ID
import React, { useState } from "react";
import { Alert, Button, Pressable, Text, TextInput, View } from "react-native";
import { auth } from "../lib/auth";
import { db } from "../lib/firebase";

const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL;

export function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !password) {
      Alert.alert("Completa todos los campos");
      return;
    }
    if (password.length < 6) {
      Alert.alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (ADMIN_EMAIL && email.trim() === ADMIN_EMAIL) {
      Alert.alert("Ese correo está reservado para administrador");
      return;
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Aquí agregamos el usuario a la colección users, usando su uid como ID
      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        email: email.trim(),
        createdAt: new Date().toISOString(),
        coupons: [] // Puedes poner otros campos personalizados que necesites
      });
      Alert.alert("¡Registro exitoso!", "Ya puedes iniciar sesión.");
      navigation.goBack();
    } catch (authError: any) {
      Alert.alert(
        "Error en el registro",
        authError?.message || "No se pudo crear el usuario"
      );
      console.log("Registro error:", authError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 25 }}>
      <Text style={{ fontWeight: "bold", fontSize: 20, marginBottom: 18 }}>Crear cuenta</Text>
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
      <Button title={loading ? "Registrando..." : "Registrarse"} onPress={handleSignup} disabled={loading} />
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={{ marginTop: 16, textAlign: "center", color: "blue" }}>¿Ya tienes cuenta? Inicia sesión</Text>
      </Pressable>
    </View>
  );
}