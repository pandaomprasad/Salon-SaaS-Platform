import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { storage } from "../services/storage";
import { applyTheme } from "../theme";

const THEME_KEY = "@salon_app_theme";

// ── Light Tokens (cursor/DESIGN.md) ───────────────────────
export const LIGHT = {
  isDark: false,
  canvas: "#f7f7f4",
  canvasSoft: "#fafaf7",
  surface: "#ffffff",
  ink: "#26251e",
  body: "#5a5852",
  muted: "#807d72",
  mutedSoft: "#a09c92",
  primary: "#f54e00",
  primaryActive: "#d04200",
  onPrimary: "#ffffff",
  hairline: "#e6e5e0",
  hairlineSoft: "#efeee8",
  hairlineStrong: "#cfcdc4",
  surfaceStrong: "#e6e5e0",
  // Timeline pastels
  thinking: "#dfa88f",
  grep: "#9fc9a2",
  read: "#9fbbe0",
  edit: "#c0a8dd",
  done: "#c08532",
  // Status
  error: "#cf2d56",
  errorBg: "rgba(207, 45, 86, 0.08)",
  success: "#1f8a65",
  successBg: "rgba(31, 138, 101, 0.08)",
  // Tab bar
  tabBg: "#ffffff",
  tabBorder: "#e6e5e0",
  statusBar: "dark-content",
};

// ── Dark Tokens ────────────────────────────────────────────
export const DARK = {
  isDark: true,
  canvas: "#111110",
  canvasSoft: "#161614",
  surface: "#1e1d1b",
  ink: "#f0ede8",
  body: "#b5b0a8",
  muted: "#7a7670",
  mutedSoft: "#56524d",
  primary: "#f54e00",
  primaryActive: "#d04200",
  onPrimary: "#ffffff",
  hairline: "#2e2d2a",
  hairlineSoft: "#252420",
  hairlineStrong: "#3a3935",
  surfaceStrong: "#2e2d2a",
  // Timeline pastels (slightly muted on dark)
  thinking: "#c08a6e",
  grep: "#7aaa80",
  read: "#7a9dc0",
  edit: "#a08ac0",
  done: "#a06e28",
  // Status
  error: "#e0476a",
  errorBg: "rgba(207, 45, 86, 0.14)",
  success: "#2aad80",
  successBg: "rgba(31, 138, 101, 0.14)",
  // Tab bar
  tabBg: "#1e1d1b",
  tabBorder: "#2e2d2a",
  statusBar: "light-content",
};

const ThemeContext = createContext({
  theme: LIGHT,
  isDark: false,
  toggleTheme: () => {},
  toggleAnim: null,
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const toggleAnim = useRef(new Animated.Value(0)).current;

  // Load persisted preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await storage.getItem(THEME_KEY);
        if (saved === "dark") {
          applyTheme(true);   // mutate C before first render
          setIsDark(true);
          toggleAnim.setValue(1);
        } else {
          applyTheme(false);  // ensure C starts in light mode
        }
      } catch (e) {
        applyTheme(false);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    applyTheme(next);   // mutate C immediately so screens re-render with new values
    setIsDark(next);

    // Animate the toggle (0=light, 1=dark)
    Animated.timing(toggleAnim, {
      toValue: next ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    try {
      await storage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch (e) {
      // silent
    }
  };

  const theme = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, toggleAnim }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
