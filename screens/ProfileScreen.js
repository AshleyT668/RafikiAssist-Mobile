// screens/ProfileScreen.js - REVAMPED UI (autism-friendly, modern, clean)
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, is2FAEnabled, hasTOTPEnabled, disable2FA } from "../firebaseConfig";
import { useSymbols } from "../context/SymbolsContext";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useAccessibility } from "../context/AccessibilityContext";

const db = getFirestore();

// ── Design tokens ────────────────────────────────────────────────
const COLORS = {
  primary: "#4AADA3",
  primaryDark: "#37877E",
  primaryLight: "#E6F4F3",
  text: "#2C3E3D",
  textSoft: "#6B8280",
  textOnPrimary: "#FFFFFF",
  border: "#D6E8E6",
  card: "#FFFFFF",
  bg: "#F4F8F7",
  shadow: "#2C3E3D",
  // Status
  success: "#2E7D54",
  successBg: "#E8F5EE",
  warning: "#B45309",
  warningBg: "#FFF4E5",
  danger: "#C0392B",
  dangerBg: "#FDECEA",
  // Switch
  switchActive: "#4AADA3",
  switchInactive: "#C5DCDA",
};

const RADIUS = { sm: 10, md: 14, lg: 18, xl: 24, full: 999 };

// ── Section wrapper ───────────────────────────────────────────────
const Section = ({ title, children, largerText, highContrast }) => (
  <View style={[
    sectionStyles.card,
    highContrast && { borderWidth: 2, borderColor: COLORS.primary },
  ]}>
    {title ? (
      <Text style={[sectionStyles.title, largerText && { fontSize: 18 }]}>{title}</Text>
    ) : null}
    {children}
  </View>
);
const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSoft,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
});

// ── Row item ──────────────────────────────────────────────────────
const RowItem = ({ icon, iconColor, title, subtitle, right, onPress, last, largerText }) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[rowStyles.row, last && rowStyles.rowLast]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={rowStyles.iconCircle}>
        <Ionicons name={icon} size={18} color={iconColor || COLORS.primary} />
      </View>
      <View style={rowStyles.textBlock}>
        <Text style={[rowStyles.title, largerText && { fontSize: 17 }]}>{title}</Text>
        {subtitle ? (
          <Text style={[rowStyles.subtitle, largerText && { fontSize: 13 }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </Wrapper>
  );
};
const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  rowLast: {
    borderBottomWidth: 0,
    marginBottom: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textBlock: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textSoft, marginTop: 1 },
});
// ────────────────────────────────────────────────────────────────

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(null);
  const [displayName, setDisplayName] = useState("");

  const { symbols } = useSymbols();
  const { theme, toggleTheme, isDark } = useTheme();
  const { highContrast, largerText, saveAccessibilityPreferences } = useAccessibility();

  // ── Data loading (unchanged) ─────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) { setUser(null); setLoading(false); return; }
        setUser(currentUser);
        setDisplayName(currentUser.displayName || "");
        setProfilePic(currentUser.photoURL || null);

        const cached = await AsyncStorage.getItem("userData");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (mounted) {
              setDisplayName(parsed.displayName || displayName);
              setProfilePic(parsed.photoURL || profilePic);
            }
          } catch (e) {}
        }

        try {
          const docRef = doc(db, "users", currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (mounted) {
              if (data.displayName) setDisplayName(data.displayName);
              if (data.photoURL) setProfilePic(data.photoURL);
            }
            await AsyncStorage.setItem("userData", JSON.stringify({
              uid: currentUser.uid,
              displayName: data.displayName || currentUser.displayName || "",
              photoURL: data.photoURL || currentUser.photoURL || null,
            }));
          }
        } catch (err) {
          console.warn("Could not fetch user doc:", err.message || err);
        }

        await check2FAStatus(currentUser);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) { setTwoFAEnabled(false); setTotpEnabled(false); }
      else check2FAStatus(u);
    });
    return () => { mounted = false; unsub(); };
  }, []);

  // ── 2FA (unchanged logic) ────────────────────────────────────
  const check2FAStatus = async (currentUser) => {
    try {
      setTwoFALoading(true);
      const enabled = await is2FAEnabled(currentUser);
      const totpEnabledStatus = await hasTOTPEnabled(currentUser);
      setTwoFAEnabled(enabled);
      setTotpEnabled(totpEnabledStatus);
      console.log("🔍 2FA Status Check:", { email: currentUser.email, enabled, totpEnabled: totpEnabledStatus });
    } catch (error) {
      console.error("❌ Error checking 2FA status:", error);
      setTwoFAEnabled(false);
      setTotpEnabled(false);
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    Alert.alert(
      "Disable Two-Factor Authentication",
      "Are you sure you want to disable Google Authenticator? This will make your account less secure.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            try {
              await disable2FA(auth.currentUser);
              setTotpEnabled(false);
              setTwoFAEnabled(false);
              Alert.alert("Success", "Google Authenticator has been disabled.");
            } catch (error) {
              Alert.alert("Error", "Failed to disable 2FA. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleSetup2FA = () => {
    navigation.navigate("TOTPSetup", { onSetupComplete: () => check2FAStatus(auth.currentUser) });
  };

  const handle2FAPress = () => totpEnabled ? handleDisable2FA() : handleSetup2FA();

  const toggleHighContrast = () => saveAccessibilityPreferences({ highContrast: !highContrast });
  const toggleLargerText   = () => saveAccessibilityPreferences({ largerText: !largerText });

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem("userData");
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Sign out failed", error.message || "Please try again.");
    }
  };

  const handleEditProfile     = () => navigation.navigate("EditProfile");
  const handleChangePassword  = () => navigation.navigate("ChangePassword");
  const handleManageSymbols   = () => navigation.navigate("ManageSymbols");
  const handleSymbolAnalytics = () => navigation.navigate("SymbolAnalytics");

  // 2FA display helpers (unchanged)
  const get2FAStatusText  = () => twoFALoading ? "Checking…" : totpEnabled ? "Google Authenticator Enabled" : "Not set up";
  const get2FAStatusColor = () => twoFALoading ? COLORS.textSoft : totpEnabled ? COLORS.success : COLORS.warning;
  const get2FAIcon        = () => totpEnabled ? "shield-checkmark" : "shield-outline";
  const get2FAIconColor   = () => totpEnabled ? COLORS.success : COLORS.primary;

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const dynName    = largerText ? 22 : 20;
  const dynEmail   = largerText ? 15 : 13;
  const dynBtnText = largerText ? 16 : 14;

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor={COLORS.primary} barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="main"
        accessibilityLabel="Profile settings"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile header ──────────────────────────────────── */}
        <View style={styles.profileHeader}>
          {/* Back button */}
          <TouchableOpacity
            style={[styles.headerBackBtn, highContrast && styles.highContrastBorder]}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            accessibilityHint="Returns to previous screen"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textOnPrimary} />
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity
            style={[styles.avatarRing, highContrast && styles.highContrastBorder]}
            onPress={handleEditProfile}
            accessibilityLabel="Open edit profile"
            accessibilityRole="button"
            accessibilityHint="Opens screen to edit your profile information"
          >
            <Image
              source={profilePic ? { uri: profilePic } : require("../assets/default_avatar.jpg")}
              style={styles.avatar}
              accessible={true}
              accessibilityLabel="User profile picture"
            />
            {/* Camera badge */}
            <View style={styles.cameraBadge}>
              <Ionicons name="pencil" size={10} color={COLORS.textOnPrimary} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.nameText, { fontSize: dynName }]}>
            {displayName || user?.displayName || "Rafiki User"}
          </Text>
          <Text style={[styles.emailText, { fontSize: dynEmail }]}>
            {user?.email || "No email available"}
          </Text>

          {/* Edit profile pill */}
          <TouchableOpacity
            style={[styles.editBtn, highContrast && styles.highContrastBorder]}
            onPress={handleEditProfile}
            accessibilityLabel="Edit profile"
            accessibilityRole="button"
            accessibilityHint="Opens screen to edit your profile information"
            activeOpacity={0.85}
          >
            <Ionicons name="pencil-outline" size={14} color={COLORS.primary} />
            <Text style={[styles.editBtnText, { fontSize: dynBtnText }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── Body ────────────────────────────────────────────── */}
        <View style={styles.body}>

          {/* Quick stats row */}
          <View style={styles.statsRow}>
            {/* Symbol count */}
            <View style={[styles.quickStat, highContrast && styles.highContrastBorder]}>
              <Text style={[styles.quickStatValue, largerText && { fontSize: 28 }]}>
                {symbols?.length ?? 0}
              </Text>
              <Text style={[styles.quickStatLabel, largerText && { fontSize: 13 }]}>
                Symbols
              </Text>
            </View>

            {/* Manage Symbols shortcut */}
            <TouchableOpacity
              style={[styles.quickAction, highContrast && styles.highContrastBorder]}
              onPress={handleManageSymbols}
              accessibilityLabel="Manage symbols"
              accessibilityRole="button"
              accessibilityHint="Opens screen to add, edit, or delete communication symbols"
              activeOpacity={0.85}
            >
              <Ionicons name="images-outline" size={24} color={COLORS.primary} />
              <Text style={[styles.quickActionLabel, largerText && { fontSize: 13 }]}>
                Manage
              </Text>
            </TouchableOpacity>

            {/* Analytics shortcut */}
            <TouchableOpacity
              style={[styles.quickAction, highContrast && styles.highContrastBorder]}
              onPress={handleSymbolAnalytics}
              accessibilityLabel="View symbol analytics"
              accessibilityRole="button"
              accessibilityHint="Opens screen showing symbol usage statistics"
              activeOpacity={0.85}
            >
              <Ionicons name="analytics-outline" size={24} color={COLORS.primary} />
              <Text style={[styles.quickActionLabel, largerText && { fontSize: 13 }]}>
                Analytics
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Security ────────────────────────────────────── */}
          <Section title="Security" largerText={largerText} highContrast={highContrast}>
            {/* 2FA row */}
            <RowItem
              icon={get2FAIcon()}
              iconColor={get2FAIconColor()}
              title="Google Authenticator"
              subtitle={get2FAStatusText()}
              largerText={largerText}
              onPress={handle2FAPress}
              right={
                twoFALoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <View style={[
                    styles.statusPill,
                    totpEnabled ? styles.statusPillOn : styles.statusPillOff,
                  ]}>
                    <Text style={[
                      styles.statusPillText,
                      totpEnabled ? styles.statusPillTextOn : styles.statusPillTextOff,
                      largerText && { fontSize: 12 },
                    ]}>
                      {totpEnabled ? "On" : "Off"}
                    </Text>
                  </View>
                )
              }
            />
            {/* Change password row */}
            <RowItem
              icon="lock-closed-outline"
              title="Change Password"
              subtitle="Update your account password"
              largerText={largerText}
              onPress={handleChangePassword}
              last
              right={<Ionicons name="chevron-forward" size={18} color={COLORS.textSoft} />}
            />
          </Section>

          {/* ── Appearance ──────────────────────────────────── */}
          <Section title="Appearance" largerText={largerText} highContrast={highContrast}>
            <RowItem
              icon={isDark ? "moon" : "sunny-outline"}
              iconColor={isDark ? "#7C5CBF" : "#F5A623"}
              title="Dark Mode"
              subtitle={isDark ? "Enabled" : "Disabled"}
              largerText={largerText}
              last
              right={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: COLORS.border, true: COLORS.switchActive }}
                  thumbColor={COLORS.card}
                  accessibilityLabel="Dark mode toggle switch"
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isDark }}
                  accessibilityHint="Turns dark mode on or off"
                />
              }
            />
          </Section>

          {/* ── Accessibility ────────────────────────────────── */}
          <Section title="Accessibility" largerText={largerText} highContrast={highContrast}>
            <RowItem
              icon="contrast-outline"
              title="High Contrast"
              subtitle="Enhanced visibility for low vision"
              largerText={largerText}
              right={
                <Switch
                  value={highContrast}
                  onValueChange={toggleHighContrast}
                  trackColor={{ false: COLORS.border, true: COLORS.switchActive }}
                  thumbColor={COLORS.card}
                  accessibilityLabel="High contrast mode toggle"
                  accessibilityRole="switch"
                  accessibilityState={{ checked: highContrast }}
                  accessibilityHint="Turns high contrast mode on or off"
                />
              }
            />
            <RowItem
              icon="text-outline"
              title="Larger Text"
              subtitle="Increase text size throughout app"
              largerText={largerText}
              last
              right={
                <Switch
                  value={largerText}
                  onValueChange={toggleLargerText}
                  trackColor={{ false: COLORS.border, true: COLORS.switchActive }}
                  thumbColor={COLORS.card}
                  accessibilityLabel="Larger text toggle"
                  accessibilityRole="switch"
                  accessibilityState={{ checked: largerText }}
                  accessibilityHint="Turns larger text mode on or off"
                />
              }
            />
          </Section>

          {/* ── Sign out ─────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.signOutBtn, highContrast && styles.highContrastBorder]}
            onPress={handleSignOut}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
            accessibilityHint="Signs you out of your account"
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={18} color={COLORS.textSoft} />
            <Text style={[styles.signOutText, largerText && { fontSize: 16 }]}>Sign Out</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Root ─────────────────────────────────────────────────────
  root: { flex: 1, backgroundColor: COLORS.bg },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  // ── Profile header ────────────────────────────────────────────
  profileHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: 28,
    alignItems: "center",
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerBackBtn: {
    position: "absolute",
    left: 16,
    top: Platform.OS === "ios" ? 54 : 44,
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
    overflow: "visible",
    marginBottom: 4,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.textOnPrimary,
  },
  nameText: {
    color: COLORS.textOnPrimary,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  emailText: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontWeight: "400",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginTop: 14,
  },
  editBtnText: {
    fontWeight: "600",
    color: COLORS.primary,
  },

  // ── Body ──────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ── Quick stats row ───────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  quickStat: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 12,
    color: COLORS.textSoft,
    fontWeight: "500",
  },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    gap: 4,
  },
  quickActionLabel: {
    fontSize: 12,
    color: COLORS.textSoft,
    fontWeight: "600",
  },

  // ── 2FA status pill ───────────────────────────────────────────
  statusPill: {
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  statusPillOn: { backgroundColor: COLORS.successBg },
  statusPillOff: { backgroundColor: COLORS.warningBg },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  statusPillTextOn: { color: COLORS.success },
  statusPillTextOff: { color: COLORS.warning },

  // ── Sign out ──────────────────────────────────────────────────
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSoft,
  },

  // ── Accessibility ─────────────────────────────────────────────
  highContrastBorder: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
});