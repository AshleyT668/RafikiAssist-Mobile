// screens/ChildDashboard.js
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
} from "react-native";
import * as Speech from "expo-speech";
import { useSymbols } from "../context/SymbolsContext";

export default function ChildDashboard({ navigation }) {
  const { symbols } = useSymbols();
  const [childVoice, setChildVoice] = useState(null);

  // Automatically pick a smooth, child-friendly voice
  useEffect(() => {
    const loadVoice = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        let selectedVoice = null;

        if (Platform.OS === "ios") {
          selectedVoice = voices.find(
            (v) =>
              v.language === "en-US" &&
              (v.identifier.includes("Samantha") || v.quality === "Enhanced")
          );
        } else {
          selectedVoice = voices.find(
            (v) => v.language.startsWith("en") && v.quality === "Enhanced"
          );
        }

        setChildVoice(selectedVoice ? selectedVoice.identifier : null);
      } catch (error) {
        console.log("Error loading voices:", error);
      }
    };

    loadVoice();
  }, []);

  const speakLabel = (label) => {
    Speech.stop();
    Speech.speak(label, {
      rate: 0.8,
      pitch: 1.2,
      language: "en-US",
      voice: childVoice || undefined,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.symbolCard}
      onPress={() => speakLabel(item.label)}
    >
      {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
      <Text style={styles.label}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require("../assets/rafiki_background.png")} // replace with your image path
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>My Symbols</Text>

        {symbols.length === 0 ? (
          <Text style={styles.empty}>No symbols yet. Ask caregiver to add some.</Text>
        ) : (
          <FlatList
            data={symbols}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    flex: 1,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.25)", // subtle dark overlay
  },
  backButton: {
    marginBottom: 10,
    padding: 6,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 16,
    color: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  symbolCard: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  image: { width: 80, height: 80, borderRadius: 8, marginBottom: 8 },
  label: { fontSize: 16, fontWeight: "600", color: "#333", textAlign: "center" },
  empty: { fontSize: 16, color: "#fff", textAlign: "center", marginTop: 20 },
});
