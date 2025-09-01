// screens/CaregiverDashboard.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function CaregiverDashboard({ navigation }) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      alert("Failed to sign out.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Profile photo at top right */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile")}
        style={styles.profilePhotoWrapper}
        accessibilityLabel="Profile settings"
      >
        <Image
          source={{ uri: auth.currentUser?.photoURL || "https://i.pravatar.cc/100" }}
          style={styles.profilePhoto}
        />
      </TouchableOpacity>

      <Text style={styles.title}>Karibu Rafiki!</Text>
      <Text style={styles.subtitle}>Caregiver Dashboard</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Chatbot")}>
        <Text style={styles.buttonText}>Talk to Rafiki Chatbot</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ManageSymbols")}>
        <Text style={styles.buttonText}>Manage Symbols</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: "#e57373" }]} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, alignItems: "center", backgroundColor: "#f9f9f9" },
  profilePhotoWrapper: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 30,
    overflow: "hidden",
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: "#3da49a",
  },
  profilePhoto: { width: "100%", height: "100%" },
  title: { fontSize: 26, fontWeight: "bold", marginTop: 60, marginBottom: 12, color: "#333" },
  subtitle: { fontSize: 18, marginBottom: 20, color: "#555" },
  button: {
    backgroundColor: "#3da49a",
    padding: 14,
    borderRadius: 8,
    marginVertical: 10,
    width: "80%",
  },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 16 },
});
