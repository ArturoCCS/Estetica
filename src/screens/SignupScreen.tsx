import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Usaremos setDoc y doc para uid como ID
import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Button } from "../components/Button";
import { Screen } from "../components/Screen";
import { auth } from "../lib/auth";
import { db } from "../lib/firebase";
import { useTheme } from "../providers/ThemeProvider";

const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL;

export function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

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
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 25, gap: 16 }}>
        <Text style={{ 
          fontWeight: "800", 
          fontSize: 32, 
          marginBottom: 32, 
          color: theme.colors.text,
          textAlign: "center",
        }}>
          Crear cuenta
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
          title={loading ? "Registrando..." : "Registrarse"} 
          onPress={handleSignup} 
          disabled={loading} 
        />
        
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ 
            marginTop: 16, 
            textAlign: "center", 
            color: theme.colors.accent,
            fontWeight: "600",
          }}>
            ¿Ya tienes cuenta? Inicia sesión
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}