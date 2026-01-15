import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AppAlert } from "../../components/AppAlert";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../providers/AuthProvider";
import { theme } from "../../theme/theme";

export function AdminScreen() {
  const navigation = useNavigation();
  const { user, isAdmin, loading, logout } = useAuth();

  const [alertVisible, setAlertVisible] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      setAlertVisible(true);
    }
  }, [loading, user, isAdmin]);

  const handleAlertClose = () => {
    setAlertVisible(false);
    navigation.reset({ index: 0, routes: [{ name: "Home" as never }] });
  };

  if (loading) {
    return (
      <Screen>
        <Text style={{ color: theme.colors.muted }}>Cargando…</Text>
      </Screen>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Screen>
        <Text style={{ color: theme.colors.muted }}>Redirigiendo…</Text>

        <AppAlert
          visible={alertVisible}
          title="Acceso denegado"
          message="No tienes permisos de administrador."
          onClose={handleAlertClose}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll style={{ gap: theme.spacing.md }}>
      <Card style={styles.card}>
        <Text style={styles.title}>Panel Administrador</Text>
        <Text style={styles.info}>Sesión: {user.email}</Text>
      </Card>

      <Button title="Crear servicio" onPress={() => navigation.navigate("CreateService" as never)} />
      <Button title="Ver/Editar servicios" onPress={() => navigation.navigate("ServicesAdmin" as never)} />
      <Button title="Administrar promociones" onPress={() => navigation.navigate("PromosAdmin" as never)} />
      <Button title="Administrar galería" onPress={() => navigation.navigate("GalleryAdmin" as never)} />
      <Button title="Configurar agenda" onPress={() => navigation.navigate("SettingsAdmin" as never)} />
      <Button title="Citas pendientes" onPress={() => navigation.navigate("AdminAppointments" as never)} />

      <Button
        title="Cerrar sesión"
        variant="secondary"
        onPress={logout}
        style={{ marginTop: 20 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.spacing.sm
  , marginTop: 50,
   },
  title: { fontSize: 22, fontWeight: "900", color: theme.colors.text },
  info: { color: theme.colors.muted },
});
