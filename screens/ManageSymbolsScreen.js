// screens/ManageSymbolsScreen.js - REVAMPED UI (autism-friendly, modern, clean)
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Alert,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSymbols } from "../context/SymbolsContext";
import { Ionicons } from "@expo/vector-icons";
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
  // Action colours
  updateBg: "#EBF4FF",
  updateText: "#1A6BBF",
  deleteBg: "#FDECEA",
  deleteText: "#C0392B",
  // Add form
  pickBg: "#FFF4E5",
  pickText: "#B45309",
  pickBorder: "#F5C07A",
};

const RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  full: 999,
};
// ────────────────────────────────────────────────────────────────

export default function ManageSymbolsScreen({ navigation }) {
  const { symbols, addSymbol, updateSymbol, deleteSymbol } = useSymbols();
  const [newLabel, setNewLabel] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [labelFocused, setLabelFocused] = useState(false);
  const { highContrast, largerText } = useAccessibility();
  const { theme } = useTheme();

  const dynHeaderTitle = largerText ? 20 : 18;
  const dynLabel = largerText ? 20 : 16;
  const dynBtn = largerText ? 16 : 14;
  const dynInput = largerText ? 18 : 15;

  // ── Image picker (unchanged) ─────────────────────────────────
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType?.Images
        ? [ImagePicker.MediaType.Images]
        : ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
      Alert.alert("Success", "Image selected successfully!");
    }
  };

  // ── Add symbol (unchanged) ───────────────────────────────────
  const handleAdd = () => {
    if (!newLabel.trim() || !newImage) {
      Alert.alert("Error", "Please add both a label and an image");
      return;
    }
    addSymbol({ id: Date.now().toString(), label: newLabel.trim(), image: newImage });
    setNewLabel("");
    setNewImage(null);
    Alert.alert("Success", "Symbol added successfully!");
  };

  // ── Update symbol (unchanged) ────────────────────────────────
  const handleUpdate = (id) => {
    Alert.prompt(
      "Update Symbol",
      "Enter a new label",
      (text) => { if (text.trim()) updateSymbol(id, { label: text.trim() }); },
      "plain-text"
    );
  };

  // ── Delete symbol (unchanged) ────────────────────────────────
  const handleDelete = (id) => {
    Alert.alert("Delete Symbol", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteSymbol(id) },
    ]);
  };

  // ── Symbol row ───────────────────────────────────────────────
  const renderItem = ({ item }) => (
    <View
      style={[
        styles.symbolRow,
        {
          backgroundColor: theme.card,
          shadowColor: theme.shadow,
        },
        highContrast && styles.highContrastBorder,
      ]}
    >
      {/* Thumbnail */}
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={[styles.symbolImage, { backgroundColor: theme.primaryLight }]}
          resizeMode="contain"
          accessible={true}
          accessibilityLabel={`Symbol image for ${item.label}`}
        />
      ) : (
        <View style={[styles.symbolImagePlaceholder, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="image-outline" size={20} color={theme.subtext} />
        </View>
      )}

      {/* Label */}
      <Text
        style={[styles.symbolLabel, { fontSize: dynLabel, color: theme.text }]}
        numberOfLines={1}
      >
        {item.label}
      </Text>

      {/* Action buttons */}
      <TouchableOpacity
        onPress={() => handleUpdate(item.id)}
        style={[styles.updateBtn, { backgroundColor: theme.secondaryCard }]}
        accessibilityLabel={`Update ${item.label}`}
        accessibilityRole="button"
        accessibilityHint="Opens dialog to update symbol label"
        activeOpacity={0.8}
      >
        <Ionicons name="pencil-outline" size={14} color={theme.primary} />
        <Text style={[styles.updateBtnText, { fontSize: dynBtn, color: theme.primary }]}>Edit</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleDelete(item.id)}
        style={[styles.deleteBtn, { backgroundColor: theme.dangerBg }]}
        accessibilityLabel={`Delete ${item.label}`}
        accessibilityRole="button"
        accessibilityHint="Deletes this symbol permanently"
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={14} color={theme.danger} />
        <Text style={[styles.deleteBtnText, { fontSize: dynBtn, color: theme.danger }]}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const hasImageSelected = !!newImage;

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
                else navigation.navigate("Profile");
              }}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              accessibilityHint="Returns to previous screen"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={theme.headerText} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { fontSize: dynHeaderTitle, color: theme.headerText }]}>
              Symbol Manager
            </Text>

            <View style={styles.headerPlaceholder} />
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

        <View style={styles.content}>

          {/* ── Add symbol card ───────────────────────────────── */}
          <View style={[styles.addCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <Text style={[styles.addCardTitle, { color: theme.text }]}>Add New Symbol</Text>

            {/* Label input */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Label</Text>
              <TextInput
                style={[
                  styles.input,
                  labelFocused && styles.inputFocused,
                  { backgroundColor: theme.inputBackground, borderColor: labelFocused ? theme.primary : theme.border, color: theme.text },
                  { fontSize: dynInput },
                  highContrast && styles.highContrastInput,
                ]}
                placeholder="e.g. Water, Toilet, Happy"
                placeholderTextColor={theme.subtext}
                value={newLabel}
                onChangeText={setNewLabel}
                onFocus={() => setLabelFocused(true)}
                onBlur={() => setLabelFocused(false)}
                accessibilityLabel="Symbol label input"
                accessibilityHint="Enter the name for the new symbol"
              />
            </View>

            {/* Image picker + Upload row */}
            <View style={styles.addActionRow}>
              {/* Pick image */}
              <TouchableOpacity
                style={[
                  styles.pickBtn,
                  hasImageSelected && styles.pickBtnSelected,
                  highContrast && styles.highContrastBorder,
                ]}
                onPress={pickImage}
                accessibilityLabel={hasImageSelected ? "Image selected" : "Add image"}
                accessibilityRole="button"
                accessibilityHint="Opens image picker to select a symbol image"
                activeOpacity={0.85}
              >
                <Ionicons
                  name={hasImageSelected ? "checkmark-circle-outline" : "image-outline"}
                  size={16}
                  color={hasImageSelected ? theme.primary : COLORS.pickText}
                />
                <Text style={[
                  styles.pickBtnText,
                  hasImageSelected && styles.pickBtnTextSelected,
                  { fontSize: dynBtn },
                ]}>
                  {hasImageSelected ? "Image Ready" : "Pick Image"}
                </Text>
              </TouchableOpacity>

              {/* Preview thumbnail */}
              {hasImageSelected && (
                <Image
                  source={{ uri: newImage }}
                  style={styles.previewThumb}
                  resizeMode="contain"
                />
              )}

              {/* Upload / Add */}
              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  {
                    backgroundColor: !newLabel.trim() || !hasImageSelected ? theme.secondaryCard : theme.primary,
                    shadowColor: theme.primary,
                  },
                  (!newLabel.trim() || !hasImageSelected) && styles.uploadBtnDisabled,
                  highContrast && styles.highContrastBorder,
                ]}
                onPress={handleAdd}
                disabled={!newLabel.trim() || !hasImageSelected}
                accessibilityLabel="Upload symbol"
                accessibilityRole="button"
                accessibilityHint="Adds the new symbol with label and image"
                activeOpacity={0.85}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={16}
                  color={!newLabel.trim() || !hasImageSelected ? theme.subtext : theme.textOnPrimary}
                />
                <Text
                  style={[
                    styles.uploadBtnText,
                    {
                      fontSize: dynBtn,
                      color: !newLabel.trim() || !hasImageSelected ? theme.subtext : theme.textOnPrimary,
                    },
                  ]}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Symbol list ───────────────────────────────────── */}
          {symbols.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                  },
                  highContrast && styles.highContrastBorder,
                ]}
              >
                <Ionicons name="grid-outline" size={40} color={theme.primary} style={{ marginBottom: 10 }} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No symbols yet</Text>
                <Text style={[styles.emptyHint, { color: theme.subtext }]}>Add your first symbol above</Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={symbols}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.flatListContent}
              accessibilityLabel="List of symbols"
              accessibilityRole="list"
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Layout ───────────────────────────────────────────────────
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
  headerPlaceholder: { width: 40 },

  // ── Background & overlay ─────────────────────────────────────
  background: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayBg,
  },

  // ── Content ───────────────────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ── Add symbol card ───────────────────────────────────────────
  addCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  addCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSoft,
    marginBottom: 5,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: COLORS.text,
    minHeight: 48,
  },
  inputFocused: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  highContrastInput: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  // ── Add action row ────────────────────────────────────────────
  addActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.pickBg,
    borderWidth: 1.5,
    borderColor: COLORS.pickBorder,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  pickBtnSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  pickBtnText: {
    color: COLORS.pickText,
    fontWeight: "600",
  },
  pickBtnTextSelected: {
    color: COLORS.primary,
  },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
    minHeight: 44,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  uploadBtnDisabled: {
    backgroundColor: COLORS.primaryLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadBtnText: {
    color: COLORS.textOnPrimary,
    fontWeight: "700",
  },

  // ── Symbol rows ───────────────────────────────────────────────
  flatListContent: { paddingBottom: 40 },
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
    minHeight: 64,
  },
  symbolImage: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    flexShrink: 0,
  },
  symbolImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  symbolLabel: {
    flex: 1,
    fontWeight: "600",
    color: COLORS.text,
  },

  // ── Action buttons ────────────────────────────────────────────
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.updateBg,
    borderRadius: RADIUS.sm,
    paddingVertical: 7,
    paddingHorizontal: 10,
    minHeight: 36,
  },
  updateBtnText: {
    color: COLORS.updateText,
    fontWeight: "600",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.deleteBg,
    borderRadius: RADIUS.sm,
    paddingVertical: 7,
    paddingHorizontal: 10,
    minHeight: 36,
  },
  deleteBtnText: {
    color: COLORS.deleteText,
    fontWeight: "600",
  },

  // ── Empty state ───────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyCard: {
    borderRadius: RADIUS.lg,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    width: "100%",
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.textSoft,
    textAlign: "center",
  },

  // ── Accessibility ─────────────────────────────────────────────
  highContrastBorder: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
});
