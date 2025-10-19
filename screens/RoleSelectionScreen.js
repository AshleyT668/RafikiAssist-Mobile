// screens/RoleSelectionScreen.js
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

export default function RoleSelectionScreen({ navigation, setRole }) {
  const { highContrast, largerText } = useAccessibility();

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
            <Text style={[
              styles.headerTitle,
              largerText && styles.largerHeaderTitle
            ]}>
              Jambo Rafiki
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <ImageBackground
        source={require("../assets/rafiki_background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.content}>
          <Text style={[
            styles.title,
            largerText && styles.largerTitle
          ]}>
            Welcome to Rafiki Assist!
          </Text>
          <Text style={[
            styles.subtitle,
            largerText && styles.largerSubtitle
          ]}>
            Kindly select your role Rafiki
          </Text>

          <TouchableOpacity
            style={[
              styles.button, 
              { backgroundColor: "#3da49a" },
              highContrast && styles.highContrastBorder
            ]}
            onPress={() => {
              setRole("child");
              navigation.navigate("ChildDashboard");
            }}
            accessibilityLabel="I am a child"
            accessibilityRole="button"
            accessibilityHint="Selects child mode with symbol communication"
          >
            <Text style={[
              styles.buttonText,
              largerText && styles.largerButtonText
            ]}>
              I am a child
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              { backgroundColor: "#3da49a" },
              highContrast && styles.highContrastBorder
            ]}
            onPress={() => {
              setRole("caregiver");
              navigation.navigate("CaregiverDashboard");
            }}
            accessibilityLabel="I am a caregiver"
            accessibilityRole="button"
            accessibilityHint="Selects caregiver mode with management features"
          >
            <Text style={[
              styles.buttonText,
              largerText && styles.largerButtonText
            ]}>
              I am a caregiver
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
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 20,
  },
  headerTitle: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "700",
    textAlign: "center",
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: { 
    fontSize: 26, 
    fontWeight: "700", 
    marginBottom: 6, 
    color: "#221717",
    textAlign: "center",
  },
  subtitle: { 
    fontSize: 17, 
    marginBottom: 24, 
    color: "#221717", 
    textAlign: "center",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 10,
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700" 
  },

  // Accessibility Styles
  highContrastBorder: {
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  largerHeaderTitle: {
    fontSize: 20,
  },
  largerTitle: {
    fontSize: 30,
  },
  largerSubtitle: {
    fontSize: 19,
  },
  largerButtonText: {
    fontSize: 18,
  },
});
