// screens/TotpVerifyScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { auth } from "../firebaseConfig";

export default function TotpVerifyScreen({ navigation }) {
  const [code, setCode] = useState("");

  const handleVerify = async () => {
    try {
      const res = await fetch("http://localhost:3000/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: auth.currentUser.uid, token: code }),
      });
      const data = await res.json();
      if (data.success) navigation.replace("CaregiverDashboard");
      else Alert.alert("Error", "Invalid code");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter code from Authenticator App</Text>
      <TextInput style={styles.input} value={code} onChangeText={setCode} keyboardType="number-pad" />
      <TouchableOpacity style={styles.button} onPress={handleVerify}><Text style={styles.buttonText}>Verify</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginVertical: 14, width: "80%" },
  button: { backgroundColor: "#8c3cb8", padding: 14, borderRadius: 8, width: "80%" },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" }
});
