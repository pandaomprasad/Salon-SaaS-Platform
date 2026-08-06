import React from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import { SharedElementProvider } from "./src/context/SharedElementContext";
import { ErrorProvider } from "./src/context/ErrorContext";
import AppNavigator from "./src/navigation/AppNavigator";
import SharedElementMorphOverlay from "./src/components/SharedElementMorphOverlay";
import { ThemeProvider } from "./src/context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <ErrorProvider>
        <AuthProvider>
          <SharedElementProvider>
            <StatusBar style="light" />
            <View style={{ flex: 1 }}>
              <AppNavigator />
              <SharedElementMorphOverlay />
            </View>
          </SharedElementProvider>
        </AuthProvider>
      </ErrorProvider>
    </ThemeProvider>
  );
}
