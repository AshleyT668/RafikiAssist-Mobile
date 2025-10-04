// screens/SignupScreen.js
import React, { useState, useRef, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, 
  ImageBackground, Animated 
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getErrorMessage } from "../utils";

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Animation for fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Redirect handled by App.js auth listener
    } catch (error) {
      Alert.alert("Signup Failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : null} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground
          source={require("../assets/rafiki_background.png")}
          style={styles.background}
        >
          <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Text style={styles.title}>Create Rafiki Account</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? "Signing up..." : "Sign Up"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.link}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: "cover", justifyContent: "center" },
  container: { 
    backgroundColor: "rgba(255, 255, 255, 0.9)", 
    padding: 20, 
    margin: 20, 
    borderRadius: 16, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowRadius: 6, 
    elevation: 3 
  },
  title: { fontSize: 19, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: "#2b3d51" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 14, borderRadius: 10, marginBottom: 14, backgroundColor: "#fff" },
  button: { backgroundColor: "#c6cc0cb5", padding: 16, borderRadius: 10 },
  buttonText: { color: "#ffffffff", textAlign: "center", fontWeight: "bold", fontSize: 16 },
  link: { color: "#007BFF", textAlign: "center", marginTop: 14, fontSize: 14 }
});
