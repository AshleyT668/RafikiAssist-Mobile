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
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSymbols } from "../context/SymbolsContext";
import { useAccessibility } from "../context/AccessibilityContext";

export default function SymbolAnalytics({ navigation }) {
  const { symbols, resetUsageCounts, lastResetDate } = useSymbols();
  const { highContrast, largerText } = useAccessibility();

  const totalSymbols = symbols.length;
  
  // Get top symbols sorted by usage count
  const topSymbols = [...symbols]
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
    .slice(0, 5);

  // Check if we need to reset (weekly)
  /*const checkAndResetAnalytics = () => {
    const now = new Date();
    const lastReset = lastResetDate ? new Date(lastResetDate) : new Date(0);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (lastReset < oneWeekAgo) {
      resetUsageCounts();
    }
  };*/

  // Check for reset when component mounts
  /*React.useEffect(() => {
    checkAndResetAnalytics();
  }, []);*/

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `${rank}.`;
    }
  };

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

  const handleManualReset = () => {
    Alert.alert(
      "Reset Analytics",
      "Are you sure you want to reset all symbol usage counts? This will start a new weekly tracking period.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => resetUsageCounts()
        }
      ]
    );
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

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
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate("Home");
                }
              }}
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
              Symbol Analytics
            </Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleManualReset}
              accessibilityLabel="Reset analytics"
              accessibilityRole="button"
              accessibilityHint="Resets all symbol usage counts and starts new tracking period"
            >
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Background Image without Dark Overlay */}
      <ImageBackground
        source={require("../assets/rafiki_background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.content}>
          {/* Reset Info Card */}
          <View style={[
            styles.resetInfoCard,
            highContrast && styles.highContrastBorder
          ]}>
            <Text style={[
              styles.resetInfoText,
              largerText && styles.largerResetInfoText
            ]}>
              📊 Weekly Analytics
            </Text>
            <Text style={[
              styles.resetSubText,
              largerText && styles.largerResetSubText
            ]}>
              Resets in: {days}d {hours}h
            </Text>
            <Text style={[
              styles.resetDateText,
              largerText && styles.largerResetDateText
            ]}>
              Next reset: {formatDate(nextReset)}
            </Text>
          </View>

          {/* Summary Card */}
          <View style={[
            styles.summaryCard,
            highContrast && styles.highContrastBorder
          ]}>
            <Text style={[
              styles.summaryText,
              largerText && styles.largerSummaryText
            ]}>
              Total Symbols: <Text style={styles.highlight}>{totalSymbols}</Text>
            </Text>
          </View>

          {/* Top Symbols */}
          {symbols.length === 0 ? (
            <Text style={[
              styles.info,
              largerText && styles.largerInfo
            ]}>
              No symbols added yet.
            </Text>
          ) : (
            <>
              <Text style={[
                styles.subtitle,
                largerText && styles.largerSubtitle
              ]}>
                Top 5 Most Used Symbols
              </Text>
              <FlatList
                data={topSymbols}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <View 
                    style={[
                      styles.symbolCard,
                      highContrast && styles.highContrastBorder
                    ]}
                    accessible={true}
                    accessibilityLabel={`Rank ${index + 1}: ${item.label}, used ${item.usageCount || 0} times`}
                    accessibilityRole="listitem"
                  >
                    <Text style={[
                      styles.rank,
                      largerText && styles.largerRank
                    ]}>
                      {getRankIcon(index + 1)}
                    </Text>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.symbolImage}
                      accessible={true}
                      accessibilityLabel={`Symbol image for ${item.label}`}
                    />
                    <View style={styles.symbolInfo}>
                      <Text style={[
                        styles.symbolName,
                        largerText && styles.largerSymbolName
                      ]}>
                        {item.label}
                      </Text>
                      <Text style={[
                        styles.symbolCount,
                        largerText && styles.largerSymbolCount
                      ]}>
                        {item.usageCount || 0} clicks
                      </Text>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.flatListContent}
                accessibilityLabel="Top 5 most used symbols list"
                accessibilityRole="list"
              />
            </>
          )}
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
    fontWeight: "700" 
  },
  resetButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  headerPlaceholder: { 
    width: 40 
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  resetInfoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  resetInfoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#009688",
    marginBottom: 4,
  },
  resetSubText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  resetDateText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "rgb(231, 226, 226)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  summaryText: {
    fontSize: 18,
    color: "#444",
  },
  highlight: {
    fontWeight: "bold",
    color: "#050b0bff",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0b0a0aff",
    marginBottom: 12,
    textAlign: "center",
  },
  symbolCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgb(231, 226, 226)",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  rank: {
    fontSize: 24,
    width: 40,
    textAlign: "center",
  },
  symbolImage: {
    width: 55,
    height: 55,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  symbolInfo: {
    flex: 1,
  },
  symbolName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  symbolCount: {
    fontSize: 14,
    color: "#777",
  },
  info: {
    textAlign: "center",
    fontSize: 16,
    color: "#ffffff",
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  flatListContent: {
    paddingBottom: 40,
  },

  // Accessibility Styles
  highContrastBorder: {
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  largerHeaderTitle: {
    fontSize: 20,
  },
  largerSummaryText: {
    fontSize: 20,
  },
  largerSubtitle: {
    fontSize: 22,
  },
  largerInfo: {
    fontSize: 18,
  },
  largerRank: {
    fontSize: 26,
  },
  largerSymbolName: {
    fontSize: 18,
  },
  largerSymbolCount: {
    fontSize: 16,
  },
  largerResetInfoText: {
    fontSize: 18,
  },
  largerResetSubText: {
    fontSize: 16,
  },
  largerResetDateText: {
    fontSize: 14,
  },
});