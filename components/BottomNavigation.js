// components/BottomNavigation.js
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function BottomNavigation() {
  const navigation = useNavigation();

  return (
    <View style={styles.navBar}>
      {/* Home → RoleSelection */}
      <TouchableOpacity
        onPress={() => navigation.navigate("RoleSelection")}
        accessibilityLabel="Home"
      >
        <Ionicons name="home-outline" size={28} color="#333" />
      </TouchableOpacity>

      {/* Chatbot */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Chatbot")}
        accessibilityLabel="Chatbot"
      >
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#333" />
      </TouchableOpacity>

      {/* TTS → ChildDashboard */}
      <TouchableOpacity
        onPress={() => navigation.navigate("ChildDashboard")}
        accessibilityLabel="TTS Module"
      >
        <Ionicons name="mic-outline" size={28} color="#333" />
      </TouchableOpacity>

      {/* Settings → Profile */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile")}
        accessibilityLabel="Settings"
      >
        <Ionicons name="settings-outline" size={28} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#f9f9f9",
  },
});
