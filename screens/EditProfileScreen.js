// screens/EditProfileScreen.js
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAccessibility } from "../context/AccessibilityContext"; // Add this import
import { auth, storage, db } from "../firebaseConfig";
import {
  updateProfile,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditProfileScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { highContrast, largerText } = useAccessibility(); // Add accessibility context
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setDisplayName(currentUser.displayName || "");
      setEmail(currentUser.email || "");
      setPhotoURL(currentUser.photoURL || "");
    }
  }, []);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow photo access to change profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.Images],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        await uploadImage(selectedUri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  const uploadImage = async (uri) => {
    if (!user) return;
    setUploading(true);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `profileImages/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);
      setPhotoURL(downloadURL);

      await updateProfile(user, { photoURL: downloadURL });
      await setDoc(
        doc(db, "users", user.uid),
        { photoURL: downloadURL, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload Failed", error.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const updates = {};
      if (displayName !== user.displayName) updates.displayName = displayName;
      if (photoURL !== user.photoURL) updates.photoURL = photoURL;

      if (Object.keys(updates).length > 0) {
        await updateProfile(user, updates);
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          displayName: displayName || user.displayName || "",
          photoURL: photoURL || user.photoURL || null,
          email: email || user.email,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

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

      await AsyncStorage.setItem(
        "userData",
        JSON.stringify({
          uid: user.uid,
          displayName: displayName || user.displayName || "",
          photoURL: photoURL || user.photoURL || null,
        })
      );

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Update error:", error);
      let msg = "Failed to update profile. ";
      if (error.code === "auth/requires-recent-login")
        msg += "Please sign out and sign in again.";
      else msg += error.message || String(error);
      Alert.alert("Update Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigation.goBack();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      accessible={true}
      accessibilityLabel="Edit profile screen"
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity 
            style={[
              styles.headerBack,
              highContrast && styles.highContrastBorder
            ]} 
            onPress={handleCancel}
            accessibilityLabel="Cancel editing"
            accessibilityRole="button"
            accessibilityHint="Discards changes and returns to profile"
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={[
            styles.headerTitle,
            largerText && styles.largerHeaderTitle
          ]}>
            Edit Profile
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.content}>
          <View style={[
            styles.section, 
            { backgroundColor: theme.card },
            highContrast && styles.highContrastBorder
          ]}>
            <Text style={[
              styles.sectionTitle, 
              { color: theme.text },
              largerText && styles.largerSectionTitle
            ]}>
              Profile Picture
            </Text>
            <View style={styles.photoSection}>
              <Image
                source={
                  photoURL || user?.photoURL 
                    ? { uri: photoURL || user.photoURL } 
                    : require("../assets/default_avatar.jpg") // Change this to your asset
                }
                style={[
                  styles.avatar,
                  highContrast && styles.highContrastBorder
                ]}
                accessible={true}
                accessibilityLabel="Current profile picture"
              />
              <TouchableOpacity
                style={[
                  styles.changePhotoBtn, 
                  { backgroundColor: theme.primary },
                  highContrast && styles.highContrastBorder
                ]}
                onPress={pickImage}
                disabled={uploading}
                accessibilityLabel="Change profile picture"
                accessibilityRole="button"
                accessibilityHint="Opens image picker to select new profile photo"
                accessibilityState={{ disabled: uploading }}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="camera" size={18} color="#fff" />
                    <Text style={[
                      styles.changePhotoText,
                      largerText && styles.largerButtonText
                    ]}>
                      Change Photo
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={[
            styles.section, 
            { backgroundColor: theme.card },
            highContrast && styles.highContrastBorder
          ]}>
            <Text style={[
              styles.sectionTitle, 
              { color: theme.text },
              largerText && styles.largerSectionTitle
            ]}>
              Personal Information
            </Text>
            <View style={styles.inputGroup}>
              <Text style={[
                styles.inputLabel, 
                { color: theme.text },
                largerText && styles.largerInputLabel
              ]}>
                Display Name
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa", color: theme.text },
                  largerText && styles.largerTextInput,
                  highContrast && styles.highContrastInputBorder
                ]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor={theme.subtext}
                accessibilityLabel="Display name input"
                accessibilityHint="Enter your display name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[
                styles.inputLabel, 
                { color: theme.text },
                largerText && styles.largerInputLabel
              ]}>
                Email Address
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa", color: theme.text },
                  largerText && styles.largerTextInput,
                  highContrast && styles.highContrastInputBorder
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={theme.subtext}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Email address input"
                accessibilityHint="Enter your email address"
              />
            </View>

            {email !== user?.email && (
              <View style={styles.inputGroup}>
                <Text style={[
                  styles.inputLabel, 
                  { color: theme.text },
                  largerText && styles.largerInputLabel
                ]}>
                  Current Password (required to change email)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa", color: theme.text },
                    largerText && styles.largerTextInput,
                    highContrast && styles.highContrastInputBorder
                  ]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={theme.subtext}
                  secureTextEntry
                  accessibilityLabel="Current password input"
                  accessibilityHint="Enter your current password to verify email change"
                />
              </View>
            )}
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[
                styles.cancelButton, 
                { borderColor: theme.primary },
                highContrast && styles.highContrastBorder
              ]}
              onPress={handleCancel}
              disabled={loading}
              accessibilityLabel="Cancel changes"
              accessibilityRole="button"
              accessibilityHint="Discards all changes and returns to profile"
              accessibilityState={{ disabled: loading }}
            >
              <Text style={[
                styles.cancelButtonText, 
                { color: theme.primary },
                largerText && styles.largerButtonText
              ]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1 },
                highContrast && styles.highContrastBorder
              ]}
              onPress={handleSaveProfile}
              disabled={loading}
              accessibilityLabel={loading ? "Saving changes" : "Save changes"}
              accessibilityRole="button"
              accessibilityHint="Saves all profile changes"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[
                  styles.saveButtonText,
                  largerText && styles.largerButtonText
                ]}>
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerBack: { padding: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerPlaceholder: { width: 40 },
  content: { padding: 16 },
  section: { padding: 20, borderRadius: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  photoSection: { alignItems: "center" },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  changePhotoText: { color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 14 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  actionsSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginRight: 8,
  },
  cancelButtonText: { fontWeight: "700", fontSize: 16 },
  saveButton: {
    flex: 2,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginLeft: 8,
  },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // Accessibility Styles
  highContrastBorder: {
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  highContrastInputBorder: {
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  largerHeaderTitle: {
    fontSize: 20,
  },
  largerSectionTitle: {
    fontSize: 20,
  },
  largerInputLabel: {
    fontSize: 16,
  },
  largerTextInput: {
    fontSize: 18,
    paddingVertical: 14,
  },
  largerButtonText: {
    fontSize: 18,
  },
});