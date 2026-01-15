import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../components/Button";
import { db } from "../lib/firebase";
import { useAuth } from "../providers/AuthProvider";
import { UserProfile } from "../types/domain";

export function ProfileScreen() {
  const { user, isAdmin, logout } = useAuth();
  const [cupons, setCupons] = useState<any[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const ref = collection(db, "users", user.uid, "coupons");
      const unsub = onSnapshot(ref, snap => {
        setCupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return unsub;
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const unsub = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setProfile(data);
          setEditName(data.name || "");
          setEditPhone(data.phone || "");
        }
        setLoading(false);
      });
      return unsub;
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditName(profile?.name || "");
    setEditPhone(profile?.phone || "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    if (!editName.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      setIsEditing(false);
      Alert.alert("Éxito", "Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#DAB1B8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.title}>Mi Perfil</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Nombre</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Tu nombre"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <Text style={styles.value}>{profile?.name || "Sin nombre"}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Teléfono</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Tu teléfono"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{profile?.phone || "Sin teléfono"}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Correo electrónico</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          {isAdmin && (
            <View style={[styles.infoRow, styles.adminBadge]}>
              <Text style={styles.adminText}>Administrador</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {isEditing ? (
            <View style={styles.editButtons}>
              <View style={styles.buttonHalf}>
                <Button 
                  title="Cancelar" 
                  onPress={handleCancel} 
                  variant="muted"
                  disabled={saving}
                />
              </View>
              <View style={styles.buttonHalf}>
                <Button 
                  title="Guardar" 
                  onPress={handleSave} 
                  variant="primary"
                  loading={saving}
                />
              </View>
            </View>
          ) : (
            <>
              <Button 
                title="Editar perfil" 
                onPress={handleEdit} 
                variant="primary"
                style={styles.editButton}
              />
              <Button 
                title="Cerrar sesión" 
                onPress={logout} 
                variant="secondary"
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
    
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 130,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DAB1B8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    elevation: 2,
  },
  infoRow: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  input: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#dadadc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FAFAFA",
  },
  adminBadge: {
    marginTop: 4,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    alignItems: "flex-start",
  },
  adminText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DAB1B8",
    backgroundColor: "#FAF5F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonContainer: {
    marginTop: 32,
  },
  editButton: {
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: "row",
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
  },
});