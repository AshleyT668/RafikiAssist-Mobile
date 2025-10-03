// screens/CaregiverDashboard.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import BottomNavigation from "../components/BottomNavigation";

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
    <ImageBackground
      source={require("../assets/rafiki_background.png")} // replace with your image path
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go Back"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Profile photo at top right */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          style={styles.profilePhotoWrapper}
          accessibilityLabel="Profile settings"
        >
          <Image
            source={{
              uri: auth.currentUser?.photoURL || "https://i.pravatar.cc/100",
            }}
            style={styles.profilePhoto}
          />
        </TouchableOpacity>

        <Text style={styles.title}>Karibu Rafiki Caregiver</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Chatbot")}
        >
          <Text style={styles.buttonText}>Chat with Rafiki Bot</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("ManageSymbols")}
        >
          <Text style={styles.buttonText}>Manage Symbols</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#e57373" }]}
          onPress={handleSignOut}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Bottom Navigation */}
       
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingTop: 40,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)", // subtle dark overlay
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 40,
    left: 16,
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  profilePhotoWrapper: {
    position: "absolute",
    top: 40,
    right: 16,
    borderRadius: 30,
    overflow: "hidden",
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: "#3da49a",
  },
  profilePhoto: { width: "100%", height: "100%" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 100,
    marginBottom: 12,
    color: "#fff",
  },
  subtitle: { fontSize: 18, marginBottom: 20, color: "#fff" },
  button: {
    backgroundColor: "#3da49a",
    padding: 14,
    borderRadius: 8,
    marginVertical: 10,
    width: "80%",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
