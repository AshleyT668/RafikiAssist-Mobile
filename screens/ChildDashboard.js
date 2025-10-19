import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Platform,
  ImageBackground,
  SafeAreaView,
  StatusBar,
} from "react-native";
import * as Speech from "expo-speech";
import { useSymbols } from "../context/SymbolsContext";
import { Ionicons } from "@expo/vector-icons";
import { useAccessibility } from "../context/AccessibilityContext"; // Add this import

export default function ChildDashboard({ navigation }) {
  const { symbols, updateSymbolUsage } = useSymbols(); // Changed from incrementUsage to updateSymbolUsage
  const [childVoice, setChildVoice] = useState(null);
  const { highContrast, largerText } = useAccessibility(); // Add accessibility context

  useEffect(() => {
    const loadVoice = async () => {
      try {
        await Speech.speak("", { onDone: () => {} });
        setTimeout(async () => {
          const voices = await Speech.getVoicesAsync();
          let selectedVoice = null;

          if (Platform.OS === "ios") {
            selectedVoice = voices.find(
              (v) =>
                v.language === "en-US" &&
                (v.identifier?.includes("Samantha") || v.quality === "Enhanced")
            );
          } else {
            selectedVoice = voices.find(
              (v) => v.language?.startsWith("en") && v.quality === "Enhanced"
            );
          }

          if (!selectedVoice && voices.length > 0) {
            selectedVoice = voices[0];
            console.warn("⚠️ Using fallback voice:", selectedVoice.name);
          }

          setChildVoice(selectedVoice ? selectedVoice.identifier : null);
        }, 800);
      } catch (error) {
        console.log("❌ Error loading voices:", error);
      }
    };

    loadVoice();
  }, []);

  const handleSymbolPress = async (item) => {
    try {
      Speech.stop();
      Speech.speak(item.label, {
        rate: 0.8,
        pitch: 1.2,
        language: "en-US",
        voice: childVoice || undefined,
      });
      await updateSymbolUsage(item.id); // Changed from incrementUsage to updateSymbolUsage
    } catch (error) {
      console.error("Error during speech:", error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.symbolCard,
        highContrast && styles.highContrastBorder // Apply high contrast
      ]}
      onPress={() => handleSymbolPress(item)}
      accessibilityLabel={`Symbol: ${item.label}. Double tap to speak`}
      accessibilityRole="button"
      accessibilityHint="Speaks the symbol label aloud"
    >
      {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
      <Text style={[
        styles.label,
        largerText && styles.largerLabel // Apply larger text
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Teal Header - Fixed to cover status bar area */}
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
              accessibilityHint="Returns to previous screen"
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={[
              styles.headerTitle,
              largerText && styles.largerHeaderTitle // Apply larger text
            ]}>
              Tap to Speak
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
      </View>

      {/* Background Image without Dark Overlay */}
      <ImageBackground
        source={require("../assets/rafiki_background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Removed dark overlay - content directly on background */}
        {symbols.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[
              styles.empty,
              largerText && styles.largerEmpty // Apply larger text
            ]}>
              No symbols yet. Ask caregiver to add some.
            </Text>
          </View>
        ) : (
          <FlatList
            data={symbols}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.flatListContent}
          />
        )}
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
    // Background image starts below the header
  },
  flatListContent: { 
    padding: 12,
    paddingBottom: 40,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  symbolCard: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: "rgb(231, 226, 226)", // Semi-transparent white for better visibility
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: { 
    width: 80, 
    height: 80, 
    borderRadius: 8, 
    marginBottom: 8 
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  empty: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },

  // Accessibility Styles
  highContrastBorder: {
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  largerHeaderTitle: {
    fontSize: 20,
  },
  largerLabel: {
    fontSize: 18,
  },
  largerEmpty: {
    fontSize: 18,
  },
});
