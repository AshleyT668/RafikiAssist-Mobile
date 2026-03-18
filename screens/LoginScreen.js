// screens/LoginScreen.js - REVAMPED UI (autism-friendly, modern, clean)
import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
  ImageBackground, Animated, Modal,
  ActivityIndicator
} from "react-native";
import * as AuthSession from "expo-auth-session";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, is2FAEnabled, verifyTOTPLogin } from "../firebaseConfig";
import { getErrorMessage } from "../utils";
import { ensureUserProfile } from "../services/userService";
import { useTheme } from "../context/ThemeContext";
import {
  createGoogleAuthRequestConfig,
  googleDiscovery,
  hasGoogleAuthConfig,
  promptGoogleSignIn,
} from "../services/googleAuthService";
import { Ionicons } from "@expo/vector-icons";

// ── Design tokens ──────────────────────────────────────────────
const COLORS = {
  bg: "#F4F8F7",           // soft sage-white — calming, never harsh
  card: "#FFFFFF",
  primary: "#4AADA3",      // muted teal — warm, non-aggressive
  primaryDark: "#37877E",
  primaryLight: "#E6F4F3",
  text: "#2C3E3D",         // near-black with warmth
  textSoft: "#6B8280",
  border: "#D6E8E6",
  borderFocus: "#4AADA3",
  error: "#C0544C",
  errorBg: "#FDF0EF",
  infoBg: "#EBF5F4",
  infoText: "#2E7B74",
  white: "#FFFFFF",
  shadow: "#2C3E3D",
  disabledOpacity: 0.5,
};

const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  full: 999,
};

const FONT = {
  title: { fontSize: 26, fontWeight: "700", letterSpacing: 0.2 },
  subtitle: { fontSize: 15, fontWeight: "400", lineHeight: 22 },
  label: { fontSize: 14, fontWeight: "600", letterSpacing: 0.3 },
  body: { fontSize: 16, fontWeight: "400" },
  button: { fontSize: 17, fontWeight: "700", letterSpacing: 0.4 },
  link: { fontSize: 15, fontWeight: "600" },
  code: { fontSize: 22, fontWeight: "700", letterSpacing: 10 },
  info: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
};
// ───────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation, route, on2FASuccess }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTOTPModal, setShowTOTPModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled] = useState(hasGoogleAuthConfig());
  const [googleRequest, , promptGoogleAsync] = AuthSession.useAuthRequest(
    createGoogleAuthRequestConfig(),
    googleDiscovery
  );

  // ── Check for message from signup screen ──────────────────────
  useEffect(() => {
    if (route.params?.message) {
      Alert.alert("Email Verification Required", route.params.message);
      navigation.setParams({ message: undefined });
    }
  }, [route.params]);

  // ── Fade-in animation ─────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Handlers (unchanged logic) ────────────────────────────────
  const handleTOTPVerification = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setTotpError("Please enter a 6-digit code from Google Authenticator");
      return;
    }
    setTotpLoading(true);
    setTotpError("");
    try {
      await verifyTOTPLogin(tempUser, totpCode);
      if (on2FASuccess) on2FASuccess();
      Alert.alert("Success", "Login successful!");
      setShowTOTPModal(false);
      setTotpCode("");
      setTotpError("");
      setTempUser(null);
    } catch (error) {
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await ensureUserProfile(user, { authProvider: "password" });

      if (!user.emailVerified) {
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
              },
            },
          ]
        );
        await auth.signOut();
        setLoading(false);
        return;
      }

      const is2FARequired = await is2FAEnabled(user);
      if (is2FARequired) {
        setTempUser(user);
        setShowTOTPModal(true);
        setLoading(false);
        return;
      }
    } catch (error) {
      Alert.alert("Login Failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleEnabled) {
      Alert.alert(
        "Google Sign-In Not Configured",
        "Add your Google OAuth client IDs in app.json before using Google sign-in."
      );
      return;
    }

    setGoogleLoading(true);
    try {
      await promptGoogleSignIn(promptGoogleAsync);
    } catch (error) {
      Alert.alert("Google Sign-In Failed", getErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCloseTOTPModal = async () => {
    setShowTOTPModal(false);
    setTotpCode("");
    setTotpError("");
    if (tempUser) {
      await auth.signOut();
      setTempUser(null);
    }
  };

  const handleUseBackupCode = () => {
    Alert.alert("Backup Code", "Backup code feature coming soon!", [{ text: "OK" }]);
  };

  // ── Render ────────────────────────────────────────────────────
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
          {/* Soft overlay for readability */}
          <View style={[styles.overlay, { backgroundColor: theme.overlay }]} />

          <Animated.View
            style={[
              styles.card,
              { backgroundColor: theme.card, shadowColor: theme.shadow },
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Logo / brand mark */}
            <View style={styles.logoRow}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🤝</Text>
              </View>
            </View>

            <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>Sign in to Rafiki Assist</Text>

            {/* Email input */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  emailFocused && styles.inputFocused,
                  { borderColor: emailFocused ? theme.primary : theme.border, backgroundColor: theme.inputBackground, color: theme.text, shadowColor: theme.primary },
                ]}
                placeholder="your@email.com"
                placeholderTextColor={theme.subtext}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoFocus
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Password input */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Password</Text>
              <View
                style={[
                  styles.inputRow,
                  passwordFocused && styles.inputFocused,
                  {
                    borderColor: passwordFocused ? theme.primary : theme.border,
                    backgroundColor: theme.inputBackground,
                    shadowColor: theme.primary,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, styles.inputInsideRow, { color: theme.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.subtext}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
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
                    color={theme.subtext}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.googleButton,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                },
                (googleLoading || !googleRequest) && styles.buttonDisabled,
              ]}
              onPress={handleGoogleLogin}
              disabled={googleLoading || !googleRequest}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <Text style={[styles.googleButtonText, { color: theme.text }]}>Continue with Google</Text>
              )}
            </TouchableOpacity>

            {/* Sign-up link */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Signup")}
              style={styles.linkRow}
              activeOpacity={0.7}
            >
              <Text style={[styles.linkText, { color: theme.subtext }]}>
                Don't have an account?{" "}
                <Text style={[styles.linkAccent, { color: theme.primary }]}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── TOTP Modal ──────────────────────────────────────── */}
          <Modal
            visible={showTOTPModal}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCloseTOTPModal}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>

                {/* Icon header */}
                <View style={styles.modalIconWrap}>
                  <Text style={styles.modalIcon}>🔐</Text>
                </View>

                <Text style={styles.modalTitle}>Two-Step Verification</Text>
                <Text style={styles.modalSubtitle}>
                  Open Google Authenticator and enter the 6-digit code for Rafiki Assist
                </Text>

                {/* Steps */}
                <View style={styles.stepsBox}>
                  {[
                    { icon: "📱", text: "Open Google Authenticator" },
                    { icon: "🔎", text: "Find \"Rafiki Assist\" account" },
                    { icon: "⌨️", text: "Enter the 6-digit code below" },
                  ].map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <Text style={styles.stepIcon}>{step.icon}</Text>
                      <Text style={styles.stepText}>{step.text}</Text>
                    </View>
                  ))}
                </View>

                {/* Code input */}
                <TextInput
                  style={[
                    styles.totpInput,
                    totpError ? styles.totpInputError : null,
                  ]}
                  placeholder="— — — — — —"
                  placeholderTextColor={COLORS.textSoft}
                  value={totpCode}
                  onChangeText={(text) => {
                    const numbersOnly = text.replace(/[^0-9]/g, "");
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
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{totpError}</Text>
                  </View>
                ) : null}

                {/* Verify button */}
                <TouchableOpacity
                  style={[styles.button, totpLoading && styles.buttonDisabled, { marginTop: 4 }]}
                  onPress={handleTOTPVerification}
                  disabled={totpLoading}
                  activeOpacity={0.85}
                >
                  {totpLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Continue</Text>
                  )}
                </TouchableOpacity>

                {/* Secondary actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.ghostButton}
                    onPress={handleUseBackupCode}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.ghostButtonText}>Use Backup Code</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.ghostButton}
                    onPress={handleCloseTOTPModal}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.ghostButtonText, styles.cancelText]}>
                      Cancel Login
                    </Text>
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
  // ── Layout ───────────────────────────────────────────────────
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(244, 248, 247, 0.72)",
  },

  // ── Login card ────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.card,
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
  logoEmoji: {
    fontSize: 30,
  },

  // ── Headings ──────────────────────────────────────────────────
  title: {
    ...FONT.title,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    ...FONT.subtitle,
    color: COLORS.textSoft,
    textAlign: "center",
    marginBottom: 28,
  },

  // ── Form fields ───────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    ...FONT.label,
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...FONT.body,
    color: COLORS.text,
    minHeight: 52, // large tap target
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
    minHeight: 52,
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

  // ── Primary button ────────────────────────────────────────────
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    minHeight: 56, // large tap target
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: COLORS.disabledOpacity,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    ...FONT.button,
    color: COLORS.white,
  },

  // ── Sign-up link ──────────────────────────────────────────────
  linkRow: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    ...FONT.link,
    color: COLORS.textSoft,
  },
  linkAccent: {
    color: COLORS.primary,
  },

  // ── Modal overlay ─────────────────────────────────────────────
  googleButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  googleButtonText: {
    ...FONT.button,
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(44, 62, 61, 0.55)",
    justifyContent: "flex-end", // sheet slides up from bottom — predictable
    padding: 0,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },

  // Handle bar
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 20,
  },

  // ── Modal header ──────────────────────────────────────────────
  modalIconWrap: {
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  modalIcon: {
    fontSize: 28,
  },
  modalTitle: {
    ...FONT.title,
    fontSize: 20,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 6,
  },
  modalSubtitle: {
    ...FONT.subtitle,
    color: COLORS.textSoft,
    textAlign: "center",
    marginBottom: 20,
  },

  // ── Steps box ─────────────────────────────────────────────────
  stepsBox: {
    backgroundColor: COLORS.infoBg,
    borderRadius: RADIUS.sm,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepIcon: {
    fontSize: 18,
    width: 28,
    textAlign: "center",
  },
  stepText: {
    ...FONT.info,
    color: COLORS.infoText,
    flex: 1,
  },

  // ── TOTP input ────────────────────────────────────────────────
  totpInput: {
    borderWidth: 2,
    borderColor: COLORS.borderFocus,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.sm,
    paddingVertical: 16,
    paddingHorizontal: 16,
    ...FONT.code,
    color: COLORS.text,
    textAlign: "center",
    minHeight: 60,
    marginBottom: 8,
  },
  totpInputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorBg,
  },

  // ── Error message ─────────────────────────────────────────────
  errorBox: {
    backgroundColor: COLORS.errorBg,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },

  // ── Modal secondary actions ───────────────────────────────────
  modalActions: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ghostButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    flex: 1,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  ghostButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  cancelText: {
    color: COLORS.textSoft,
  },
});
