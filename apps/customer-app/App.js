import React, { useEffect } from "react";
import { View, Platform } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { SharedElementProvider } from "./src/context/SharedElementContext";
import { ErrorProvider } from "./src/context/ErrorContext";
import AppNavigator from "./src/navigation/AppNavigator";
import SharedElementMorphOverlay from "./src/components/SharedElementMorphOverlay";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

let useFonts = null;
let fontMap = {};

try {
  const fontModule = require("expo-font");
  useFonts = fontModule.useFonts;
  const fraunces = require("@expo-google-fonts/fraunces");
  const inter = require("@expo-google-fonts/inter");
  fontMap = {
    Fraunces_600SemiBold: fraunces.Fraunces_600SemiBold,
    Fraunces_500Medium: fraunces.Fraunces_500Medium,
    Fraunces_700Bold: fraunces.Fraunces_700Bold,
    Inter_400Regular: inter.Inter_400Regular,
    Inter_500Medium: inter.Inter_500Medium,
    Inter_600SemiBold: inter.Inter_600SemiBold,
    Inter_700Bold: inter.Inter_700Bold,
  };
} catch (e) {
  console.log("[Fonts] Safe fallback active:", e?.message);
}

try {
  const SplashScreen = require("expo-splash-screen");
  SplashScreen.preventAutoHideAsync().catch(() => {});
} catch (e) {}

function ThemedNavigationBarOverlay() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  if (Platform.OS !== "android" || !insets.bottom) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: insets.bottom,
        backgroundColor: theme.navBarColor || "#000000",
      }}
    />
  );
}

export default function App() {
  const [fontsLoaded] = useFonts ? useFonts(fontMap) : [true];

  useEffect(() => {
    if (fontsLoaded) {
      try {
        const SplashScreen = require("expo-splash-screen");
        SplashScreen.hideAsync().catch(() => {});
      } catch (e) {}
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorProvider>
          <AuthProvider>
            <SharedElementProvider>
              <View style={{ flex: 1 }}>
                <AppNavigator />
                <SharedElementMorphOverlay />
                <ThemedNavigationBarOverlay />
              </View>
            </SharedElementProvider>
          </AuthProvider>
        </ErrorProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
