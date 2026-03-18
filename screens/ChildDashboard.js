// screens/ChildDashboard.js - REVAMPED UI (autism-friendly, modern, clean)
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
import { useAccessibility } from "../context/AccessibilityContext";

// ── Design tokens (consistent with LoginScreen & RoleSelectionScreen) ──
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
  overlayBg: "rgba(244, 248, 247, 0.65)",
  emptyText: "#2C3E3D",
  emptyCardBg: "rgba(255,255,255,0.92)",
  labelBg: "#F4F8F7",
};

const RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  full: 999,
};
// ────────────────────────────────────────────────────────────────────────

export default function ChildDashboard({ navigation }) {
  const { symbols, updateSymbolUsage } = useSymbols();
  const [childVoice, setChildVoice] = useState(null);
  const [speakingId, setSpeakingId] = useState(null); // visual feedback on tap
  const { highContrast, largerText } = useAccessibility();

  // ── Voice loading (unchanged) ────────────────────────────────
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

  // ── Symbol press (unchanged logic, added visual feedback) ────
  const handleSymbolPress = async (item) => {
    try {
      Speech.stop();
      setSpeakingId(item.id);
      Speech.speak(item.label, {
        rate: 0.8,
        pitch: 1.2,
        language: "en-US",
        voice: childVoice || undefined,
        onDone: () => setSpeakingId(null),
        onStopped: () => setSpeakingId(null),
      });
      await updateSymbolUsage(item.id);
    } catch (error) {
      console.error("Error during speech:", error);
      setSpeakingId(null);
    }
  };

  // ── Symbol card ───────────────────────────────────────────────
  const renderItem = ({ item }) => {
    const isSpeaking = speakingId === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.symbolCard,
          isSpeaking && styles.symbolCardActive,
          highContrast && styles.highContrastBorder,
        ]}
        onPress={() => handleSymbolPress(item)}
        accessibilityLabel={`Symbol: ${item.label}. Double tap to speak`}
        accessibilityRole="button"
        accessibilityHint="Speaks the symbol label aloud"
        activeOpacity={0.80}
      >
        {/* Image area */}
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🖼️</Text>
          </View>
        )}

        {/* Label strip */}
        <View style={[styles.labelStrip, isSpeaking && styles.labelStripActive]}>
          {isSpeaking && (
            <Ionicons
              name="volume-high"
              size={14}
              color={COLORS.textOnPrimary}
              style={{ marginRight: 4 }}
            />
          )}
          <Text
            style={[
              styles.label,
              isSpeaking && styles.labelActive,
              largerText && styles.largerLabel,
            ]}
            numberOfLines={2}
          >
            {item.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <StatusBar
          translucent
          backgroundColor={COLORS.primary}
          barStyle="light-content"
        />
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={[styles.headerBack, highContrast && styles.highContrastBorder]}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Returns to previous screen"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.textOnPrimary} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, largerText && styles.largerHeaderTitle]}>
              Tap to Speak
            </Text>

            {/* Speaker icon — decorative, right-aligned balance */}
            <View style={styles.headerRight}>
              <Ionicons name="volume-high-outline" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Body */}
      <ImageBackground
        source={require("../assets/rafiki_background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        {symbols.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🗂️</Text>
              <Text style={[styles.empty, largerText && styles.largerEmpty]}>
                No symbols yet
              </Text>
              <Text style={styles.emptyHint}>
                Ask your caregiver to add some!
              </Text>
            </View>
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
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerRight: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Background & overlay ─────────────────────────────────────
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayBg,
  },

  // ── Symbol grid ───────────────────────────────────────────────
  flatListContent: {
    padding: 16,
    paddingBottom: 40,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 14,
  },

  // ── Symbol card ───────────────────────────────────────────────
  symbolCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 140, // large tap target
  },
  symbolCardActive: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },

  // ── Image ─────────────────────────────────────────────────────
  image: {
    width: "100%",
    height: 110,
    resizeMode: "contain",   // show full image, no cropping
    backgroundColor: COLORS.primaryLight, // fill letterbox gaps with soft teal
  },
  imagePlaceholder: {
    width: "100%",
    height: 110,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 36,
  },

  // ── Label strip ───────────────────────────────────────────────
  labelStrip: {
    width: "100%",
    backgroundColor: COLORS.labelBg,
    paddingVertical: 9,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  labelStripActive: {
    backgroundColor: COLORS.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    flexShrink: 1,
  },
  labelActive: {
    color: COLORS.textOnPrimary,
  },

  // ── Empty state ───────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyCard: {
    backgroundColor: COLORS.emptyCardBg,
    borderRadius: RADIUS.lg,
    padding: 32,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  empty: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.textSoft,
    textAlign: "center",
    fontWeight: "400",
  },

  // ── Accessibility ─────────────────────────────────────────────
  highContrastBorder: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  largerHeaderTitle: {
    fontSize: 20,
  },
  largerLabel: {
    fontSize: 17,
  },
  largerEmpty: {
    fontSize: 19,
  },
});