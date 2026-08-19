import React from "react";
import { View } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { SharedElementProvider } from "./src/context/SharedElementContext";
import { ErrorProvider } from "./src/context/ErrorContext";
import AppNavigator from "./src/navigation/AppNavigator";
import SharedElementMorphOverlay from "./src/components/SharedElementMorphOverlay";
import { ThemeProvider } from "./src/context/ThemeContext";
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>

      <ThemeProvider>
        <ErrorProvider>
          <AuthProvider>
            <SharedElementProvider>
              <View style={{ flex: 1 }}>
                <AppNavigator />
                <SharedElementMorphOverlay />
              </View>
            </SharedElementProvider>
          </AuthProvider>
        </ErrorProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
