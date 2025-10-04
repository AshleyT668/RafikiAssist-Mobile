// screens/ManageSymbolsScreen.js
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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSymbols } from "../context/SymbolsContext";

export default function ManageSymbolsScreen({ navigation }) {
  const { symbols, addSymbol, updateSymbol, deleteSymbol } = useSymbols();
  const [newLabel, setNewLabel] = useState("");
  const [newImage, setNewImage] = useState(null);

  // Pick an image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
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
    <View style={styles.symbolRow}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.symbolImage} />
      )}
      <Text style={styles.symbolLabel}>{item.label}</Text>
      <TouchableOpacity
        onPress={() => handleUpdate(item.id)}
        style={styles.actionButton}
      >
        <Text style={styles.updateText}>Update</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleDelete(item.id)}
        style={styles.actionButton}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={require("../assets/rafiki_background.png")} // update with your image path
      style={styles.container}
      resizeMode="cover"
    >
      {/* Overlay to make text readable */}
      <View style={styles.overlay}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Symbol Manager</Text>

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Symbol label"
            value={newLabel}
            onChangeText={setNewLabel}
          />
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>
              {newImage ? "✓ Image" : "Add Image"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* List of symbols */}
        <FlatList
          data={symbols}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    flex: 1,
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.3)", // subtle dark overlay
  },
  backButton: { marginBottom: 15 },
  backButtonText: { fontSize: 16, color: "#fff", fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#fff" },
  inputRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  imageButton: {
    marginLeft: 10,
    backgroundColor: "#ff9800",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  imageButtonText: { color: "#fff", fontWeight: "bold" },
  addButton: {
    marginLeft: 10,
    backgroundColor: "#3da49a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },
  symbolImage: { width: 40, height: 40, borderRadius: 6, marginRight: 12 },
  symbolLabel: { flex: 1, fontSize: 18, color: "#333" },
  actionButton: { marginLeft: 10 },
  updateText: { color: "#1976d2", fontWeight: "bold" },
  deleteText: { color: "#e53935", fontWeight: "bold" },
});
