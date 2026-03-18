// screens/RoleSelectionScreen.js - REVAMPED UI (autism-friendly, modern, clean)
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useAccessibility } from "../context/AccessibilityContext";
import { saveUserRole } from "../services/userService";
import { useTheme } from "../context/ThemeContext";

// ── Design tokens (consistent with LoginScreen) ─────────────────
const COLORS = {
  bg: "#F4F8F7",
  card: "#FFFFFF",
  primary: "#4AADA3",
  primaryDark: "#37877E",
  primaryLight: "#E6F4F3",
  text: "#2C3E3D",
  textSoft: "#6B8280",
  textOnPrimary: "#FFFFFF",
  border: "#D6E8E6",
  shadow: "#2C3E3D",
  childAccent: "#4AADA3",    // teal — calm, trustworthy
  caregiverAccent: "#5A8A85", // deeper teal — slightly more authoritative
  childIconBg: "#E6F4F3",
  caregiverIconBg: "#D6EDEB",
  overlayBg: "rgba(244, 248, 247, 0.70)",
};

const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 999,
};
// ────────────────────────────────────────────────────────────────

export default function RoleSelectionScreen({ navigation, setRole }) {
  const { highContrast, largerText } = useAccessibility();
  const { theme, isDark } = useTheme();

  const dynTitle = largerText ? 30 : 24;
  const dynSubtitle = largerText ? 19 : 15;
  const dynBtnText = largerText ? 18 : 16;
  const dynHeaderTitle = largerText ? 20 : 18;

  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <StatusBar
          translucent
          backgroundColor={theme.primary}
          barStyle="light-content"
        />
        <SafeAreaView>
          <View style={styles.headerContent}>
            {/* Brand mark */}
            <View style={[styles.headerLogoCircle, { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.headerLogoEmoji}>🤝</Text>
            </View>
            <Text style={[styles.headerTitle, { fontSize: dynHeaderTitle, color: theme.headerText }]}>
              Jambo Rafiki
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Background ──────────────────────────────────────────── */}
      <ImageBackground
        source={require("../assets/rafiki_background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Soft tinted overlay */}
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]} />

        <View style={styles.content}>
          {/* Heading block */}
          <Text style={[styles.title, { fontSize: dynTitle, color: theme.text }]}>
            Welcome to Rafiki Assist!
          </Text>
          <Text style={[styles.subtitle, { fontSize: dynSubtitle, color: theme.subtext }]}>
            Who are you today?
          </Text>

          {/* ── Child card ─────────────────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              { backgroundColor: theme.card, shadowColor: theme.shadow },
              highContrast && styles.highContrastBorder,
            ]}
            onPress={() => {
              setRole("child");
              saveUserRole("child").catch((error) =>
                console.error("Failed to save child role:", error)
              );
              navigation.navigate("ChildDashboard");
            }}
            accessibilityLabel="I am a child"
            accessibilityRole="button"
            accessibilityHint="Selects child mode with symbol communication"
            activeOpacity={0.85}
          >
            <View style={[styles.roleIconCircle, { backgroundColor: theme.primaryLight }]}>
              <Text style={styles.roleIcon}>🧒</Text>
            </View>
            <View style={styles.roleTextBlock}>
              <Text style={[styles.roleTitle, { fontSize: dynBtnText + 1, color: theme.text }]}>
                I am a child
              </Text>
              <Text style={[styles.roleHint, { fontSize: dynSubtitle - 2, color: theme.subtext }]}>
                Symbol & picture communication
              </Text>
            </View>
            <View style={[styles.roleChevron, { backgroundColor: theme.secondaryCard }]}>
              <Text style={styles.chevronText}>›</Text>
            </View>
          </TouchableOpacity>

          {/* ── Caregiver card ─────────────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              { backgroundColor: theme.card, shadowColor: theme.shadow },
              highContrast && styles.highContrastBorder,
            ]}
            onPress={() => {
              setRole("caregiver");
              saveUserRole("caregiver").catch((error) =>
                console.error("Failed to save caregiver role:", error)
              );
              navigation.navigate("CaregiverDashboard");
            }}
            accessibilityLabel="I am a caregiver"
            accessibilityRole="button"
            accessibilityHint="Selects caregiver mode with management features"
            activeOpacity={0.85}
          >
            <View style={[styles.roleIconCircle, { backgroundColor: theme.primaryLight }]}>
              <Text style={styles.roleIcon}>👩‍⚕️</Text>
            </View>
            <View style={styles.roleTextBlock}>
              <Text style={[styles.roleTitle, { fontSize: dynBtnText + 1, color: theme.text }]}>
                I am a caregiver
              </Text>
              <Text style={[styles.roleHint, { fontSize: dynSubtitle - 2, color: theme.subtext }]}>
                Manage settings & communication boards
              </Text>
            </View>
            <View style={[styles.roleChevron, { backgroundColor: theme.secondaryCard }]}>
              <Text style={styles.chevronText}>›</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Layout ────────────────────────────────────────────────────
  container: {
    flex: 1,
  },

  // ── Header ───────────────────────────────────────────────────
  header: {
    backgroundColor: COLORS.primary,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: 18,
  },
  headerLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogoEmoji: {
    fontSize: 16,
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Background & overlay ──────────────────────────────────────
  background: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayBg,
  },

  // ── Content ───────────────────────────────────────────────────
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  // ── Headings ──────────────────────────────────────────────────
  title: {
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: COLORS.textSoft,
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "500",
  },

  // ── Role cards ────────────────────────────────────────────────
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    width: "100%",
    maxWidth: 340,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    gap: 14,
    minHeight: 76, // large tap target
  },
  roleIconCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  roleIcon: {
    fontSize: 26,
  },
  roleTextBlock: {
    flex: 1,
  },
  roleTitle: {
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  roleHint: {
    color: COLORS.textSoft,
    fontWeight: "400",
    lineHeight: 18,
  },
  roleChevron: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chevronText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },

  // ── Accessibility ─────────────────────────────────────────────
  highContrastBorder: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
});
