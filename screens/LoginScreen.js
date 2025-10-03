// screens/LoginScreen.js
import React, { useState, useRef, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, 
  ImageBackground, Animated 
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getErrorMessage } from "../utils";

export default function LoginScreen({ navigation }) {
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // navigation replaced by App.js listener to redirect
    } catch (error) {
      Alert.alert("Login Failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : null} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground
          source={require("../assets/rafiki_background.png")} // <- add a soft calming background image in assets
          style={styles.background}
        >
          <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Text style={styles.title}>Login to Rafiki Assist</Text>
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
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.link}>Don't have an account? Sign Up</Text>
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
  button: { backgroundColor: "#3da49a", padding: 16, borderRadius: 10 },
  buttonText: { color: "#ffffffff", textAlign: "center", fontWeight: "bold", fontSize: 16 },
  link: { color: "#007BFF", textAlign: "center", marginTop: 14, fontSize: 14 }
});
