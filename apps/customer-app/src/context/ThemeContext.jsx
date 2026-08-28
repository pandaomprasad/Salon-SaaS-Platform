// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Animated, Easing, Platform, useColorScheme } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { storage } from "../services/storage";
import { applyTheme } from "../theme";

const THEME_MODE_KEY = "@salon_app_theme_mode";

// ── Light Tokens (Luxe Cream & Gold Accent) ───────────────
export const LIGHT = {
  isDark: false,
  canvas: "#FBFBF9",
  canvasSoft: "#F5F5F0",
  surface: "#FFFFFF",
  ink: "#121212",
  body: "#4A4A4A",
  muted: "#8E8E8A",
  mutedSoft: "#A0A09C",
  primary: "#C48B36",
  primaryActive: "#B87E2C",
  onPrimary: "#FFFFFF",
  hairline: "#E8E8E0",
  hairlineSoft: "#F0F0EB",
  hairlineStrong: "#D0D0C8",
  surfaceStrong: "#F5F5F0",
  thinking: "rgba(196, 139, 54, 0.15)",
  grep: "#E8E8E0",
  read: "#E8E8E0",
  edit: "#E8E8E0",
  done: "#C48B36",
  error: "#C48B36",
  errorBg: "rgba(196, 139, 54, 0.08)",
  success: "#121212",
  successBg: "rgba(18, 18, 18, 0.06)",
  tabBg: "#FFFFFF",
  tabBorder: "#E8E8E0",
  statusBar: "dark-content",
  navBarColor: "#fff",
  navBarButtonStyle: "dark",
};

// ── Dark Tokens (Luxe Obsidian & Gold Accent) ─────────────
export const DARK = {
  isDark: true,
  canvas: "#0D0D0D",
  canvasSoft: "#141416",
  surface: "#1C1C1E",
  ink: "#F4F4F2",
  body: "#B0B0AC",
  muted: "#787874",
  mutedSoft: "#686864",
  primary: "#D49B45",
  primaryActive: "#C48B36",
  onPrimary: "#FFFFFF",
  hairline: "#2A2A2C",
  hairlineSoft: "#222224",
  hairlineStrong: "#38383C",
  surfaceStrong: "#2A2A2C",
  thinking: "rgba(212, 155, 69, 0.25)",
  grep: "#2A2A2C",
  read: "#2A2A2C",
  edit: "#2A2A2C",
  done: "#D49B45",
  error: "#D49B45",
  errorBg: "rgba(212, 155, 69, 0.15)",
  success: "#F4F4F2",
  successBg: "rgba(244, 244, 242, 0.1)",
  tabBg: "#1C1C1E",
  tabBorder: "#2A2A2C",
  statusBar: "light-content",
  navBarColor: "#FFFFFF",
  navBarButtonStyle: "dark",
};

const ThemeContext = createContext({
  theme: LIGHT,
  isDark: false,
  themeMode: "system", // "light" | "dark" | "system"
  setThemeMode: () => {},
  toggleTheme: () => {},
  toggleAnim: null,
});

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme(); // "dark" | "light"
  const [themeMode, setThemeModeState] = useState("system"); // "light" | "dark" | "system"
  const [isDark, setIsDark] = useState(systemColorScheme === "dark");
  const toggleAnim = useRef(new Animated.Value(0)).current;

  // Resolve actual boolean isDark based on themeMode and system preference
  useEffect(() => {
    let activeIsDark = false;
    if (themeMode === "dark") {
      activeIsDark = true;
    } else if (themeMode === "light") {
      activeIsDark = false;
    } else {
      activeIsDark = systemColorScheme === "dark";
    }

    applyTheme(activeIsDark);
    setIsDark(activeIsDark);
    toggleAnim.setValue(activeIsDark ? 1 : 0);

    if (Platform.OS === "android") {
      const activeTheme = activeIsDark ? DARK : LIGHT;
      NavigationBar.setButtonStyleAsync(activeTheme.navBarButtonStyle).catch(() => {});
    }
  }, [themeMode, systemColorScheme]);

  // Load saved theme mode on startup
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await storage.getItem(THEME_MODE_KEY);
        if (savedMode && ["light", "dark", "system"].includes(savedMode)) {
          setThemeModeState(savedMode);
        } else {
          // Check fallback legacy key
          const legacyKey = await storage.getItem("@salon_app_theme");
          if (legacyKey === "dark") setThemeModeState("dark");
          else if (legacyKey === "light") setThemeModeState("light");
        }
      } catch (e) {}
    };
    loadThemeMode();
  }, []);

  const setThemeMode = async (mode) => {
    if (!["light", "dark", "system"].includes(mode)) return;
    setThemeModeState(mode);

    const activeIsDark = mode === "dark" || (mode === "system" && systemColorScheme === "dark");
    applyTheme(activeIsDark);
    setIsDark(activeIsDark);

    Animated.timing(toggleAnim, {
      toValue: activeIsDark ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    try {
      await storage.setItem(THEME_MODE_KEY, mode);
    } catch (e) {}
  };

  const toggleTheme = async () => {
    const nextMode = isDark ? "light" : "dark";
    await setThemeMode(nextMode);
  };

  const theme = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        themeMode,
        setThemeMode,
        toggleTheme,
        toggleAnim,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
