// screens/ChangePasswordScreen.js - REVAMPED UI (autism-friendly, modern, clean)
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useAccessibility } from "../context/AccessibilityContext";
import { useTheme } from "../context/ThemeContext";

// ── Design tokens (consistent across all screens) ───────────────
const COLORS = {
  primary: "#4AADA3",
  primaryLight: "#E6F4F3",
  primaryDark: "#37877E",
  text: "#2C3E3D",
  textSoft: "#6B8280",
  textOnPrimary: "#FFFFFF",
  border: "#D6E8E6",
  borderFocus: "#4AADA3",
  card: "#FFFFFF",
  bg: "#F4F8F7",
  shadow: "#2C3E3D",
  overlayBg: "rgba(244, 248, 247, 0.72)",
};

const RADIUS = { sm: 12, md: 16, lg: 20, full: 999 };
// ────────────────────────────────────────────────────────────────

// ── Labelled password input ───────────────────────────────────────
function PasswordField({ label, value, onChangeText, placeholder, hint, isDark, largerText, highContrast, accessibilityLabel, accessibilityHint }) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  const inputBg   = isDark ? "rgba(40,40,40,0.9)" : COLORS.bg;
  const inputText = isDark ? "#E8F4F3" : COLORS.text;
  const labelCol  = isDark ? "#9BBFBB" : COLORS.textSoft;

  return (
    <View style={pfStyles.group}>
      <Text style={[pfStyles.label, { color: labelCol }, largerText && { fontSize: 15 }]}>
        {label}
      </Text>
      {hint ? (
        <Text style={[pfStyles.hint, largerText && { fontSize: 12 }]}>{hint}</Text>
      ) : null}
      <View style={[
        pfStyles.inputRow,
        { backgroundColor: inputBg, borderColor: focused ? COLORS.borderFocus : (isDark ? "#3A5250" : COLORS.border) },
        focused && pfStyles.inputRowFocused,
        highContrast && pfStyles.inputRowHighContrast,
      ]}>
        <TextInput
          style={[pfStyles.input, { color: inputText }, largerText && { fontSize: 17 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSoft}
          secureTextEntry={!visible}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
        />
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          style={pfStyles.eyeBtn}
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={18}
            color={COLORS.textSoft}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pfStyles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSoft,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textSoft,
    marginBottom: 6,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputRowFocused: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputRowHighContrast: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  eyeBtn: {
    paddingLeft: 8,
  },
});
// ────────────────────────────────────────────────────────────────

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [loading, setLoading]                 = useState(false);
  const { highContrast, largerText }           = useAccessibility();
  const { theme, isDark }                      = useTheme();

  // ── Handler (unchanged logic) ────────────────────────────────
  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert("Error", "No user logged in");
    if (newPassword.length < 6) {
      return Alert.alert("Weak Password", "New password must be at least 6 characters long");
    }
    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Password updated successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const cardBg   = isDark ? "rgba(30,30,30,0.97)" : COLORS.card;
  const titleCol = isDark ? "#E8F4F3" : COLORS.text;
  const dynHeaderTitle = largerText ? 20 : 18;
  const dynBtnText     = largerText ? 18 : 16;

  return (
    <View style={styles.container}>
      {/* ── Header ────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <StatusBar
          translucent
          backgroundColor={theme.headerBackground}
          barStyle="light-content"
        />
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: theme.headerIconBackground }, highContrast && styles.highContrastBorder]}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Returns to previous screen without saving changes"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={theme.headerText} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { fontSize: dynHeaderTitle, color: theme.headerText }]}>
              Change Password
            </Text>

            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
      </View>

      {/* ── Body ────────────────────────────────────────────────── */}
      <ImageBackground
        source={require("../assets/rafiki_background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={[styles.overlay, {
          backgroundColor: isDark ? "rgba(20,30,29,0.78)" : COLORS.overlayBg
        }]} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.card, { backgroundColor: cardBg }, highContrast && styles.highContrastBorder]}>

              {/* Lock icon */}
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed-outline" size={28} color={COLORS.primary} />
              </View>

              <Text style={[styles.cardTitle, { color: titleCol }, largerText && { fontSize: 22 }]}>
                Update your password
              </Text>
              <Text style={[styles.cardSubtitle, largerText && { fontSize: 14 }]}>
                Enter your current password then choose a new one
              </Text>

              {/* Current password */}
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                isDark={isDark}
                largerText={largerText}
                highContrast={highContrast}
                accessibilityLabel="Current password"
                accessibilityHint="Enter your current password for verification"
              />

              {/* New password */}
              <PasswordField
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min. 6 characters"
                hint="Must be at least 6 characters long"
                isDark={isDark}
                largerText={largerText}
                highContrast={highContrast}
                accessibilityLabel="New password"
                accessibilityHint="Enter your new password, must be at least 6 characters"
              />

              {/* Update button */}
              <TouchableOpacity
                style={[
                  styles.updateBtn,
                  loading && styles.updateBtnDisabled,
                  highContrast && styles.highContrastBorder,
                ]}
                onPress={handleChangePassword}
                disabled={loading}
                accessibilityLabel={loading ? "Updating password" : "Update password"}
                accessibilityRole="button"
                accessibilityHint="Saves the new password after verification"
                accessibilityState={{ disabled: loading }}
                activeOpacity={0.85}
              >
                <Text style={[styles.updateBtnText, { fontSize: dynBtnText }]}>
                  {loading ? "Updating…" : "Update Password"}
                </Text>
              </TouchableOpacity>

              {/* Cancel link */}
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.cancelRow}
                accessibilityLabel="Cancel password change"
                accessibilityRole="button"
                accessibilityHint="Returns to previous screen without saving changes"
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, largerText && { fontSize: 16 }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ───────────────────────────────────────────────────
  header: { backgroundColor: COLORS.primary },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: 18,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerPlaceholder: { width: 40 },

  // ── Background & overlay ─────────────────────────────────────
  background: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: { ...StyleSheet.absoluteFillObject },

  // ── Scroll ───────────────────────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  // ── Card ──────────────────────────────────────────────────────
  card: {
    borderRadius: RADIUS.lg,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },

  // ── Card header ───────────────────────────────────────────────
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSoft,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18,
  },

  // ── Update button ─────────────────────────────────────────────
  updateBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  updateBtnDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  updateBtnText: {
    color: COLORS.textOnPrimary,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Cancel ────────────────────────────────────────────────────
  cancelRow: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Accessibility ─────────────────────────────────────────────
  highContrastBorder: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
});
