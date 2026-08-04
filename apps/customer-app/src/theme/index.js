// src/theme/index.js
import { Platform } from "react-native";
/**
 * Global Design System for Customer App
 * Derived from cursor/DESIGN.md (Cursor AI Editor Design System)
 *
 * Core Tokens:
 *  - Canvas: #f7f7f4 (Warm cream canvas)
 *  - Canvas Soft: #fafaf7
 *  - Card Surface: #ffffff (White cards)
 *  - Ink: #26251e (Warm near-black for display and strong text)
 *  - Body: #5a5852 (Default body text)
 *  - Muted: #807d72 (Secondary text / labels)
 *  - Primary: #f54e00 (Cursor Orange for primary CTAs & active accents)
 *  - Hairline: #e6e5e0 (1px border divider)
 *  - Hairline Strong: #cfcdc4
 *  - Radii: 8px (md) for buttons/inputs, 12px (lg) for cards, 9999px for pills
 *  - Hairline-only depth (no drop shadows)
 */

export const C = {
  // Brand Accent (Cursor Orange)
  main: "#f54e00",
  mainDark: "#d04200",
  mainLight: "rgba(245, 78, 0, 0.12)",

  // Primary Ink & Dark (#26251e)
  dark: "#26251e",
  charcoal: "#26251e",
  ink: "#26251e",

  // Canvas & Surface
  bg: "#f7f7f4",             // Canvas warm cream
  bgWarm: "#f7f7f4",
  lifted: "#fafaf7",         // Canvas soft
  surface: "#ffffff",        // Card surface white
  bone: "#efeee8",           // Hairline soft

  // Legacy aliases
  light: "#fafaf7",
  lightGrey: "#fafaf7",
  lightGreyBorder: "#e6e5e0",
  card: "#ffffff",

  // Legacy Gold aliases → mapped to main orange/ink
  gold: "#f54e00",
  goldBright: "#f54e00",
  goldMid: "#d04200",
  goldLight: "rgba(245, 78, 0, 0.12)",
  goldBg: "rgba(245, 78, 0, 0.08)",

  // Typography & Neutrals
  textPrimary: "#26251e",    // Ink
  textSecondary: "#5a5852",  // Body
  textMuted: "#807d72",      // Muted
  textLight: "#ffffff",
  dustTaupe: "#a09c92",      // Muted soft

  // Hairlines & Borders
  border: "#e6e5e0",         // Hairline
  borderLight: "#efeee8",    // Hairline soft
  borderDark: "#cfcdc4",     // Hairline strong
  divider: "#e6e5e0",

  // Timeline Pastels (Signature Cursor AI action pills)
  thinking: "#dfa88f",       // Peach
  grep: "#9fc9a2",           // Mint
  read: "#9fbbe0",           // Pastel blue
  edit: "#c0a8dd",           // Lavender
  done: "#c08532",           // Warm gold

  // Status
  error: "#cf2d56",
  errorText: "#cf2d56",
  errorBg: "rgba(207, 45, 86, 0.08)",

  success: "#1f8a65",
  successText: "#1f8a65",
  successBg: "rgba(31, 138, 101, 0.08)",

  info: "#9fbbe0",
  infoBg: "rgba(159, 187, 224, 0.12)",

  // Legacy
  muted: "#807d72",
  text: "#26251e",
  green: "#1f8a65",
};

// ── Typography (CursorGothic / System) ─────────────────

export const FONT_FAMILY = {
  primary: "System",
  code: Platform?.OS === "ios" ? "Menlo" : "monospace",
};

export const FONT_SIZE = {
  badge: 10,
  caption: 11,        // caption-uppercase: 11px
  eyebrow: 11,
  sub: 12,
  bodySm: 14,         // body-sm: 14px
  body: 16,           // body-md: 16px
  bodyLg: 16,
  titleSm: 16,        // title-sm: 16px
  title: 18,          // title-md: 18px
  titleLg: 22,        // display-sm: 22px
  hero: 32,           // display-lg (mobile): 32-36px
  display: 36,
};
export const FS = FONT_SIZE;

export const FONT_WEIGHT = {
  regular: "400",     // Cursor Display weight is 400!
  body: "400",
  medium: "500",      // Buttons & Nav
  semiBold: "600",    // Titles & Uppercase Labels
  bold: "600",
  heavy: "600",
  black: "600",
};
export const FW = FONT_WEIGHT;

// ── Spacing (Base 4px unit: 4, 8, 12, 16, 20, 24, 32, 48, 80) ──

export const SPACING = {
  none: 0,
  xxs: 4,      // 4px
  xs: 8,       // 8px
  sm: 12,      // 12px
  md: 16,      // 16px (base)
  lg: 20,      // 20px
  xl: 24,      // 24px
  xxl: 32,     // 32px
  huge: 48,    // 48px
  section: 80, // 80px section rhythm
};
export const S = SPACING;

// ── Border Radius (cursor/DESIGN.md scale) ──────────────
// xs: 4, sm: 6, md: 8 (buttons/inputs), lg: 12 (cards), pill: 9999

export const RADIUS = {
  xs: 4,
  sm: 6,
  button: 8,   // 8px for buttons & inputs per cursor/DESIGN.md
  md: 8,
  lg: 12,      // 12px for cards per cursor/DESIGN.md
  xl: 16,
  pill: 9999,  // Timeline pills & badges
  circle: 9999,
};
export const R = RADIUS;

// ── Hairline Depth (No shadows per cursor/DESIGN.md) ────

export const SHADOWS = {
  sm: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  md: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  lg: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// ── Typography Presets ──────────────────────────────────

export const TYPO = {
  eyebrow: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semiBold,
    color: C.textMuted,
    letterSpacing: 0.88,         // 0.88px tracking for caption-uppercase
    textTransform: "uppercase",
  },
  screenTitle: {
    fontSize: FONT_SIZE.hero,
    fontWeight: FONT_WEIGHT.regular, // Display weight 400 per cursor/DESIGN.md!
    color: C.textPrimary,
    letterSpacing: -0.72,        // -0.72px tracking
  },
  sectionTitle: {
    fontSize: FONT_SIZE.titleLg,
    fontWeight: FONT_WEIGHT.regular, // Display weight 400
    color: C.textPrimary,
    letterSpacing: -0.32,
  },
  cardTitle: {
    fontSize: FONT_SIZE.title,
    fontWeight: FONT_WEIGHT.semiBold,
    color: C.textPrimary,
    letterSpacing: 0,
  },
  bodyText: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.regular,
    color: C.body,
    lineHeight: 24,
  },
  badgeText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: FONT_WEIGHT.semiBold,
    color: C.textPrimary,
    letterSpacing: 0.88,
    textTransform: "uppercase",
  },
  navLink: {
    fontSize: FONT_SIZE.bodySm,
    fontWeight: FONT_WEIGHT.medium,
    color: C.textPrimary,
  },
};