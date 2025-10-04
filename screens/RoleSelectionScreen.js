// screens/RoleSelectionScreen.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import BottomNavigation from "../components/BottomNavigation";

export default function RoleSelectionScreen({ navigation, setRole }) {
  return (
    <ImageBackground
      source={require("../assets/rafiki_background.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Rafiki Assist!</Text>
        <Text style={styles.subtitle}>Kindly select your role Rafiki</Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#3da49a" }]}
          onPress={() => {
            setRole("child");
            navigation.navigate("ChildDashboard");
          }}
        >
          <Text style={styles.buttonText}>I am a child</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#3da49a" }]}
          onPress={() => {
            setRole("caregiver");
            navigation.navigate("CaregiverDashboard");
          }}
        >
          <Text style={styles.buttonText}>I am a caregiver</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom nav included on role selection as well */}
      
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6, color: "#" },
  subtitle: { fontSize: 16, marginBottom: 24, color: "#333" },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
