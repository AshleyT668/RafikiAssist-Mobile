// screens/TOTPSetupScreen.js - REVAMPED UI (autism-friendly, modern, clean)
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
} from "react-native";
import {
  generateTOTPSecret,
  generateTOTPSecretSimple,
  verifyTOTPAndEnable2FA,
  generateBackupCodes,
  storeBackupCodes,
  auth,
} from "../firebaseConfig";
import { useAccessibility } from "../context/AccessibilityContext";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

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
  warning: "#B45309",
  warningBg: "#FFF4E5",
  warningBorder: "#F5C07A",
  success: "#2E7D54",
  successBg: "#E8F5EE",
  successBorder: "#A3D9BB",
  codeBg: "#F0FAF9",
  codeBorder: "#C2E5E2",
};

const RADIUS = { sm: 10, md: 14, lg: 18, full: 999 };

// ── Step progress indicator ───────────────────────────────────────
const STEPS = ["intro", "setup", "backup", "complete"];
const STEP_LABELS = ["Intro", "Setup", "Backup", "Done"];

function StepBar({ current }) {
  const idx = STEPS.indexOf(current);
  return (
    <View style={stepBarStyles.row}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <View style={[
            stepBarStyles.dot,
            i <= idx ? stepBarStyles.dotActive : stepBarStyles.dotInactive,
          ]}>
            {i < idx ? (
              <Ionicons name="checkmark" size={10} color={COLORS.textOnPrimary} />
            ) : (
              <Text style={[stepBarStyles.dotText, i <= idx && stepBarStyles.dotTextActive]}>
                {i + 1}
              </Text>
            )}
          </View>
          {i < STEPS.length - 1 && (
            <View style={[stepBarStyles.line, i < idx && stepBarStyles.lineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}
const stepBarStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  dot: {
    width: 28, height: 28,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: { backgroundColor: COLORS.primary },
  dotInactive: { backgroundColor: COLORS.primaryLight },
  dotText: { fontSize: 11, fontWeight: "700", color: COLORS.textSoft },
  dotTextActive: { color: COLORS.textOnPrimary },
  line: { flex: 1, height: 2, backgroundColor: COLORS.primaryLight, marginHorizontal: 4 },
  lineActive: { backgroundColor: COLORS.primary },
});

// ── Info row (icon + text) ────────────────────────────────────────
function InfoRow({ icon, text, largerText }) {
  return (
    <View style={infoRowStyles.row}>
      <View style={infoRowStyles.iconCircle}>
        <Ionicons name={icon} size={14} color={COLORS.primary} />
      </View>
      <Text style={[infoRowStyles.text, largerText && { fontSize: 14 }]}>{text}</Text>
    </View>
  );
}
const infoRowStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  iconCircle: {
    width: 26, height: 26,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  text: { fontSize: 13, color: COLORS.textSoft, flex: 1, lineHeight: 18 },
});
// ────────────────────────────────────────────────────────────────

export default function TOTPSetupScreen({ navigation, route }) {
  const [step, setStep]                       = useState("intro");
  const [verificationCode, setVerificationCode] = useState("");
  const [secret, setSecret]                   = useState(null);
  const [backupCodes, setBackupCodes]         = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [codeFocused, setCodeFocused]         = useState(false);
  const { highContrast, largerText }          = useAccessibility();
  const { theme, isDark }                     = useTheme();

  const user = auth.currentUser;

  // ── Handlers (all unchanged logic) ──────────────────────────
  const startTOTPSetup = async () => {
    if (!user) { Alert.alert("Error", "No user found. Please log in again."); return; }
    setLoading(true);
    try {
      let generatedSecret;
      try { generatedSecret = await generateTOTPSecretSimple(user); }
      catch { generatedSecret = await generateTOTPSecret(user); }
      setSecret(generatedSecret);
      setStep("setup");
    } catch (error) {
      let msg = error.message || "Failed to start 2FA setup";
      if (msg.includes("requires-recent-login") || msg.includes("session expired"))
        msg = "Your session has expired. Please log out and log in again, then try setting up 2FA.";
      else if (msg.includes("No authenticated user"))
        msg = "No authenticated user found. Please log in again.";
      Alert.alert("Setup Failed", msg);
    } finally { setLoading(false); }
  };

  const openAuthenticatorApp = () => {
    const playStoreUrl = "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2";
    const appStoreUrl  = "https://apps.apple.com/us/app/google-authenticator/id388497605";
    Linking.openURL(playStoreUrl).catch(() =>
      Linking.openURL(appStoreUrl).catch(() =>
        Alert.alert("Google Authenticator", "Please install Google Authenticator from your app store", [{ text: "OK" }])
      )
    );
  };

  const verifyAndEnableTOTP = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert("Error", "Please enter a 6-digit code from Google Authenticator"); return;
    }
    if (!secret) {
      Alert.alert("Error", "TOTP setup incomplete. Please restart the setup process."); return;
    }
    setLoading(true);
    try {
      await verifyTOTPAndEnable2FA(user, verificationCode, secret);
      const codes = generateBackupCodes();
      setBackupCodes(codes);
      await storeBackupCodes(user, codes);
      setStep("backup");
    } catch (error) {
      setVerificationCode("");
      Alert.alert("Verification Failed", error.message || "Verification failed");
    } finally { setLoading(false); }
  };

  const completeSetup = () => {
    setStep("complete");
    if (route.params?.onSetupComplete) route.params.onSetupComplete();
    setTimeout(() => navigation.goBack(), 2000);
  };

  const copySetupInstructions = () => {
    if (!secret) return;
    Alert.alert(
      "Setup Instructions",
      `1. Open Google Authenticator\n2. Tap "+" -> "Enter a setup key"\n3. Account: ${user?.email || "Your Account"}\n4. Key: ${secret}\n5. Time-based: Yes`,
      [
        { text: "Copy Secret", onPress: () => Alert.alert("Copied", "Secret copied. Paste it in Google Authenticator.") },
        { text: "OK" },
      ]
    );
  };

  const showSecretInfo = () => {
    Alert.alert(
      "About TOTP Secrets",
      "The secret key generates time-based codes in Google Authenticator.\n\n- 20 characters (Base32)\n- Works offline\n- Refreshes every 30 seconds",
      [{ text: "OK" }]
    );
  };

  const skipBackupCodes = () => {
    Alert.alert(
      "Skip Backup Codes?",
      "Backup codes help if you lose your phone. Are you sure you want to skip?",
      [{ text: "Go Back", style: "cancel" }, { text: "Skip", style: "destructive", onPress: completeSetup }]
    );
  };

  const handleRetrySetup = () => { setStep("intro"); setSecret(null); setVerificationCode(""); };

  // ── Dynamic colours for dark mode ───────────────────────────
  const cardBg    = isDark ? "rgba(30,30,30,0.97)" : COLORS.card;
  const sectionBg = isDark ? "rgba(40,40,40,0.9)"  : COLORS.bg;
  const titleCol  = isDark ? "#E8F4F3" : COLORS.text;
  const inputBg   = isDark ? "rgba(40,40,40,0.9)"  : COLORS.bg;
  const inputText = isDark ? "#E8F4F3" : COLORS.text;
  const labelCol  = isDark ? "#9BBFBB" : COLORS.textSoft;

  const dynTitle   = largerText ? 28 : 22;
  const dynBtn     = largerText ? 18 : 16;
  const dynBody    = largerText ? 15 : 13;
  const dynSmall   = largerText ? 13 : 11;

  // ── No user ──────────────────────────────────────────────────
  if (!user) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: isDark ? "#111A19" : COLORS.bg }]}>
        <Text style={[styles.errorText, { color: titleCol }]}>Please log in first</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#111A19" : COLORS.bg }]}>
      <StatusBar translucent backgroundColor={theme.headerBackground} barStyle="light-content" />

      {/* ── Header ────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: theme.headerIconBackground }, highContrast && styles.highContrastBorder]}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }, largerText && { fontSize: 20 }]}>
          Two-Factor Authentication
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step progress bar */}
        <StepBar current={step} />

        {/* ── STEP: INTRO ──────────────────────────────────────── */}
        {step === "intro" && (
          <View style={[styles.card, { backgroundColor: cardBg }, highContrast && styles.highContrastBorder]}>
            <View style={styles.stepIconCircle}>
              <Ionicons name="shield-checkmark-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: titleCol, fontSize: dynTitle - 2 }]}>
              Setup Google Authenticator
            </Text>
            <Text style={[styles.stepSubtitle, { color: labelCol, fontSize: dynBody }]}>
              Protect your account with time-based verification codes — no internet needed.
            </Text>

            {/* Benefits list */}
            <View style={[styles.infoBox, { backgroundColor: sectionBg }]}>
              <InfoRow icon="wifi-outline"      text="Works offline — no internet needed"     largerText={largerText} />
              <InfoRow icon="flash-outline"     text="No email delays — instant codes"         largerText={largerText} />
              <InfoRow icon="lock-closed-outline" text="Industry standard TOTP security"       largerText={largerText} />
              <InfoRow icon="timer-outline"     text="Codes refresh every 30 seconds"          largerText={largerText} />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled, highContrast && styles.highContrastBorder]}
              onPress={startTOTPSetup}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color={COLORS.textOnPrimary} /> : (
                <Text style={[styles.primaryBtnText, { fontSize: dynBtn }]}>Start Setup</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={openAuthenticatorApp} activeOpacity={0.7}>
              <Ionicons name="download-outline" size={14} color={COLORS.primary} />
              <Text style={[styles.ghostBtnText, { fontSize: dynBody }]}>Install Google Authenticator</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.outlineBtn, highContrast && styles.highContrastBorder]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={[styles.outlineBtnText, { fontSize: dynBtn }]}>Not Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP: SETUP ──────────────────────────────────────── */}
        {step === "setup" && (
          <View style={[styles.card, { backgroundColor: cardBg }, highContrast && styles.highContrastBorder]}>
            <View style={styles.stepIconCircle}>
              <Ionicons name="key-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: titleCol, fontSize: dynTitle - 2 }]}>
              Add to Authenticator
            </Text>
            <Text style={[styles.stepSubtitle, { color: labelCol, fontSize: dynBody }]}>
              Add the key below in Google Authenticator, then enter the 6-digit code it generates.
            </Text>

            {/* Steps */}
            <View style={[styles.infoBox, { backgroundColor: sectionBg }]}>
              <InfoRow icon="apps-outline"     text='Open Google Authenticator'                          largerText={largerText} />
              <InfoRow icon="add-circle-outline" text='Tap "+" then "Enter a setup key"'               largerText={largerText} />
              <InfoRow icon="clipboard-outline" text="Enter the account name and secret key below"       largerText={largerText} />
              <InfoRow icon="checkmark-circle-outline" text='Leave it as time-based and tap "Add"'       largerText={largerText} />
            </View>

            {/* Secret key box */}
            <View style={[styles.secretBox, { backgroundColor: sectionBg, borderColor: COLORS.border }]}>
              <View style={styles.secretRow}>
                <Text style={[styles.secretMeta, { color: labelCol, fontSize: dynSmall }]}>Account</Text>
                <Text style={[styles.secretValue, { color: titleCol, fontSize: dynBody }]}>{user?.email}</Text>
              </View>
              <View style={[styles.secretDivider, { backgroundColor: COLORS.border }]} />
              <View style={styles.secretRow}>
                <Text style={[styles.secretMeta, { color: labelCol, fontSize: dynSmall }]}>Secret Key</Text>
                <View style={styles.secretValueRow}>
                  <Text style={[styles.secretCode, { color: titleCol, fontSize: dynBody }]}>
                    {secret || "Generating…"}
                  </Text>
                  <TouchableOpacity onPress={showSecretInfo} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="information-circle-outline" size={16} color={COLORS.textSoft} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.secretNote, { color: labelCol, fontSize: dynSmall }]}>
                Time-based · 6 digits · 30s refresh
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.outlineBtn, { marginBottom: 20 }]}
              onPress={copySetupInstructions}
              activeOpacity={0.8}
            >
              <Ionicons name="copy-outline" size={14} color={COLORS.textSoft} />
              <Text style={[styles.outlineBtnText, { fontSize: dynBody }]}>Copy Setup Instructions</Text>
            </TouchableOpacity>

            {/* Code input */}
            <Text style={[styles.fieldLabel, { color: labelCol, fontSize: dynSmall }]}>
              Verification Code
            </Text>
            <Text style={[styles.fieldHint, { color: labelCol, fontSize: dynSmall - 1 }]}>
              Enter the 6-digit code shown in Google Authenticator
            </Text>
            <TextInput
              style={[
                styles.codeInput,
                { backgroundColor: inputBg, color: inputText,
                  borderColor: codeFocused ? COLORS.borderFocus : (isDark ? "#3A5250" : COLORS.border) },
                codeFocused && styles.codeInputFocused,
                highContrast && styles.highContrastBorder,
                largerText && { fontSize: 26, letterSpacing: 10 },
              ]}
              placeholder="— — — — — —"
              placeholderTextColor={COLORS.textSoft}
              value={verificationCode}
              onChangeText={(t) => setVerificationCode(t.replace(/[^0-9]/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              autoFocus
              onFocus={() => setCodeFocused(true)}
              onBlur={() => setCodeFocused(false)}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, (loading || !verificationCode) && styles.btnDisabled, highContrast && styles.highContrastBorder]}
              onPress={verifyAndEnableTOTP}
              disabled={loading || !verificationCode}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color={COLORS.textOnPrimary} /> : (
                <Text style={[styles.primaryBtnText, { fontSize: dynBtn }]}>Verify & Enable 2FA</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={handleRetrySetup} activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={14} color={COLORS.primary} />
              <Text style={[styles.ghostBtnText, { fontSize: dynBody }]}>Restart Setup</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP: BACKUP ─────────────────────────────────────── */}
        {step === "backup" && (
          <View style={[styles.card, { backgroundColor: cardBg }, highContrast && styles.highContrastBorder]}>
            <View style={styles.stepIconCircle}>
              <Ionicons name="shield-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: titleCol, fontSize: dynTitle - 2 }]}>
              Save Backup Codes
            </Text>
            <Text style={[styles.stepSubtitle, { color: labelCol, fontSize: dynBody }]}>
              Use these if you ever lose access to Google Authenticator. Each code works once.
            </Text>

            {/* Warning notice */}
            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={16} color={COLORS.warning} />
              <Text style={[styles.warningText, { fontSize: dynBody }]}>
                Save these codes somewhere safe — a password manager or written down securely.
              </Text>
            </View>

            {/* Backup codes grid */}
            <View style={styles.codesGrid}>
              {backupCodes.map((code, i) => (
                <View key={i} style={[styles.codeChip, { backgroundColor: sectionBg, borderColor: COLORS.codeBorder }]}>
                  <Text style={[styles.codeChipNum, { color: labelCol }]}>{i + 1}</Text>
                  <Text style={[styles.codeChipText, { color: titleCol }, largerText && { fontSize: 15 }]}>
                    {code}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, highContrast && styles.highContrastBorder]}
              onPress={completeSetup}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-outline" size={16} color={COLORS.textOnPrimary} />
              <Text style={[styles.primaryBtnText, { fontSize: dynBtn }]}>I've Saved My Codes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={skipBackupCodes} activeOpacity={0.7}>
              <Text style={[styles.ghostBtnText, { color: COLORS.textSoft, fontSize: dynBody - 1, fontStyle: "italic" }]}>
                Skip backup codes (not recommended)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP: COMPLETE ───────────────────────────────────── */}
        {step === "complete" && (
          <View style={[styles.card, { backgroundColor: cardBg }, highContrast && styles.highContrastBorder]}>
            <View style={[styles.stepIconCircle, { backgroundColor: COLORS.successBg }]}>
              <Ionicons name="checkmark-circle-outline" size={32} color={COLORS.success} />
            </View>
            <Text style={[styles.stepTitle, { color: titleCol, fontSize: dynTitle - 2 }]}>
              2FA Enabled!
            </Text>
            <Text style={[styles.stepSubtitle, { color: labelCol, fontSize: dynBody }]}>
              Your account is now protected with Google Authenticator. You'll need a code each time you sign in.
            </Text>

            <View style={[styles.infoBox, { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder, borderWidth: 1 }]}>
              <InfoRow icon="phone-portrait-outline" text="Keep Google Authenticator secure"  largerText={largerText} />
              <InfoRow icon="document-text-outline"  text="Store backup codes safely"          largerText={largerText} />
              <InfoRow icon="phone-landscape-outline" text="Test login on another device"      largerText={largerText} />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, highContrast && styles.highContrastBorder]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryBtnText, { fontSize: dynBtn }]}>Back to Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center", padding: 24 },
  errorText: { fontSize: 16, textAlign: "center", marginBottom: 16, color: COLORS.text },

  // ── Header ───────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: 16,
  },
  headerIconBtn: {
    width: 40, height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerPlaceholder: { width: 40 },

  // ── Scroll ───────────────────────────────────────────────────
  scrollContent: { padding: 16, paddingBottom: 48 },

  // ── Card ──────────────────────────────────────────────────────
  card: {
    borderRadius: RADIUS.lg,
    padding: 22,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // ── Step header ───────────────────────────────────────────────
  stepIconCircle: {
    width: 62, height: 62,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },
  stepTitle: {
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  stepSubtitle: {
    color: COLORS.textSoft,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },

  // ── Info box ──────────────────────────────────────────────────
  infoBox: {
    borderRadius: RADIUS.sm,
    padding: 14,
    marginBottom: 20,
  },

  // ── Secret key box ────────────────────────────────────────────
  secretBox: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  secretRow: { marginBottom: 10 },
  secretMeta: {
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  secretValueRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  secretValue: { fontWeight: "500" },
  secretCode: { fontFamily: "monospace", fontWeight: "700", flex: 1 },
  secretNote: { fontStyle: "italic" },
  secretDivider: { height: 1, marginBottom: 10 },

  // ── Labels ────────────────────────────────────────────────────
  fieldLabel: {
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  fieldHint: {
    color: COLORS.textSoft,
    marginBottom: 8,
    lineHeight: 16,
  },

  // ── Code input ────────────────────────────────────────────────
  codeInput: {
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 8,
    textAlign: "center",
    minHeight: 58,
    marginBottom: 16,
  },
  codeInputFocused: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },

  // ── Buttons ───────────────────────────────────────────────────
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    minHeight: 52,
    marginBottom: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  primaryBtnText: { color: COLORS.textOnPrimary, fontWeight: "700", letterSpacing: 0.3 },

  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    minHeight: 48,
    marginBottom: 10,
    backgroundColor: COLORS.card,
  },
  outlineBtnText: { fontWeight: "600", color: COLORS.textSoft },

  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginBottom: 4,
  },
  ghostBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },

  // ── Warning box ───────────────────────────────────────────────
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: COLORS.warningBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    color: COLORS.warning,
    fontWeight: "500",
    lineHeight: 18,
  },

  // ── Backup codes grid ─────────────────────────────────────────
  codesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  codeChip: {
    width: "47%",
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    position: "relative",
  },
  codeChipNum: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  codeChipText: {
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // ── Accessibility ─────────────────────────────────────────────
  highContrastBorder: { borderWidth: 2, borderColor: COLORS.primary },
});
