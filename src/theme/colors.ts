// Theme colors matching web client design system
// Aligned with web index.css — black/white/gray minimal palette
export const colors = {
  // ── Light theme ─────────────────────────────────────────
  light: {
    // Primary — near-black (web oklch(0.141 0.005 285.823))
    primary: '#171717',
    primaryForeground: '#ffffff',

    // Backgrounds
    background: '#ffffff',
    foreground: '#171717',

    // Cards
    card: '#ffffff',
    cardForeground: '#171717',

    // Secondary / surface-alt (web rgb(243, 244, 247))
    secondary: '#f3f4f7',
    secondaryForeground: '#171717',

    // Muted
    muted: '#f3f4f7',
    mutedForeground: '#717171',

    // Accent (neutral hover state)
    accent: '#f3f4f7',
    accentForeground: '#171717',

    // Borders & inputs (web rgba(23,23,23,0.2))
    border: 'rgba(23, 23, 23, 0.15)',
    input: 'rgba(23, 23, 23, 0.15)',
    ring: '#171717',

    // Destructive — kept for safety-critical actions only
    destructive: '#8b3c3c',
    destructiveForeground: '#ffffff',

    // Chart — 5-shade grayscale spectrum for data viz
    chart1: '#171717',
    chart2: '#4a4a4a',
    chart3: '#7a7a7a',
    chart4: '#a8a8a8',
    chart5: '#cecece',

    // Sidebar
    sidebar: '#f3f4f7',
    sidebarForeground: '#171717',
    sidebarPrimary: '#171717',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#e8e9ec',
    sidebarAccentForeground: '#171717',
    sidebarBorder: 'rgba(23, 23, 23, 0.15)',

    // Navbar — always dark (matches web --secondary-dark-color rgb(23,23,23))
    navbar: '#171717',
    navbarForeground: '#ffffff',

    // Semantic transaction colors — matches web brand-green / destructive
    incomeText: '#166114',
    expenseText: '#8b3c3c',
    incomeBg: 'rgba(22, 97, 20, 0.08)',
    expenseBg: 'rgba(139, 60, 60, 0.08)',

    // Brand green (matches web --brand-green)
    brandGreen: '#166114',
    brandGreenLight: '#9fff59',
  },

  // ── Dark theme ──────────────────────────────────────────
  dark: {
    // Primary — near-white (web oklch(0.985 0 0))
    primary: '#f9f9f9',
    primaryForeground: '#171717',

    // Backgrounds (web oklch(0.141 0.005 285.823) ≈ #171717)
    background: '#171717',
    foreground: '#f9f9f9',

    // Cards — slightly elevated (web surface-alt dark rgb(42,42,42))
    card: '#2a2a2a',
    cardForeground: '#f9f9f9',

    // Secondary / surface-alt
    secondary: '#2a2a2a',
    secondaryForeground: '#f9f9f9',

    // Muted
    muted: '#2a2a2a',
    mutedForeground: '#888888',

    // Accent
    accent: '#2a2a2a',
    accentForeground: '#f9f9f9',

    // Borders & inputs (web rgba(255,255,255,0.12))
    border: 'rgba(255, 255, 255, 0.12)',
    input: 'rgba(255, 255, 255, 0.15)',
    ring: '#f9f9f9',

    // Destructive
    destructive: '#dc2626',
    destructiveForeground: '#ffffff',

    // Chart — grayscale spectrum, dark-to-light
    chart1: '#f0f0f0',
    chart2: '#b8b8b8',
    chart3: '#808080',
    chart4: '#484848',
    chart5: '#343434',

    // Sidebar
    sidebar: '#2a2a2a',
    sidebarForeground: '#f9f9f9',
    sidebarPrimary: '#f9f9f9',
    sidebarPrimaryForeground: '#171717',
    sidebarAccent: '#333333',
    sidebarAccentForeground: '#f9f9f9',
    sidebarBorder: 'rgba(255, 255, 255, 0.12)',

    // Navbar — always dark
    navbar: '#171717',
    navbarForeground: '#ffffff',

    // Semantic transaction colors — matches web brand-green-light / destructive dark
    incomeText: '#9fff59',
    expenseText: '#dc2626',
    incomeBg: 'rgba(159, 255, 89, 0.12)',
    expenseBg: 'rgba(220, 38, 38, 0.12)',

    // Brand green (lighter variant for dark bg)
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
