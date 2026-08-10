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
  // Brand Accent (Cursor Orange — never changes)
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

/**
 * applyTheme — mutates C in-place so all screens that import C
 * pick up the new tokens on their next render cycle.
 * Called by ThemeContext whenever isDark changes.
 */
export function applyTheme(isDark) {
  if (isDark) {
    // ── Dark tokens ──────────────────────────────────────────
    C.bg        = "#111110";
    C.bgWarm    = "#111110";
    C.lifted    = "#161614";
    C.surface   = "#1e1d1b";
    C.card      = "#1e1d1b";
    C.bone      = "#252420";
    C.light     = "#161614";
    C.lightGrey = "#161614";
    C.lightGreyBorder = "#2e2d2a";

    C.ink       = "#f0ede8";
    C.dark      = "#f0ede8";
    C.charcoal  = "#f0ede8";
    C.text      = "#f0ede8";
    C.textPrimary  = "#f0ede8";
    C.textSecondary = "#b5b0a8";
    C.textMuted    = "#7a7670";
    C.dustTaupe    = "#56524d";
    C.muted        = "#7a7670";

    C.border      = "#2e2d2a";
    C.borderLight = "#252420";
    C.borderDark  = "#3a3935";
    C.divider     = "#2e2d2a";

    C.thinking = "#c08a6e";
    C.grep     = "#7aaa80";
    C.read     = "#7a9dc0";
    C.edit     = "#a08ac0";
    C.done     = "#a06e28";

    C.error    = "#e0476a";
    C.errorText = "#e0476a";
    C.errorBg  = "rgba(207, 45, 86, 0.14)";

    C.success    = "#2aad80";
    C.successText = "#2aad80";
    C.successBg  = "rgba(31, 138, 101, 0.14)";
  } else {
    // ── Light tokens (restore defaults) ──────────────────────
    C.bg        = "#f7f7f4";
    C.bgWarm    = "#f7f7f4";
    C.lifted    = "#fafaf7";
    C.surface   = "#ffffff";
    C.card      = "#ffffff";
    C.bone      = "#efeee8";
    C.light     = "#fafaf7";
    C.lightGrey = "#fafaf7";
    C.lightGreyBorder = "#e6e5e0";

    C.ink       = "#26251e";
    C.dark      = "#26251e";
    C.charcoal  = "#26251e";
    C.text      = "#26251e";
    C.textPrimary  = "#26251e";
    C.textSecondary = "#5a5852";
    C.textMuted    = "#807d72";
    C.dustTaupe    = "#a09c92";
    C.muted        = "#807d72";

    C.border      = "#e6e5e0";
    C.borderLight = "#efeee8";
    C.borderDark  = "#cfcdc4";
    C.divider     = "#e6e5e0";

    C.thinking = "#dfa88f";
    C.grep     = "#9fc9a2";
    C.read     = "#9fbbe0";
    C.edit     = "#c0a8dd";
    C.done     = "#c08532";

    C.error    = "#cf2d56";
    C.errorText = "#cf2d56";
    C.errorBg  = "rgba(207, 45, 86, 0.08)";

    C.success    = "#1f8a65";
    C.successText = "#1f8a65";
    C.successBg  = "rgba(31, 138, 101, 0.08)";
  }

  // Sync TYPO preset colors
  if (TYPO) {
    if (TYPO.eyebrow) TYPO.eyebrow.color = C.textMuted;
    if (TYPO.screenTitle) TYPO.screenTitle.color = C.textPrimary;
    if (TYPO.sectionTitle) TYPO.sectionTitle.color = C.textPrimary;
    if (TYPO.cardTitle) TYPO.cardTitle.color = C.textPrimary;
    if (TYPO.bodyText) TYPO.bodyText.color = C.body;
    if (TYPO.badgeText) TYPO.badgeText.color = C.textPrimary;
    if (TYPO.navLink) TYPO.navLink.color = C.textPrimary;
  }
}


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
    shadowColor: "#26251e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#26251e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: "#26251e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
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