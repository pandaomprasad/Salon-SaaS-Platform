// src/components/ScreenTransition.jsx
import React from "react";
import { StyleSheet, View } from "react-native";

export default function ScreenTransition({ children }) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
