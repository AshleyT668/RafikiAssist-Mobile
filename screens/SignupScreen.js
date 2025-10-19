// screens/SignupScreen.js
import React, { useState, useRef, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, 
  ImageBackground, Animated 
} from "react-native";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, sendVerificationEmail } from "../firebaseConfig";
import { getErrorMessage } from "../utils";

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Send verification email
      const emailSent = await sendVerificationEmail(user);
      
      if (emailSent) {
        // SIGN OUT THE USER IMMEDIATELY after sending verification
        await signOut(auth);
        
        Alert.alert(
          "Verify Your Email 📧", 
          `We've sent a verification link to ${email}. Please check your inbox and verify your email before logging in.`,
          [
            { 
              text: "Go to Login", 
              onPress: () => {
                // Force navigation to Login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      } else {
        // If email failed to send, still sign out but show warning
        await signOut(auth);
        Alert.alert(
          "Account Created",
          "Your account was created but we couldn't send the verification email. Please contact support.",
          [{ 
            text: "OK", 
            onPress: () => navigation.navigate("Login") 
          }]
        );
      }
    } catch (error) {
      Alert.alert("Signup Failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
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
              placeholder="Password (min. 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.6 }]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Signing up..." : "Sign Up"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => navigation.navigate("Login")}
              style={styles.linkContainer}
            >
              <Text style={styles.link}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: { 
    flex: 1, 
    resizeMode: "cover", 
    justifyContent: "center" 
  },
  container: { 
    backgroundColor: "rgba(255, 255, 255, 0.95)", 
    padding: 24, 
    margin: 20, 
    borderRadius: 16, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 2 },
    elevation: 4 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 24, 
    textAlign: "center", 
    color: "#2b3d51" 
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#ddd", 
    padding: 16, 
    borderRadius: 10, 
    marginBottom: 16, 
    backgroundColor: "#fff",
    fontSize: 16
  },
  button: { 
    backgroundColor: "#3da49a", 
    padding: 16, 
    borderRadius: 10,
    marginTop: 8
  },
  buttonText: { 
    color: "#fff", 
    textAlign: "center", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  linkContainer: {
    marginTop: 20,
    alignItems: "center"
  },
  link: { 
    color: "#3da49a", 
    textAlign: "center", 
    fontSize: 15,
    fontWeight: "500"
  }
});
