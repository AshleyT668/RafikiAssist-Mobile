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
import { useAccessibility } from "../context/AccessibilityContext"; // Add this import

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { highContrast, largerText } = useAccessibility(); // Add accessibility context

  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert("Error", "No user logged in");

    if (newPassword.length < 6) {
      return Alert.alert(
        "Weak Password",
        "New password must be at least 6 characters long"
      );
    }

    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
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

  return (
    <View style={styles.container}>
      {/* Teal Header - Consistent with other screens */}
      <View style={[styles.header, { backgroundColor: '#009688' }]}>
        <StatusBar
          translucent
          backgroundColor="#009688"
          barStyle="light-content"
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={[
                styles.headerBack,
                highContrast && styles.highContrastBorder
              ]} 
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Returns to previous screen without saving changes"
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={[
              styles.headerTitle,
              largerText && styles.largerHeaderTitle
            ]}>
              Change Password
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
      </View>

      <ImageBackground
        source={require("../assets/rafiki_background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Removed dark overlay - content directly on background */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[
              styles.card,
              highContrast && styles.highContrastBorder
            ]}>
              <Text style={[
                styles.title,
                largerText && styles.largerTitle
              ]}>
                Change Password
              </Text>

              <TextInput
                style={[
                  styles.input,
                  largerText && styles.largerInput,
                  highContrast && styles.highContrastInputBorder
                ]}
                placeholder="Current Password"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholderTextColor="#666"
                accessibilityLabel="Current password"
                accessibilityHint="Enter your current password for verification"
              />
              <TextInput
                style={[
                  styles.input,
                  largerText && styles.largerInput,
                  highContrast && styles.highContrastInputBorder
                ]}
                placeholder="New Password"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholderTextColor="#666"
                accessibilityLabel="New password"
                accessibilityHint="Enter your new password, must be at least 6 characters"
              />

              <TouchableOpacity
                style={[
                  styles.button, 
                  loading && { backgroundColor: "#ccc" },
                  highContrast && styles.highContrastBorder
                ]}
                onPress={handleChangePassword}
                disabled={loading}
                accessibilityLabel={loading ? "Updating password" : "Update password"}
                accessibilityRole="button"
                accessibilityHint="Saves the new password after verification"
                accessibilityState={{ disabled: loading }}
              >
                <Text style={[
                  styles.buttonText,
                  largerText && styles.largerButtonText
                ]}>
                  {loading ? "Updating..." : "Update Password"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                accessibilityLabel="Cancel password change"
                accessibilityRole="button"
                accessibilityHint="Returns to previous screen without saving changes"
              >
                <Text style={[
                  styles.cancelText,
                  largerText && styles.largerCancelText
                ]}>
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
  container: { 
    flex: 1,
  },
  header: {
    // Header now covers status bar area
  },
  safeArea: {
    // Safe area for notch devices
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 20,
  },
  headerBack: { 
    padding: 8 
  },
  headerTitle: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "700" 
  },
  headerPlaceholder: { 
    width: 40 
  },
  background: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    color: "#0a0f0eff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#3da49a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 16 
  },
  cancelText: {
    textAlign: "center",
    color: "#3da49a",
    marginTop: 16,
    fontSize: 15,
  },

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
  largerTitle: {
    fontSize: 24,
  },
  largerInput: {
    fontSize: 18,
    paddingVertical: 14,
  },
  largerButtonText: {
    fontSize: 18,
  },
  largerCancelText: {
    fontSize: 17,
  },
});