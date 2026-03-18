// screens/SymbolAnalytics.js - REVAMPED UI (autism-friendly, modern, clean)
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSymbols } from "../context/SymbolsContext";
import { useAccessibility } from "../context/AccessibilityContext";
import { useTheme } from "../context/ThemeContext";

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
  overlayBg: "rgba(244, 248, 247, 0.72)",
  // Stat cards
  statBg: "#E6F4F3",
  statValue: "#2C3E3D",
  statLabel: "#6B8280",
  // Reset timer
  timerBg: "#F0FAF9",
  timerBorder: "#C2E5E2",
  // Rank medal colours
  gold: "#F5A623",
  silver: "#9B9B9B",
  bronze: "#CD7F32",
};

const RADIUS = { sm: 10, md: 14, lg: 18, full: 999 };

// Rank badge — medal colours for top 3, muted pill for the rest
const RankBadge = ({ rank, largerText }) => {
  const isGold   = rank === 1;
  const isSilver = rank === 2;
  const isBronze = rank === 3;
  const medalColor = isGold ? COLORS.gold : isSilver ? COLORS.silver : isBronze ? COLORS.bronze : null;
  const medalEmoji = isGold ? "🥇" : isSilver ? "🥈" : isBronze ? "🥉" : null;

  if (medalEmoji) {
    return (
      <Text style={{ fontSize: largerText ? 28 : 24, width: 36, textAlign: "center" }}>
        {medalEmoji}
      </Text>
    );
  }
  return (
    <View style={rankStyles.pill}>
      <Text style={[rankStyles.pillText, largerText && { fontSize: 14 }]}>{rank}</Text>
    </View>
  );
};
const rankStyles = StyleSheet.create({
  pill: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
});
// ────────────────────────────────────────────────────────────────

export default function SymbolAnalytics({ navigation }) {
  const { symbols, resetUsageCounts, lastResetDate } = useSymbols();
  const { highContrast, largerText } = useAccessibility();
  const { theme, isDark } = useTheme();

  const totalSymbols = symbols.length;
  const totalClicks = symbols.reduce((sum, s) => sum + (s.usageCount || 0), 0);

  // Top 5 sorted by usage (unchanged logic)
  const topSymbols = [...symbols]
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
    .slice(0, 5);

  // Time until reset (unchanged logic)
  const getTimeUntilNextReset = () => {
    const now = new Date();
    const lastReset = lastResetDate ? new Date(lastResetDate) : new Date();
    const nextReset = new Date(lastReset.getTime() + 7 * 24 * 60 * 60 * 1000);
    const timeDiff = nextReset - now;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours, nextReset };
  };
  const { days, hours, nextReset } = getTimeUntilNextReset();

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Reset handler (unchanged logic)
  const handleManualReset = () => {
    Alert.alert(
      "Reset Analytics",
      "Are you sure you want to reset all symbol usage counts? This will start a new weekly tracking period.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => resetUsageCounts() },
      ]
    );
  };

  const dynHeaderTitle = largerText ? 20 : 18;
  const dynBody       = largerText ? 16 : 14;
  const dynSmall      = largerText ? 14 : 12;
  const dynSubtitle   = largerText ? 18 : 15;
  const dynSymbolName = largerText ? 18 : 15;
  const dynSymbolCount= largerText ? 16 : 13;

  // ── Symbol card ───────────────────────────────────────────────
  const renderItem = ({ item, index }) => {
    const usage = item.usageCount || 0;
    const maxUsage = topSymbols[0]?.usageCount || 1;
    const barWidth = maxUsage > 0 ? Math.max((usage / maxUsage) * 100, 4) : 4;

    return (
      <View
        style={[styles.symbolCard, highContrast && styles.highContrastBorder]}
        accessible={true}
        accessibilityLabel={`Rank ${index + 1}: ${item.label}, used ${usage} times`}
        accessibilityRole="listitem"
      >
        {/* Rank */}
        <RankBadge rank={index + 1} largerText={largerText} />

        {/* Image */}
        <Image
          source={{ uri: item.image }}
          style={styles.symbolImage}
          resizeMode="contain"
          accessible={true}
          accessibilityLabel={`Symbol image for ${item.label}`}
        />

        {/* Info + bar */}
        <View style={styles.symbolInfo}>
          <Text style={[styles.symbolName, { fontSize: dynSymbolName }]} numberOfLines={1}>
            {item.label}
          </Text>

          {/* Usage bar */}
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${barWidth}%` }]} />
          </View>

          <Text style={[styles.symbolCount, { fontSize: dynSymbolCount }]}>
            {usage} {usage === 1 ? "tap" : "taps"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <StatusBar
          translucent
          backgroundColor={theme.primary}
          barStyle="light-content"
        />
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: theme.headerIconBackground }, highContrast && styles.highContrastBorder]}
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
                else navigation.navigate("Home");
              }}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Returns to previous screen"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={theme.headerText} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { fontSize: dynHeaderTitle, color: theme.headerText }]}>
              Symbol Analytics
            </Text>

            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: theme.headerIconBackground }]}
              onPress={handleManualReset}
              accessibilityLabel="Reset analytics"
              accessibilityRole="button"
              accessibilityHint="Resets all symbol usage counts and starts new tracking period"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="refresh-outline" size={20} color={theme.headerText} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Body ────────────────────────────────────────────────── */}
      <ImageBackground
        source={require("../assets/rafiki_background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]} />

        <FlatList
          data={topSymbols}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          accessibilityLabel="Top 5 most used symbols list"
          accessibilityRole="list"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* ── Stat pills row ───────────────────────────── */}
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                  <Text style={[styles.statValue, { color: theme.text, fontSize: largerText ? 28 : 24 }]}>
                    {totalSymbols}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.subtext, fontSize: dynSmall }]}>Symbols</Text>
                </View>

                <View style={[styles.statCard, styles.statCardAccent, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.statValueAccent, { fontSize: largerText ? 28 : 24 }]}>
                    {totalClicks}
                  </Text>
                  <Text style={[styles.statLabelAccent, { fontSize: dynSmall }]}>Total Taps</Text>
                </View>
              </View>

              {/* ── Reset timer card ─────────────────────────── */}
              <View style={[styles.timerCard, { backgroundColor: isDark ? theme.secondaryCard : COLORS.timerBg, borderColor: theme.border }, highContrast && styles.highContrastBorder]}>
                <View style={styles.timerLeft}>
                  <Ionicons name="time-outline" size={18} color={theme.primary} />
                  <View>
                    <Text style={[styles.timerTitle, { color: theme.text, fontSize: dynBody }]}>
                      Weekly Reset
                    </Text>
                    <Text style={[styles.timerDate, { color: theme.subtext, fontSize: dynSmall }]}>
                      {formatDate(nextReset)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.timerBadge, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.timerBadgeText, { color: theme.primaryDark, fontSize: dynSmall }]}>
                    {days}d {hours}h
                  </Text>
                </View>
              </View>

              {/* ── List heading ─────────────────────────────── */}
              {symbols.length > 0 && (
                <Text style={[styles.sectionTitle, { color: theme.text, fontSize: dynSubtitle }]}>
                  Top {topSymbols.length} Most Used
                </Text>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="bar-chart-outline" size={40} color={theme.primary} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyText, { color: theme.text, fontSize: dynBody + 2 }]}>No data yet</Text>
              <Text style={[styles.emptyHint, { color: theme.subtext, fontSize: dynBody }]}>
                Usage stats appear once the child starts tapping symbols
              </Text>
            </View>
          }
        />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ───────────────────────────────────────────────────
  header: { backgroundColor: COLORS.primary },
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

  // ── Background & overlay ─────────────────────────────────────
  background: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayBg,
  },

  // ── List container ────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ── Stat cards row ────────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardAccent: {
    backgroundColor: COLORS.primary,
  },
  statValue: {
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  statValueAccent: {
    fontWeight: "700",
    color: COLORS.textOnPrimary,
    marginBottom: 2,
  },
  statLabel: {
    color: COLORS.textSoft,
    fontWeight: "500",
  },
  statLabelAccent: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },

  // ── Timer card ────────────────────────────────────────────────
  timerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.timerBg,
    borderWidth: 1,
    borderColor: COLORS.timerBorder,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  timerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  timerTitle: {
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  timerDate: {
    color: COLORS.textSoft,
  },
  timerBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  timerBadgeText: {
    color: COLORS.primaryDark,
    fontWeight: "700",
  },

  // ── Section title ─────────────────────────────────────────────
  sectionTitle: {
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: 0.2,
  },

  // ── Symbol card ───────────────────────────────────────────────
  symbolCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
    minHeight: 72,
  },
  symbolImage: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    flexShrink: 0,
  },
  symbolInfo: {
    flex: 1,
    gap: 4,
  },
  symbolName: {
    fontWeight: "700",
    color: COLORS.text,
  },
  // Usage bar
  barTrack: {
    height: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  symbolCount: {
    color: COLORS.textSoft,
    fontWeight: "500",
  },

  // ── Empty state ───────────────────────────────────────────────
  emptyCard: {
    backgroundColor: "rgba(255,255,255,0.93)",
    borderRadius: RADIUS.lg,
    padding: 32,
    alignItems: "center",
    marginTop: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyText: {
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyHint: {
    color: COLORS.textSoft,
    textAlign: "center",
    lineHeight: 20,
  },

  // ── Accessibility ─────────────────────────────────────────────
  highContrastBorder: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
});
