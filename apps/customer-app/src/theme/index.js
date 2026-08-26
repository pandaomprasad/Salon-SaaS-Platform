// src/theme/index.js
import { Platform } from "react-native";

/**
 * Global Design System — Luxe Gold & Editorial Theme (from reference-theme)
 *
 * Theme Characteristics:
 *  - Primary Accent: Warm Luxury Amber Gold (#C48B36)
 *  - Canvas: Cream Silk White (#FBFBF9) in Light / Deep Obsidian (#0D0D0D) in Dark
 *  - Serif Font Family: Georgia / Serif Editorial titles
 *  - Flat & Hairline Depth: 1px subtle borders, 0px elevation shadows
 */

export const C = {
  // Brand Purple & Indigo Accents (Global Reference Color)
  purple: "#6C5CE7",
  purpleDark: "#5A4AD1",
  purpleLight: "#8075E5",
  purpleTint: "rgba(108, 92, 231, 0.12)",

  // Primary Gold & Amber Accents
  main: "#C48B36",
  gold: "#C48B36",
  goldDark: "#B87E2C",
  goldLight: "#D49B45",
  goldTint: "rgba(196, 139, 54, 0.10)",
  goldTintStrong: "rgba(196, 139, 54, 0.18)",

  // Primary Ink & Dark (#121212)
  dark: "#121212",
  charcoal: "#1A1A1A",
  ink: "#121212",

  // Canvas & Surface
  bg: "#FBFBF9",             // Warm Luxury Cream Canvas
  bgWarm: "#FBFBF9",
  lifted: "#F5F5F0",         // Soft Cream Surface
  surface: "#FFFFFF",        // Card Surface Pure White
  bone: "#EFEFE8",           // Soft Hairline Divider

  // Aliases
  light: "#FBFBF9",
  lightGrey: "#F5F5F0",
  lightGreyBorder: "#E8E8E0",
  card: "#FFFFFF",

  // Typography & Neutrals
  textPrimary: "#121212",    // Rich Ink
  textSecondary: "#4A4A4A",  // Slate Body
  body: "#4A4A4A",
  textMuted: "#8E8E8A",      // Soft Muted
  textLight: "#FFFFFF",
  dustTaupe: "#A0A09C",      // Taupe Accent
  mutedSoft: "#8E8E8A",

  // Hairlines & Borders
  border: "#E8E8E0",         // Subtle Warm Border
  borderLight: "#F0F0EB",    // Soft Hairline
  borderDark: "#D0D0C8",     // Strong Border
  divider: "#E8E8E0",

  // Timeline & Badges
  thinking: "rgba(196, 139, 54, 0.15)",
  grep: "#E8E8E0",
  read: "#E8E8E0",
  edit: "#E8E8E0",
  done: "#C48B36",

  // Status
  error: "#C48B36",
  errorText: "#C48B36",
  errorBg: "rgba(196, 139, 54, 0.08)",

  success: "#C48B36",
  successText: "#C48B36",
  successBg: "rgba(196, 139, 54, 0.08)",

  info: "#C48B36",
  infoBg: "rgba(196, 139, 54, 0.12)",

  muted: "#8E8E8A",
  text: "#121212",

  herat: "#ff0000ff",

  verified: "#2a7dff"
};

/**
 * applyTheme — mutates C in-place so all screens that import C
 * pick up the new tokens on their next render cycle.
 */
export function applyTheme(isDark) {
  if (isDark) {
    // ── Dark Obsidian Luxury Tokens ──────────────────
    C.bg = "#0D0D0D";
    C.bgWarm = "#0D0D0D";
    C.lifted = "#141416";
    C.surface = "#1C1C1E";
    C.card = "#1C1C1E";
    C.bone = "#262628";
    C.light = "#141416";
    C.lightGrey = "#141416";
    C.lightGreyBorder = "#2A2A2C";

    C.main = "#D49B45";
    C.gold = "#D49B45";
    C.goldDark = "#C48B36";
    C.goldLight = "#E5B05D";
    C.goldTint = "rgba(212, 155, 69, 0.16)";
    C.goldTintStrong = "rgba(212, 155, 69, 0.25)";

    C.ink = "#F4F4F2";
    C.dark = "#F4F4F2";
    C.charcoal = "#F4F4F2";
    C.text = "#F4F4F2";
    C.textPrimary = "#F4F4F2";
    C.textSecondary = "#D0D0CB";
    C.body = "#D0D0CB";
    C.textMuted = "#A0A09C";
    C.dustTaupe = "#A0A09C";
    C.muted = "#A0A09C";
    C.mutedSoft = "#B8B8B0";

    C.border = "#2A2A2C";
    C.borderLight = "#222224";
    C.borderDark = "#38383C";
    C.divider = "#2A2A2C";

    C.thinking = "rgba(212, 155, 69, 0.25)";
    C.grep = "#2A2A2C";
    C.read = "#2A2A2C";
    C.edit = "#2A2A2C";
    C.done = "#D49B45";

    C.error = "#D49B45";
    C.errorText = "#D49B45";
    C.errorBg = "rgba(212, 155, 69, 0.15)";

    C.success = "#F4F4F2";
    C.successText = "#F4F4F2";
    C.successBg = "rgba(244, 244, 242, 0.1)";
  } else {
    // ── Light Cream Luxury Tokens ────────────────────
    C.bg = "#FBFBF9";
    C.bgWarm = "#FBFBF9";
    C.lifted = "#F5F5F0";
    C.surface = "#FFFFFF";
    C.card = "#FFFFFF";
    C.bone = "#EFEFE8";
    C.light = "#FBFBF9";
    C.lightGrey = "#F5F5F0";
    C.lightGreyBorder = "#E8E8E0";

    C.main = "#C48B36";
    C.gold = "#C48B36";
    C.goldDark = "#B87E2C";
    C.goldLight = "#D49B45";
    C.goldTint = "rgba(196, 139, 54, 0.10)";
    C.goldTintStrong = "rgba(196, 139, 54, 0.18)";

    C.ink = "#121212";
    C.dark = "#121212";
    C.charcoal = "#121212";
    C.text = "#121212";
    C.textPrimary = "#121212";
    C.textSecondary = "#4A4A4A";
    C.body = "#4A4A4A";
    C.textMuted = "#8E8E8A";
    C.dustTaupe = "#A0A09C";
    C.muted = "#8E8E8A";
    C.mutedSoft = "#8E8E8A";

    C.border = "#E8E8E0";
    C.borderLight = "#F0F0EB";
    C.borderDark = "#D0D0C8";
    C.divider = "#E8E8E0";

    C.thinking = "rgba(196, 139, 54, 0.15)";
    C.grep = "#E8E8E0";
    C.read = "#E8E8E0";
    C.edit = "#E8E8E0";
    C.done = "#C48B36";

    C.error = "#C48B36";
    C.errorText = "#C48B36";
    C.errorBg = "rgba(196, 139, 54, 0.08)";

    C.success = "#121212";
    C.successText = "#121212";
    C.successBg = "rgba(18, 18, 18, 0.06)";
  }

  // Sync TYPO preset colors
  if (TYPO) {
    if (TYPO.eyebrow) TYPO.eyebrow.color = C.goldDark;
    if (TYPO.screenTitle) TYPO.screenTitle.color = C.textPrimary;
    if (TYPO.sectionTitle) TYPO.sectionTitle.color = C.textPrimary;
    if (TYPO.cardTitle) TYPO.cardTitle.color = C.textPrimary;
    if (TYPO.bodyText) TYPO.bodyText.color = C.textSecondary;
    if (TYPO.badgeText) TYPO.badgeText.color = C.textPrimary;
    if (TYPO.navLink) TYPO.navLink.color = C.textPrimary;
  }
}

// ── Typography (Fraunces Editorial Serif Headers + Inter Body) ───────

export const FONT_FAMILY = {
  primary: "Inter_400Regular",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  display: "Fraunces_600SemiBold",
  displayMedium: "Fraunces_500Medium",
  displayBold: "Fraunces_700Bold",
  serif: "Fraunces_600SemiBold",
  code: "Inter_400Regular",
};
export const FF = FONT_FAMILY;

export const FONT_SIZE = {
  badge: 10,
  caption: 11,
  eyebrow: 11,
  subheadline: 14,
  sub: 12,
  bodySm: 14,
  body: 16,
  bodyLg: 16,
  cardTitle: 17,
  cardMeta: 13,
  button: 14,
  titleSm: 16,
  title: 18,
  titleLg: 22,
  headline: 30,
  hero: 30,
  display: 34,
};
export const FS = FONT_SIZE;

export const FONT_WEIGHT = {
  regular: "400",
  body: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
  heavy: "800",
  black: "900",
};
export const FW = FONT_WEIGHT;

// ── Spacing (Base 4px unit: 4, 8, 12, 16, 20, 24, 32, 48, 80) ──

export const SPACING = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 48,
  section: 80,
};
export const S = SPACING;

// ── Border Radius Scale ───────────────────────────────

export const RADIUS = {
  xs: 4,
  sm: 6,
  button: 14,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 9999,
  circle: 9999,
};
export const R = RADIUS;

// ── Depth & Flat Hairline Shadows ─────────────────────

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

// ── Typography Presets ────────────────────────────────────────

export const TYPO = {
  eyebrow: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZE.eyebrow,
    color: C.goldDark,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  headline: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT_SIZE.headline,
    color: C.ink,
    lineHeight: FONT_SIZE.headline * 1.08,
  },
  subheadline: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZE.subheadline,
    color: C.muted,
  },
  screenTitle: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT_SIZE.hero,
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT_SIZE.titleLg,
    color: C.textPrimary,
    letterSpacing: -0.2,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT_SIZE.cardTitle,
    color: C.textPrimary,
    letterSpacing: 0,
  },
  cardMeta: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZE.cardMeta,
    color: C.textMuted,
  },
  bodyText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZE.body,
    color: C.textSecondary,
    lineHeight: 24,
  },
  badgeText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZE.caption,
    color: C.textPrimary,
    letterSpacing: 1.0,
    textTransform: "uppercase",
  },
  navLink: {
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZE.bodySm,
    color: C.textPrimary,
  },
};