// components/MainLayout.js
import React from "react";
import { View, StyleSheet } from "react-native";
import BottomNavigation from "./BottomNavigation";

export default function MainLayout({ children, navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>{children}</View>
      <BottomNavigation navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});
