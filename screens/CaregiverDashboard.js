// screens/CaregiverDashboard.js - REVAMPED UI (autism-friendly, modern, clean)
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useAccessibility } from "../context/AccessibilityContext";

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
  shadow: "#2C3E3D",
  overlayBg: "rgba(244, 248, 247, 0.68)",
};

// ── Nav items config ────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: "Chat with Rafiki Bot",
    hint: "Opens chat with Rafiki assistant",
    icon: "chatbubble-ellipses-outline",
    route: "Chatbot",
    emoji: "🤖",
  },
  {
    label: "Manage Symbols",
    hint: "Opens symbol management screen",
    icon: "grid-outline",
    route: "ManageSymbols",
    emoji: "🗂️",
  },
  {
    label: "View Symbol Analytics",
    hint: "Opens symbol usage statistics",
    icon: "bar-chart-outline",
    route: "SymbolAnalytics",
    emoji: "📊",
  },
];
// ────────────────────────────────────────────────────────────────

export default function CaregiverDashboard({ navigation }) {
  const [user, setUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const { highContrast, largerText } = useAccessibility();

  console.log('🔍 [CaregiverDashboard] Accessibility values:', { highContrast, largerText });

  // ── Auth & profile (unchanged) ───────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "caregivers", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setProfilePic(snap.data().photoURL || currentUser.photoURL);
        }
      }
    });
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      alert("Failed to sign out. Please try again.");
    }
  };

  const dynHeaderTitle = largerText ? 20 : 18;
  const dynTitle = largerText ? 30 : 24;
  const dynSubtitle = largerText ? 18 : 15;
  const dynBtnText = largerText ? 18 : 16;

  // ── Render ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Header ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <StatusBar
          translucent
          backgroundColor={COLORS.primary}
          barStyle="light-content"
        />
        <SafeAreaView>
          <View style={styles.headerContent}>
            {/* Back */}
            <TouchableOpacity
              style={[styles.headerIconBtn, highContrast && styles.highContrastBorder]}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Returns to previous screen"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.textOnPrimary} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { fontSize: dynHeaderTitle }]}>
              Caregiver Dashboard
            </Text>

            {/* Profile avatar */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              style={[styles.profilePhotoWrapper, highContrast && styles.highContrastBorder]}
              accessibilityLabel="Profile settings"
              accessibilityRole="button"
              accessibilityHint="Opens profile settings"
            >
              <Image
                source={
                  profilePic
                    ? { uri: profilePic }
                    : require("../assets/default_avatar.jpg")
                }
                style={styles.profilePhoto}
                accessible={true}
                accessibilityLabel="User profile picture"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Body ──────────────────────────────────────────────── */}
      <ImageBackground
        source={require("../assets/rafiki_background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.content}>
          {/* Greeting */}
          <Text style={[styles.welcomeTitle, { fontSize: dynTitle }]}>
            Karibu Rafiki Caregiver
          </Text>
          <Text style={[styles.welcomeSubtitle, { fontSize: dynSubtitle }]}>
            What would you like to do?
          </Text>

          {/* Nav cards */}
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.navCard, highContrast && styles.highContrastBorder]}
              onPress={() => navigation.navigate(item.route)}
              accessibilityLabel={item.label}
              accessibilityRole="button"
              accessibilityHint={item.hint}
              activeOpacity={0.85}
            >
              {/* Icon circle */}
              <View style={styles.navIconCircle}>
                <Ionicons name={item.icon} size={22} color={COLORS.primary} />
              </View>

              {/* Label */}
              <Text style={[styles.navLabel, { fontSize: dynBtnText }]}>
                {item.label}
              </Text>

              {/* Chevron */}
              <View style={styles.navChevron}>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          ))}

          {/* Sign out — separated, visually softer */}
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={16} color={COLORS.textSoft} style={{ marginRight: 6 }} />
            <Text style={[styles.signOutText, largerText && { fontSize: 16 }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Layout ───────────────────────────────────────────────────
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: 18,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontWeight: "700",
    letterSpacing: 0.3,
    flex: 1,
    textAlign: "center",
  },
  profilePhotoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
  },

  // ── Background & overlay ──────────────────────────────────────
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayBg,
  },

  // ── Content ───────────────────────────────────────────────────
  content: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 24,
  },

  // ── Headings ──────────────────────────────────────────────────
  welcomeTitle: {
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  welcomeSubtitle: {
    color: COLORS.textSoft,
    textAlign: "center",
    marginBottom: 28,
    fontWeight: "500",
  },

  // ── Nav cards ─────────────────────────────────────────────────
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    width: "100%",
    maxWidth: 360,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    gap: 14,
    minHeight: 64,
  },
  navIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  navLabel: {
    flex: 1,
    fontWeight: "700",
    color: COLORS.text,
  },
  navChevron: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // ── Sign out ──────────────────────────────────────────────────
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signOutText: {
    color: COLORS.textSoft,
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Accessibility ─────────────────────────────────────────────
  highContrastBorder: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
});