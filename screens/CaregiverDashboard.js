// screens/CaregiverDashboard.js
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

export default function CaregiverDashboard({ navigation }) {
  const [user, setUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const { highContrast, largerText } = useAccessibility();

  // DEBUG: Log accessibility values
  console.log('🔍 [CaregiverDashboard] Accessibility values:', {
    highContrast,
    largerText,
  });

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
              style={styles.headerBack} 
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Returns to previous screen"
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={[
              styles.headerTitle,
              largerText && styles.largerHeaderTitle
            ]}>
              Caregiver Dashboard
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              style={[
                styles.profilePhotoWrapper,
                highContrast && styles.highContrastBorder
              ]}
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

      {/* Background Image without dark overlay */}
      <ImageBackground
        source={require("../assets/rafiki_background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Removed dark overlay - content directly on background */}
        <View style={styles.content}>
          <Text style={[
            styles.welcomeTitle,
            largerText && styles.largerWelcomeTitle
          ]}>
            Karibu Rafiki Caregiver
          </Text>
          <Text style={[
            styles.welcomeSubtitle,
            largerText && styles.largerWelcomeSubtitle
          ]}>
            Select an option to get started
          </Text>

          <TouchableOpacity
            style={[
              styles.button, 
              highContrast && styles.highContrastBorder
            ]}
            onPress={() => navigation.navigate("Chatbot")}
            accessibilityLabel="Chat with Rafiki Bot"
            accessibilityRole="button"
            accessibilityHint="Opens chat with Rafiki assistant"
          >
            <Text style={[
              styles.buttonText,
              largerText && styles.largerButtonText
            ]}>
              Chat with Rafiki Bot
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              highContrast && styles.highContrastBorder
            ]}
            onPress={() => navigation.navigate("ManageSymbols")}
            accessibilityLabel="Manage Symbols"
            accessibilityRole="button"
            accessibilityHint="Opens symbol management screen"
          >
            <Text style={[
              styles.buttonText,
              largerText && styles.largerButtonText
            ]}>
              Manage Symbols
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              highContrast && styles.highContrastBorder
            ]}
            onPress={() => navigation.navigate("SymbolAnalytics")}
            accessibilityLabel="View Symbol Analytics"
            accessibilityRole="button"
            accessibilityHint="Opens symbol usage statistics"
          >
            <Text style={[
              styles.buttonText,
              largerText && styles.largerButtonText
            ]}>
              View Symbol Analytics
            </Text>
          </TouchableOpacity>
        </View>
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
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  profilePhotoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profilePhoto: { 
    width: "100%", 
    height: "100%" 
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { 
    alignItems: "center", 
    width: "100%",
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0c0808ff",
    textAlign: "center",
    marginBottom: 8,
    
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#464040ff",
    textAlign: "center",
    marginBottom: 30,
   
  },
  button: {
    backgroundColor: "#3da49a",
    padding: 16,
    borderRadius: 8,
    marginVertical: 10,
    width: "100%",
    maxWidth: 300,
  },
  signOutButton: {
    backgroundColor: "#e57373",
    padding: 16,
    borderRadius: 8,
    marginVertical: 10,
    width: "100%",
    maxWidth: 300,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  signOutButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Accessibility Styles
  highContrastBorder: {
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  largerHeaderTitle: {
    fontSize: 20,
  },
  largerWelcomeTitle: {
    fontSize: 30,
  },
  largerWelcomeSubtitle: {
    fontSize: 18,
  },
  largerButtonText: {
    fontSize: 18,
  },
});
