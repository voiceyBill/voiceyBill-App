import type { TextStyle } from "react-native";

// Theme colors matching web client design system
// Aligned with web index.css — green/dark premium slate-green palette
export const colors = {
  // ── Light theme ─────────────────────────────────────────
  light: {
    // Primary — Forest Green (matching web)
    primary: "#166114",
    primaryForeground: "#ffffff",

    // Backgrounds
    background: "#f6f7f9",
    foreground: "#0f1f12",

    // Cards
    card: "#ffffff",
    cardForeground: "#0f1f12",

    // Secondary / surface-alt
    secondary: "#edf4ee",
    secondaryForeground: "#166114",

    // Muted
    muted: "#f0f3f1",
    mutedForeground: "#5b6b5e",

    // Accent
    accent: "#e2eae4",
    accentForeground: "#166114",

    // Borders & inputs
    border: "rgba(22, 97, 20, 0.12)",
    input: "rgba(22, 97, 20, 0.12)",
    ring: "#166114",

    // Destructive
    destructive: "#a82c2c",
    destructiveForeground: "#ffffff",

    // Chart — Green-based spectrum
    chart1: "#166114",
    chart2: "#2d7a2b",
    chart3: "#4b9b48",
    chart4: "#72be6f",
    chart5: "#a3e2a0",

    // Sidebar
    sidebar: "#f6f7f9",
    sidebarForeground: "#0f1f12",
    sidebarPrimary: "#166114",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#edf4ee",
    sidebarAccentForeground: "#166114",
    sidebarBorder: "rgba(22, 97, 20, 0.12)",

    // Navbar

    navbar: "#f6f7f9",
    navbarForeground: "#0f1f12",

    // Semantic transaction colors
    incomeText: "#166114",
    expenseText: "#a82c2c",
    incomeBg: "rgba(22, 97, 20, 0.08)",
    expenseBg: "rgba(168, 44, 44, 0.08)",

    // Status & overlay
    overlay: "rgba(15, 31, 18, 0.45)",
    success: "#166114",
    successBg: "rgba(22, 97, 20, 0.08)",
    warning: "#b7791f",
    warningBg: "rgba(183, 121, 31, 0.10)",

    // Brand greens
    brandGreen: "#166114",
    brandGreenLight: "#9fff59",
  },

  // ── Dark theme ──────────────────────────────────────────
  dark: {
    // Primary — brand green, calmed from the previous neon #9fff59 for a more
    // premium, less "acid" dark UI while staying unmistakably VoiceyBill green.
    primary: "#8ef05a",
    primaryForeground: "#0a100c",

    // Backgrounds
    background: "#0a100c",
    foreground: "#f9faf9",

    // Cards — slightly elevated deep forest charcoal-green
    card: "#111a13",
    cardForeground: "#f9faf9",

    // Secondary
    secondary: "#18271c",
    secondaryForeground: "#8ef05a",

    // Muted
    muted: "#18271c",
    mutedForeground: "#7a8b7f",

    // Accent
    accent: "#203525",
    accentForeground: "#8ef05a",

    // Borders & inputs
    border: "rgba(142, 240, 90, 0.08)",
    input: "rgba(142, 240, 90, 0.12)",
    ring: "#8ef05a",

    // Destructive
    destructive: "#ff4d4d",
    destructiveForeground: "#ffffff",

    // Chart
    chart1: "#8ef05a",
    chart2: "#7ecb47",
    chart3: "#5e9935",
    chart4: "#3d6722",
    chart5: "#1d3510",

    // Sidebar
    sidebar: "#111a13",
    sidebarForeground: "#f9faf9",
    sidebarPrimary: "#8ef05a",
    sidebarPrimaryForeground: "#0a100c",
    sidebarAccent: "#18271c",
    sidebarAccentForeground: "#8ef05a",
    sidebarBorder: "rgba(142, 240, 90, 0.08)",

    // Navbar — always dark
    navbar: "#0a100c",
    navbarForeground: "#ffffff",

    // Semantic transaction colors
    incomeText: "#8ef05a",
    expenseText: "#ff4d4d",
    incomeBg: "rgba(142, 240, 90, 0.12)",
    expenseBg: "rgba(255, 77, 77, 0.12)",

    // Status & overlay
    overlay: "rgba(0, 0, 0, 0.6)",
    success: "#8ef05a",
    successBg: "rgba(142, 240, 90, 0.12)",
    warning: "#f0c14b",
    warningBg: "rgba(240, 193, 75, 0.12)",

    // Brand greens
    brandGreen: "#8ef05a",
    brandGreenLight: "#8ef05a",
  },
};

// Spacing system — 4px base unit
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius.
// Numeric rungs (none…2xl) are the legacy scale kept for backward compatibility.
// Semantic rungs are the design-system radius language screens should migrate to:
//   chip 8 · input 14 · button 12 · card 20 · sheet 28 · pill full
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  "3xl": 20,
  "4xl": 28,
  full: 9999,
  // Semantic aliases (preferred)
  chip: 8,
  input: 14,
  button: 12,
  card: 20,
  sheet: 28,
  pill: 9999,
};

// Typography
export const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extrabold: "Inter_800ExtraBold",
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 15,
  lg: 17,
  xl: 19,
  "2xl": 22,
  "3xl": 28,
  "4xl": 34,
};

export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

// Platform-aware shadows
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Premium card shadow used across screens (matches dashboard surfaces)
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
};

// Shared radius for premium card surfaces
export const cardRadius = 20;

// ── Elevation ─────────────────────────────────────────────
// Exactly three tiers so surfaces read as a consistent height system, instead
// of the ~10 bespoke shadows currently scattered across screens.
//   rest    resting cards / list surfaces
//   raised  interactive / floating affordances (FAB, active card)
//   overlay sheets, dialogs, menus
export const elevation = {
  rest: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  overlay: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ── Motion ────────────────────────────────────────────────
// Durations in ms; easing as cubic-bezier control points to keep this token
// file framework-agnostic (components apply Easing.bezier(...easing.standard)).
export const motion = {
  duration: {
    fast: 150,
    base: 250,
    slow: 350,
  },
  easing: {
    standard: [0.2, 0, 0, 1] as const,
    entrance: [0.05, 0.7, 0.1, 1] as const,
    exit: [0.3, 0, 0.8, 0.15] as const,
  },
};

// ── Press feedback ────────────────────────────────────────
// Standard activeOpacity values so touch feedback is consistent app-wide.
export const press = {
  row: 0.7,
  card: 0.9,
  button: 0.85,
  icon: 0.6,
};

// ── Typography presets ────────────────────────────────────
// Semantic text roles built on Inter. lineHeight is absolute px (RN convention).
// Numeric variants add tabular figures so amounts/dates don't shift horizontally.
export type TextVariant =
  | "displayLg"
  | "title"
  | "heading"
  | "body"
  | "bodyMedium"
  | "label"
  | "caption"
  | "amountLg"
  | "amount";

export const textStyles: Record<TextVariant, TextStyle> = {
  displayLg: {
    fontFamily: fontFamily.extrabold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: fontFamily.semibold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  amountLg: {
    fontFamily: fontFamily.extrabold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  amount: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    lineHeight: 22,
    fontVariant: ["tabular-nums"],
  },
};

export const maxWidth = {
  container: 1248,
};
