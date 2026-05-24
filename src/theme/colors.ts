// Theme colors matching web client design system
// Aligned with web index.css — green/dark premium slate-green palette
export const colors = {
  // ── Light theme ─────────────────────────────────────────
  light: {
    // Primary — Forest Green (matching web)
    primary: '#166114',
    primaryForeground: '#ffffff',

    // Backgrounds
    background: '#f6f7f9',
    foreground: '#0f1f12',

    // Cards
    card: '#ffffff',
    cardForeground: '#0f1f12',

    // Secondary / surface-alt
    secondary: '#edf4ee',
    secondaryForeground: '#166114',

    // Muted
    muted: '#f0f3f1',
    mutedForeground: '#5b6b5e',

    // Accent
    accent: '#e2eae4',
    accentForeground: '#166114',

    // Borders & inputs
    border: 'rgba(22, 97, 20, 0.12)',
    input: 'rgba(22, 97, 20, 0.12)',
    ring: '#166114',

    // Destructive
    destructive: '#a82c2c',
    destructiveForeground: '#ffffff',

    // Chart — Green-based spectrum
    chart1: '#166114',
    chart2: '#2d7a2b',
    chart3: '#4b9b48',
    chart4: '#72be6f',
    chart5: '#a3e2a0',

    // Sidebar
    sidebar: '#f6f7f9',
    sidebarForeground: '#0f1f12',
    sidebarPrimary: '#166114',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#edf4ee',
    sidebarAccentForeground: '#166114',
    sidebarBorder: 'rgba(22, 97, 20, 0.12)',

    // Navbar
    navbar: '#0d1b10',
    navbarForeground: '#ffffff',

    // Semantic transaction colors
    incomeText: '#166114',
    expenseText: '#a82c2c',
    incomeBg: 'rgba(22, 97, 20, 0.08)',
    expenseBg: 'rgba(168, 44, 44, 0.08)',

    // Brand greens
    brandGreen: '#166114',
    brandGreenLight: '#9fff59',
  },

  // ── Dark theme ──────────────────────────────────────────
  dark: {
    // Primary — Neon Green (matching web)
    primary: '#9fff59',
    primaryForeground: '#0a100c',

    // Backgrounds
    background: '#0a100c',
    foreground: '#f9faf9',

    // Cards — slightly elevated deep forest charcoal-green
    card: '#111a13',
    cardForeground: '#f9faf9',

    // Secondary
    secondary: '#18271c',
    secondaryForeground: '#9fff59',

    // Muted
    muted: '#18271c',
    mutedForeground: '#7a8b7f',

    // Accent
    accent: '#203525',
    accentForeground: '#9fff59',

    // Borders & inputs
    border: 'rgba(159, 255, 89, 0.08)',
    input: 'rgba(159, 255, 89, 0.12)',
    ring: '#9fff59',

    // Destructive
    destructive: '#ff4d4d',
    destructiveForeground: '#ffffff',

    // Chart
    chart1: '#9fff59',
    chart2: '#7ecb47',
    chart3: '#5e9935',
    chart4: '#3d6722',
    chart5: '#1d3510',

    // Sidebar
    sidebar: '#111a13',
    sidebarForeground: '#f9faf9',
    sidebarPrimary: '#9fff59',
    sidebarPrimaryForeground: '#0a100c',
    sidebarAccent: '#18271c',
    sidebarAccentForeground: '#9fff59',
    sidebarBorder: 'rgba(159, 255, 89, 0.08)',

    // Navbar — always dark
    navbar: '#0a100c',
    navbarForeground: '#ffffff',

    // Semantic transaction colors
    incomeText: '#9fff59',
    expenseText: '#ff4d4d',
    incomeBg: 'rgba(159, 255, 89, 0.12)',
    expenseBg: 'rgba(255, 77, 77, 0.12)',

    // Brand greens
    brandGreen: '#9fff59',
    brandGreenLight: '#9fff59',
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

// Border radius — base 8px matching web --radius: 0.5rem
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
};

// Typography
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export const maxWidth = {
  container: 1248,
};
