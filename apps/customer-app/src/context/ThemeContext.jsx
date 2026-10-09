// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Animated, Easing, Platform, useColorScheme, Appearance } from "react-native";
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
  primary: "#B3261E",
  primaryActive: "#8C1D2A",
  onPrimary: "#FFFFFF",
  price: "#B3261E",
  button: "#B3261E",
  crimson: "#B3261E",
  highlight: "#B3261E",
  hairline: "#E8E8E0",
  hairlineSoft: "#F0F0EB",
  hairlineStrong: "#D0D0C8",
  surfaceStrong: "#F5F5F0",
  thinking: "rgba(179, 38, 30, 0.15)",
  grep: "#E8E8E0",
  read: "#E8E8E0",
  edit: "#E8E8E0",
  done: "#B3261E",
  error: "#B3261E",
  errorBg: "rgba(179, 38, 30, 0.08)",
  success: "#121212",
  successBg: "rgba(18, 18, 18, 0.06)",
  tabBg: "#FFFFFF",
  tabBorder: "#E8E8E0",
  tabActive: "#B3261E",
  tabActiveTint: "#FCE8E8",
  tabCenterBtn: "#8C1D2A",
  statusBar: "dark-content",
  navBarColor: "#FBFBF9",
  navBarButtonStyle: "dark",
};

// ── Dark Tokens (Rose/Magenta Pink Accent) ─────────────
export const DARK = {
  isDark: true,
  canvas: "#0D0D0D",
  canvasSoft: "#141416",
  surface: "#1C1C1E",
  ink: "#F4F4F2",
  body: "#B0B0AC",
  muted: "#787874",
  mutedSoft: "#686864",
  primary: "#E63973",
  primaryActive: "#D91C5C",
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
  tabActive: "#E63973",
  tabActiveTint: "rgba(230, 57, 115, 0.18)",
  tabCenterBtn: "#D91C5C",
  statusBar: "light-content",
  navBarColor: "#0D0D0D",
  navBarButtonStyle: "light",
};

const ThemeContext = createContext({
  theme: LIGHT,
  isDark: false,
  themeMode: "system", // "light" | "dark" | "system"
  setThemeMode: () => { },
  toggleTheme: () => { },
  toggleAnim: null,
});

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme(); // "dark" | "light"
  const [deviceScheme, setDeviceScheme] = useState(Appearance.getColorScheme() || "light");
  const [themeMode, setThemeModeState] = useState("system"); // "light" | "dark" | "system"

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setDeviceScheme(colorScheme || "light");
    });
    return () => subscription.remove();
  }, []);

  const activeSystemDark = (systemColorScheme || deviceScheme) === "dark";

  const [isDark, setIsDark] = useState(activeSystemDark);
  const toggleAnim = useRef(new Animated.Value(0)).current;

  // Resolve actual boolean isDark based on themeMode and system preference
  useEffect(() => {
    let activeIsDark = false;
    if (themeMode === "dark") {
      activeIsDark = true;
    } else if (themeMode === "light") {
      activeIsDark = false;
    } else {
      activeIsDark = activeSystemDark;
    }

    applyTheme(activeIsDark);
    setIsDark(activeIsDark);
    toggleAnim.setValue(activeIsDark ? 1 : 0);

    if (Platform.OS === "android") {
      const activeTheme = activeIsDark ? DARK : LIGHT;
      if (NavigationBar && typeof NavigationBar.setBackgroundColorAsync === 'function') {
        NavigationBar.setBackgroundColorAsync(activeTheme.navBarColor).catch(() => { });
      }
      if (NavigationBar && typeof NavigationBar.setButtonStyleAsync === 'function') {
        NavigationBar.setButtonStyleAsync(activeTheme.navBarButtonStyle).catch(() => { });
      }
    }
  }, [themeMode, activeSystemDark]);

  // Load saved theme mode on startup
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await storage.getItem(THEME_MODE_KEY);
        if (savedMode && ["light", "dark", "system"].includes(savedMode)) {
          setThemeModeState(savedMode);
        } else {
          // Default to system if no mode saved
          setThemeModeState("system");
        }
      } catch (e) { }
    };
    loadThemeMode();
  }, []);

  const setThemeMode = async (mode) => {
    if (!["light", "dark", "system"].includes(mode)) return;
    setThemeModeState(mode);

    const activeIsDark = mode === "dark" || (mode === "system" && activeSystemDark);
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
      await storage.removeItem("@salon_app_theme");
    } catch (e) { }
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
