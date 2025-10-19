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
import { useAccessibility } from "../context/AccessibilityContext"; // Add this import

export default function ManageSymbolsScreen({ navigation }) {
  const { symbols, addSymbol, updateSymbol, deleteSymbol } = useSymbols();
  const [newLabel, setNewLabel] = useState("");
  const [newImage, setNewImage] = useState(null);
  const { highContrast, largerText } = useAccessibility(); // Add accessibility context

  // Pick an image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
      Alert.alert("Success", "Image selected successfully!");
    }
  };

  // Add new symbol
  const handleAdd = () => {
    if (!newLabel.trim() || !newImage) {
      Alert.alert("Error", "Please add both a label and an image");
      return;
    }
    addSymbol({
      id: Date.now().toString(),
      label: newLabel.trim(),
      image: newImage,
    });
    setNewLabel("");
    setNewImage(null);
    Alert.alert("Success", "Symbol added successfully!");
  };

  // Update symbol
  const handleUpdate = (id) => {
    Alert.prompt(
      "Update Symbol",
      "Enter a new label",
      (text) => {
        if (text.trim()) {
          updateSymbol(id, { label: text.trim() });
        }
      },
      "plain-text"
    );
  };

  // Delete symbol
  const handleDelete = (id) => {
    Alert.alert("Delete Symbol", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteSymbol(id) },
    ]);
  };

  // Render a symbol item
  const renderItem = ({ item }) => (
    <View style={[
      styles.symbolRow,
      highContrast && styles.highContrastBorder // Apply high contrast
    ]}>
      {item.image && (
        <Image 
          source={{ uri: item.image }} 
          style={styles.symbolImage}
          accessible={true}
          accessibilityLabel={`Symbol image for ${item.label}`}
        />
      )}
      <Text style={[
        styles.symbolLabel,
        largerText && styles.largerSymbolLabel // Apply larger text
      ]}>
        {item.label}
      </Text>
      <TouchableOpacity 
        onPress={() => handleUpdate(item.id)} 
        style={styles.actionButton}
        accessibilityLabel={`Update ${item.label}`}
        accessibilityRole="button"
        accessibilityHint="Opens dialog to update symbol label"
      >
        <Text style={[
          styles.updateText,
          largerText && styles.largerActionText // Apply larger text
        ]}>
          Update
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => handleDelete(item.id)} 
        style={styles.actionButton}
        accessibilityLabel={`Delete ${item.label}`}
        accessibilityRole="button"
        accessibilityHint="Deletes this symbol permanently"
      >
        <Text style={[
          styles.deleteText,
          largerText && styles.largerActionText // Apply larger text
        ]}>
          Delete
        </Text>
      </TouchableOpacity>
    </View>
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
              largerText && styles.largerHeaderTitle // Apply larger text
            ]}>
              Symbol Manager
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
        <View style={styles.content}>
          {/* Input row */}
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input, 
                { flex: 1 },
                largerText && styles.largerInputText, // Apply larger text
                highContrast && styles.highContrastInputBorder // Apply high contrast
              ]}
              placeholder="Label"
              value={newLabel}
              onChangeText={setNewLabel}
              placeholderTextColor="#666"
              accessibilityLabel="Symbol label input"
              accessibilityHint="Enter the name for the new symbol"
            />
            <TouchableOpacity 
              style={[
                styles.imageButton,
                highContrast && styles.highContrastBorder
              ]} 
              onPress={pickImage}
              accessibilityLabel={newImage ? "Image selected" : "Add image"}
              accessibilityRole="button"
              accessibilityHint="Opens image picker to select a symbol image"
            >
              <Text style={[
                styles.imageButtonText,
                largerText && styles.largerButtonText // Apply larger text
              ]}>
                {newImage ? "✓ Image" : "Add Image"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.addButton,
                highContrast && styles.highContrastBorder
              ]} 
              onPress={handleAdd}
              accessibilityLabel="Upload symbol"
              accessibilityRole="button"
              accessibilityHint="Adds the new symbol with label and image"
            >
              <Text style={[
                styles.addButtonText,
                largerText && styles.largerButtonText // Apply larger text
              ]}>
                Upload
              </Text>
            </TouchableOpacity>
          </View>

          {/* List of symbols */}
          <FlatList
            data={symbols}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.flatListContent}
            accessibilityLabel="List of symbols"
            accessibilityRole="list"
          />
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
  headerPlaceholder: { 
    width: 40 
  },
  background: {
    flex: 1,
    // Background image starts below the header
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Semi-transparent white for better visibility
    padding: 12,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  imageButton: {
    marginLeft: 10,
    backgroundColor: "#ff9800",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  imageButtonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 14,
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: "#3da49a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgb(231, 226, 226)", // Semi-transparent white
    padding: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  symbolImage: { 
    width: 40, 
    height: 40, 
    borderRadius: 6, 
    marginRight: 12 
  },
  symbolLabel: { 
    flex: 1, 
    fontSize: 18, 
    color: "#333" 
  },
  actionButton: { 
    marginLeft: 10 
  },
  updateText: { 
    color: "#1976d2", 
    fontWeight: "bold",
    fontSize: 14,
  },
  deleteText: { 
    color: "#e53935", 
    fontWeight: "bold",
    fontSize: 14,
  },
  flatListContent: { 
    paddingBottom: 40 
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
  largerInputText: {
    fontSize: 18,
  },
  largerButtonText: {
    fontSize: 16,
  },
  largerSymbolLabel: {
    fontSize: 20,
  },
  largerActionText: {
    fontSize: 16,
  },
});
