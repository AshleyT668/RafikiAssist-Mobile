// screens/EditProfileScreen.js - REVAMPED UI (autism-friendly, modern, clean)
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAccessibility } from "../context/AccessibilityContext";
import { auth } from "../firebaseConfig";
import {
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ensureUserProfile,
  updateUserProfile,
  uploadProfileImage,
} from "../services/userService";

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
  danger: "#C0392B",
  dangerLight: "#FDECEA",
};

const RADIUS = { sm: 10, md: 14, lg: 18, full: 999 };
// ────────────────────────────────────────────────────────────────

// ── Labelled text input ───────────────────────────────────────────
function LabeledInput({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize, accessibilityLabel, accessibilityHint,
  isDark, largerText, highContrast,
}) {
  const [focused, setFocused] = useState(false);
  const inputBg   = isDark ? "rgba(40,40,40,0.9)" : COLORS.bg;
  const inputText = isDark ? "#E8F4F3" : COLORS.text;
  const labelCol  = isDark ? "#9BBFBB" : COLORS.textSoft;

  return (
    <View style={fieldStyles.group}>
      <Text style={[fieldStyles.label, { color: labelCol }, largerText && { fontSize: 15 }]}>
        {label}
      </Text>
      <TextInput
        style={[
          fieldStyles.input,
          { backgroundColor: inputBg, color: inputText,
            borderColor: focused ? COLORS.borderFocus : (isDark ? "#3A5250" : COLORS.border) },
          focused && fieldStyles.inputFocused,
          highContrast && fieldStyles.highContrastInput,
          largerText && { fontSize: 17, minHeight: 54 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSoft}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      />
    </View>
  );
}
const fieldStyles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSoft,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 15,
    minHeight: 50,
  },
  inputFocused: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  highContrastInput: { borderWidth: 2, borderColor: COLORS.primary },
});
// ────────────────────────────────────────────────────────────────

export default function EditProfileScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { highContrast, largerText } = useAccessibility();

  const [loading, setLoading]               = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [user, setUser]                     = useState(null);
  const [displayName, setDisplayName]       = useState("");
  const [email, setEmail]                   = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [photoURL, setPhotoURL]             = useState("");

  // ── Load user (unchanged) ────────────────────────────────────
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setDisplayName(currentUser.displayName || "");
      setEmail(currentUser.email || "");
      setPhotoURL(currentUser.photoURL || "");
    }
  }, []);

  // ── Image picker (unchanged) ─────────────────────────────────
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow photo access to change profile picture.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  const uploadImage = async (asset) => {
    if (!user) return;
    setUploading(true);
    try {
      const downloadURL = await uploadProfileImage(asset);
      setPhotoURL(downloadURL);
      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      Alert.alert("Upload Failed", error.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  // ── Save profile (unchanged) ─────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updates = {};
      if (displayName !== user.displayName) updates.displayName = displayName;
      if (photoURL !== user.photoURL)       updates.photoURL = photoURL;
      if (Object.keys(updates).length > 0) await updateUserProfile(updates);

      if (email !== user.email && email) {
        if (!currentPassword) {
          Alert.alert("Password Required", "Please enter your current password to change your email.");
          setLoading(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, email);
      }

      await ensureUserProfile(auth.currentUser, {
        displayName: displayName || auth.currentUser?.displayName || "",
        photoURL: photoURL || auth.currentUser?.photoURL || null,
        email: email || auth.currentUser?.email || null,
      });

      await AsyncStorage.setItem("userData", JSON.stringify({
        uid: user.uid,
        displayName: displayName || user.displayName || "",
        photoURL: photoURL || user.photoURL || null,
      }));

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (error) {
      let msg = "Failed to update profile. ";
      if (error.code === "auth/requires-recent-login") msg += "Please sign out and sign in again.";
      else msg += error.message || String(error);
      Alert.alert("Update Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigation.goBack();

  const emailChanged = email !== user?.email;
  const cardBg = isDark ? "rgba(30,30,30,0.97)" : COLORS.card;
  const titleColor = isDark ? "#E8F4F3" : COLORS.text;
  const dynHeaderTitle = largerText ? 20 : 18;
  const dynSectionTitle = largerText ? 18 : 15;
  const dynBtnText = largerText ? 18 : 15;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: isDark ? "#111A19" : COLORS.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      accessible={true}
      accessibilityLabel="Edit profile screen"
    >
      <StatusBar translucent backgroundColor={theme.headerBackground} barStyle="light-content" />

      {/* ── Header ────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: theme.headerIconBackground }, highContrast && styles.highContrastBorder]}
          onPress={handleCancel}
          accessibilityLabel="Cancel editing"
          accessibilityRole="button"
          accessibilityHint="Discards changes and returns to profile"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.headerText} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { fontSize: dynHeaderTitle, color: theme.headerText }]}>Edit Profile</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar card ──────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: cardBg }, highContrast && styles.highContrastBorder]}>
          <Text style={[styles.sectionTitle, { color: titleColor, fontSize: dynSectionTitle }]}>
            Profile Picture
          </Text>

          <View style={styles.avatarBlock}>
            <View style={styles.avatarRing}>
              <Image
                source={
                  photoURL || user?.photoURL
                    ? { uri: photoURL || user.photoURL }
                    : require("../assets/default_avatar.jpg")
                }
                style={styles.avatar}
                accessible={true}
                accessibilityLabel="Current profile picture"
              />
              {/* Upload overlay badge */}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={COLORS.textOnPrimary} />
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.changePhotoBtn,
                { backgroundColor: theme.secondaryCard, borderColor: theme.border },
                highContrast && styles.highContrastBorder,
              ]}
              onPress={pickImage}
              disabled={uploading}
              accessibilityLabel="Change profile picture"
              accessibilityRole="button"
              accessibilityHint="Opens image picker to select new profile photo"
              accessibilityState={{ disabled: uploading }}
              activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={16} color={theme.primary} />
              <Text style={[styles.changePhotoText, largerText && { fontSize: 15 }]}>
                {uploading ? "Uploading…" : "Change Photo"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Personal info card ───────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: cardBg }, highContrast && styles.highContrastBorder]}>
          <Text style={[styles.sectionTitle, { color: titleColor, fontSize: dynSectionTitle }]}>
            Personal Information
          </Text>

          <LabeledInput
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            isDark={isDark}
            largerText={largerText}
            highContrast={highContrast}
            accessibilityLabel="Display name input"
            accessibilityHint="Enter your display name"
          />

          <LabeledInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            isDark={isDark}
            largerText={largerText}
            highContrast={highContrast}
            accessibilityLabel="Email address input"
            accessibilityHint="Enter your email address"
          />

          {/* Password field — only shown when email is being changed */}
          {emailChanged && (
            <View style={styles.passwordNote}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
              <Text style={[styles.passwordNoteText, largerText && { fontSize: 13 }]}>
                Enter your current password to confirm the email change
              </Text>
            </View>
          )}
          {emailChanged && (
            <LabeledInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secureTextEntry
              isDark={isDark}
              largerText={largerText}
              highContrast={highContrast}
              accessibilityLabel="Current password input"
              accessibilityHint="Enter your current password to verify email change"
            />
          )}
        </View>

        {/* ── Action buttons ───────────────────────────────────── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.cancelBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
              highContrast && styles.highContrastBorder,
            ]}
            onPress={handleCancel}
            disabled={loading}
            accessibilityLabel="Cancel changes"
            accessibilityRole="button"
            accessibilityHint="Discards all changes and returns to profile"
            accessibilityState={{ disabled: loading }}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelBtnText, { fontSize: dynBtnText, color: theme.subtext }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: theme.primary, shadowColor: theme.primary },
              loading && styles.saveBtnDisabled,
              highContrast && styles.highContrastBorder,
            ]}
            onPress={handleSaveProfile}
            disabled={loading}
            accessibilityLabel={loading ? "Saving changes" : "Save changes"}
            accessibilityRole="button"
            accessibilityHint="Saves all profile changes"
            accessibilityState={{ disabled: loading }}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.textOnPrimary} />
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={16} color={theme.textOnPrimary} />
                <Text style={[styles.saveBtnText, { fontSize: dynBtnText, color: theme.textOnPrimary }]}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

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

  // ── Scroll ───────────────────────────────────────────────────
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },

  // ── Cards ─────────────────────────────────────────────────────
  card: {
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: 0.2,
  },

  // ── Avatar ────────────────────────────────────────────────────
  avatarBlock: { alignItems: "center" },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: RADIUS.full,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    overflow: "hidden",
    marginBottom: 14,
    position: "relative",
  },
  avatar: { width: "100%", height: "100%" },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(74,173,163,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 18,
    paddingVertical: 9,
    minHeight: 44,
  },
  changePhotoText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
  },

  // ── Password note ─────────────────────────────────────────────
  passwordNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: 12,
  },
  passwordNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primaryDark,
    lineHeight: 18,
    fontWeight: "500",
  },

  // ── Action buttons ────────────────────────────────────────────
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    minHeight: 52,
  },
  cancelBtnText: {
    fontWeight: "600",
    color: COLORS.textSoft,
  },
  saveBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    minHeight: 52,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: COLORS.textOnPrimary,
    fontWeight: "700",
  },

  // ── Accessibility ─────────────────────────────────────────────
  highContrastBorder: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
});
