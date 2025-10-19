// screens/LoginScreen.js - FIXED NAVIGATION
import React, { useState, useRef, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, 
  ImageBackground, Animated, Modal,
  ActivityIndicator
} from "react-native";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, is2FAEnabled, verifyTOTPLogin } from "../firebaseConfig";
import { getErrorMessage } from "../utils";

export default function LoginScreen({ navigation, route, on2FASuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTOTPModal, setShowTOTPModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState("");

  // Check for message from signup screen
  useEffect(() => {
    if (route.params?.message) {
      Alert.alert("Email Verification Required", route.params.message);
      navigation.setParams({ message: undefined });
    }
  }, [route.params]);

  // Animation for fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleTOTPVerification = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setTotpError("Please enter a 6-digit code from Google Authenticator");
      return;
    }

    setTotpLoading(true);
    setTotpError("");
    try {
      console.log('🔄 Verifying TOTP code for login...');
      await verifyTOTPLogin(tempUser, totpCode);
      
      console.log('✅ TOTP verification successful!');
      
      // Call the success callback to update App.js state
      if (on2FASuccess) {
        on2FASuccess();
      }
      
      Alert.alert("Success", "Login successful!");
      
      // Reset all states
      setShowTOTPModal(false);
      setTotpCode("");
      setTotpError("");
      setTempUser(null);
      
      console.log('✅ TOTP completed - App will automatically show main app');
      
    } catch (error) {
      console.error('❌ TOTP verification failed:', error);
      setTotpError(error.message || "Invalid code. Please try again.");
      setTotpCode("");
    } finally {
      setTotpLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      console.log('🚀 Starting login process...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Basic login successful:', user.email);
      
      // CHECK IF EMAIL IS VERIFIED
      if (!user.emailVerified) {
        console.log('📧 Email not verified, showing alert...');
        Alert.alert(
          "Email Not Verified ❗",
          "Please verify your email address before logging in. Check your inbox for the verification link.",
          [
            { text: "OK" },
            { 
              text: "Resend Verification", 
              onPress: async () => {
                try {
                  await sendEmailVerification(user);
                  Alert.alert("Success", "Verification email sent! Please check your inbox.");
                } catch (error) {
                  Alert.alert("Error", "Failed to send verification email.");
                }
              } 
            }
          ]
        );
        await auth.signOut();
        setLoading(false);
        return;
      }
      
      // ✅ CHECK IF 2FA IS ENABLED FOR THIS USER
      console.log('🔐 Checking if 2FA is enabled for:', user.email);
      const is2FARequired = await is2FAEnabled(user);
      console.log('🔐 2FA Check Result:', is2FARequired);
      
      if (is2FARequired) {
        console.log('🎯 2FA IS ENABLED - Showing TOTP modal');
        setTempUser(user);
        setShowTOTPModal(true);
        setLoading(false);
        return;
      } else {
        console.log('🔓 No 2FA required - proceeding to main app');
        // No 2FA required - App.js will automatically show main app
      }
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      Alert.alert("Login Failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTOTPModal = async () => {
    console.log('❌ Closing TOTP modal, signing out...');
    setShowTOTPModal(false);
    setTotpCode("");
    setTotpError("");
    if (tempUser) {
      await auth.signOut();
      setTempUser(null);
    }
  };

  const handleUseBackupCode = () => {
    Alert.alert(
      "Backup Code",
      "Backup code feature coming soon!",
      [{ text: "OK" }]
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground
          source={require("../assets/rafiki_background.png")}
          style={styles.background}
        >
          <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Text style={styles.title}>Login to Rafiki Assist</Text>
            
            {/* Regular login form */}
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
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.link}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* TOTP Modal */}
          <Modal
            visible={showTOTPModal}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCloseTOTPModal}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Two-Factor Authentication Required</Text>
                <Text style={styles.modalSubtitle}>
                  Open Google Authenticator and enter the 6-digit code to continue
                </Text>
                
                <View style={styles.authenticatorInfo}>
                  <Text style={styles.infoText}>📱 Open Google Authenticator app</Text>
                  <Text style={styles.infoText}>🔢 Find "Rafiki Assist" account</Text>
                  <Text style={styles.infoText}>⌨️ Enter the 6-digit code below</Text>
                  <Text style={[styles.infoText, styles.autoSubmitInfo]}>
                    ✅ Press "Done" on keyboard when finished
                  </Text>
                </View>
                
                <TextInput
                  style={[
                    styles.totpInput,
                    totpError ? styles.inputError : null
                  ]}
                  placeholder="000000"
                  value={totpCode}
                  onChangeText={(text) => {
                    // Only allow numbers and limit to 6 digits
                    const numbersOnly = text.replace(/[^0-9]/g, '');
                    setTotpCode(numbersOnly.slice(0, 6));
                    setTotpError("");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  textAlign="center"
                  returnKeyType="done"
                  onSubmitEditing={handleTOTPVerification}
                  blurOnSubmit={true}
                />
                
                {totpError ? (
                  <Text style={styles.errorText}>{totpError}</Text>
                ) : null}
                
                <TouchableOpacity
                  style={[
                    styles.button, 
                    totpLoading && styles.buttonDisabled,
                    styles.verifyButton
                  ]}
                  onPress={handleTOTPVerification}
                  disabled={totpLoading}
                >
                  {totpLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Continue</Text>
                  )}
                </TouchableOpacity>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.textButton}
                    onPress={handleUseBackupCode}
                  >
                    <Text style={styles.textButtonText}>Use Backup Code</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.textButton}
                    onPress={handleCloseTOTPModal}
                  >
                    <Text style={[styles.textButtonText, styles.cancelText]}>Cancel Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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
    marginBottom: 12
  },
  verifyButton: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { 
    color: "#fff", 
    textAlign: "center", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  textButton: {
    padding: 12,
    alignItems: "center",
  },
  textButtonText: {
    color: "#3da49a",
    fontSize: 14,
    fontWeight: "500",
  },
  cancelText: {
    color: "#666",
  },
  link: { 
    color: "#3da49a", 
    textAlign: "center", 
    marginTop: 16, 
    fontSize: 14,
    fontWeight: "500"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#2b3d51"
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
    lineHeight: 20
  },
  authenticatorInfo: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#0369a1',
    marginBottom: 6,
  },
  autoSubmitInfo: {
    fontWeight: '600',
    color: '#059669',
  },
  totpInput: {
    borderWidth: 2,
    borderColor: "#3da49a",
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 8,
    textAlign: 'center'
  },
  inputError: {
    borderColor: "#e53935",
    backgroundColor: "#ffebee",
  },
  errorText: {
    color: "#e53935",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  modalActions: {
    marginTop: 8,
    alignItems: "center",
  },
});
