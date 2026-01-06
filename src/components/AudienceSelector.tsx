import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export function AudienceSelector({
  audienceFields,
  userList,
  removeUser,
  clearAll
}: {
  audienceFields: { id: string; value: string }[];
  userList: { uid: string; email?: string; displayName?: string }[];
  removeUser: (idx: number) => void;
  clearAll: () => void;
}) {
  if (!audienceFields.length) return null;
  return (
    <ScrollView horizontal contentContainerStyle={{ gap: 7, paddingHorizontal: 2 }}>
      {audienceFields.map((u, idx) => {
        const userObj = userList.find(x => x.uid === u.value);
        return (
          <View key={u.id} style={{
            backgroundColor: "#E1EAFE",
            borderRadius: 14,
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 3,
            paddingHorizontal: 7,
            marginBottom: 2,
            marginRight: 3
          }}>
            <Text>{userObj?.displayName || userObj?.email || u.value}</Text>
            <TouchableOpacity style={{
              backgroundColor: "#DC143C",
              width: 16, height: 16, borderRadius: 8,
              alignItems: "center", justifyContent: "center", marginLeft: 4
            }} onPress={() => removeUser(idx)}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>×</Text>
            </TouchableOpacity>
          </View>
        );
      })}
      <TouchableOpacity style={{
        backgroundColor: "#FA4376",
        borderRadius: 14,
        paddingHorizontal: 11, justifyContent: "center", marginLeft: 5
      }} onPress={clearAll}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Eliminar todos</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}