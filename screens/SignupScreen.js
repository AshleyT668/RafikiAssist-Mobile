// screens/SignupScreen.js - REVAMPED UI (autism-friendly, modern, clean)
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
  ImageBackground, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, sendVerificationEmail } from "../firebaseConfig";
import { getErrorMessage } from "../utils";
import { ensureUserProfile } from "../services/userService";
import { useTheme } from "../context/ThemeContext";

// ── Design tokens (consistent across all screens) ───────────────
const COLORS = {
  bg: "#F4F8F7",
  card: "#FFFFFF",
  primary: "#4AADA3",
  primaryLight: "#E6F4F3",
  primaryDark: "#37877E",
  text: "#2C3E3D",
  textSoft: "#6B8280",
  textOnPrimary: "#FFFFFF",
  border: "#D6E8E6",
  borderFocus: "#4AADA3",
  shadow: "#2C3E3D",
  overlayBg: "rgba(244, 248, 247, 0.72)",
};

const RADIUS = { sm: 12, md: 16, lg: 20, full: 999 };
// ────────────────────────────────────────────────────────────────

export default function SignupScreen({ navigation }) {
  const { theme, isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailFocused, setEmailFocused]       = useState(false);
  const [passFocused, setPassFocused]         = useState(false);
  const [confirmFocused, setConfirmFocused]   = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Fade + slide-up animation ────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Signup handler (unchanged logic) ────────────────────────
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await ensureUserProfile(user, { authProvider: "password" });

      const emailSent = await sendVerificationEmail(user);

      if (emailSent) {
        await signOut(auth);
        Alert.alert(
          "Verify Your Email 📧",
          `We've sent a verification link to ${email}. Please check your inbox and verify your email before logging in.`,
          [{
            text: "Go to Login",
            onPress: () => navigation.reset({ index: 0, routes: [{ name: "Login" }] }),
          }]
        );
      } else {
        await signOut(auth);
        Alert.alert(
          "Account Created",
          "Your account was created but we couldn't send the verification email. Please contact support.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
      }
    } catch (error) {
      Alert.alert("Signup Failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // ── Dynamic card bg respects dark mode (from ThemeContext) ───
  const cardBg = isDark ? "rgba(30,30,30,0.96)" : COLORS.card;
  const inputBg = isDark ? "rgba(40,40,40,0.9)"  : COLORS.bg;
  const inputText  = isDark ? "#E8F4F3" : COLORS.text;
  const titleColor = isDark ? "#E8F4F3" : COLORS.text;
  const labelColor = isDark ? "#9BBFBB" : COLORS.textSoft;

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
          {/* Soft overlay */}
          <View style={[styles.overlay, { backgroundColor: isDark ? "rgba(20,30,29,0.78)" : COLORS.overlayBg }]} />

          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                backgroundColor: cardBg,
              },
            ]}
          >
            {/* Brand mark */}
            <View style={styles.logoRow}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🤝</Text>
              </View>
            </View>

            <Text style={[styles.title, { color: titleColor }]}>Create an Account</Text>
            <Text style={[styles.subtitle, { color: labelColor }]}>
              Join Rafiki Assist today
            </Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: labelColor }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  emailFocused && styles.inputFocused,
                  { backgroundColor: inputBg, color: inputText,
                    borderColor: emailFocused ? COLORS.borderFocus : (isDark ? "#3A5250" : COLORS.border) },
                ]}
                placeholder="your@email.com"
                placeholderTextColor={COLORS.textSoft}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: labelColor }]}>Password</Text>
              <View
                style={[
                  styles.inputRow,
                  passFocused && styles.inputFocused,
                  {
                    backgroundColor: inputBg,
                    borderColor: passFocused ? COLORS.borderFocus : (isDark ? "#3A5250" : COLORS.border),
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, styles.inputInsideRow, { color: inputText }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={COLORS.textSoft}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((visible) => !visible)}
                  style={styles.eyeButton}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  accessibilityRole="button"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={COLORS.textSoft}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: labelColor }]}>Confirm Password</Text>
              <View
                style={[
                  styles.inputRow,
                  confirmFocused && styles.inputFocused,
                  {
                    backgroundColor: inputBg,
                    borderColor: confirmFocused ? COLORS.borderFocus : (isDark ? "#3A5250" : COLORS.border),
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, styles.inputInsideRow, { color: inputText }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={COLORS.textSoft}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  onFocus={() => setConfirmFocused(true)}
                  onBlur={() => setConfirmFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((visible) => !visible)}
                  style={styles.eyeButton}
                  accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  accessibilityRole="button"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={COLORS.textSoft}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign up button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>
                {loading ? "Creating account…" : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {/* Login link */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              style={styles.linkRow}
              activeOpacity={0.7}
            >
              <Text style={[styles.linkText, { color: labelColor }]}>
                Already have an account?{" "}
                <Text style={styles.linkAccent}>Log In</Text>
              </Text>
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
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Card ──────────────────────────────────────────────────────
  card: {
    marginHorizontal: 20,
    borderRadius: RADIUS.lg,
    padding: 28,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },

  // ── Brand ─────────────────────────────────────────────────────
  logoRow: {
    alignItems: "center",
    marginBottom: 16,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: { fontSize: 30 },

  // ── Headings ──────────────────────────────────────────────────
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "400",
  },

  // ── Form fields ───────────────────────────────────────────────
  fieldGroup: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 15,
    minHeight: 50,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  inputInsideRow: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    minHeight: 0,
  },
  inputFocused: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  eyeButton: {
    paddingLeft: 8,
  },

  // ── Button ────────────────────────────────────────────────────
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    minHeight: 54,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: COLORS.textOnPrimary,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // ── Login link ────────────────────────────────────────────────
  linkRow: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
  },
  linkAccent: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
