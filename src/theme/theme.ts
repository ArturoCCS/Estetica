/**
 * Design System Theme
 * Supports Dark and Light themes with premium aesthetic
 */

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  colors: {
    // Backgrounds
    background: string;
    surface: string;
    card: string;
    cardSecondary: string;
    
    // Text
    text: string;
    textSecondary: string;
    textMuted: string;
    
    // Borders & Dividers
    border: string;
    borderLight: string;
    
    // Accent & States
    accent: string;
    accentHover: string;
    primary: string;
    primaryHover: string;
    
    // Semantic
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // UI Elements
    tabBarBackground: string;
    tabBarBorder: string;
    tabIconActive: string;
    tabIconInactive: string;
    
    // Overlays
    overlay: string;
    backdrop: string;
    
    // Scrollbar (web)
    scrollbarTrack: string;
    scrollbarThumb: string;
    scrollbarThumbHover: string;
  };
  
  typography: {
    h1: { fontSize: number; fontWeight: '800' | '700' | '600'; lineHeight: number };
    h2: { fontSize: number; fontWeight: '800' | '700' | '600'; lineHeight: number };
    h3: { fontSize: number; fontWeight: '800' | '700' | '600'; lineHeight: number };
    body: { fontSize: number; fontWeight: '400' | '500'; lineHeight: number };
    bodyLarge: { fontSize: number; fontWeight: '400' | '500'; lineHeight: number };
    caption: { fontSize: number; fontWeight: '500' | '600'; lineHeight: number };
    button: { fontSize: number; fontWeight: '600' | '700' | '800'; lineHeight: number };
  };
  
  radius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  
  shadows: {
    sm: object;
    md: object;
    lg: object;
    none: object;
  };
}

// Ivory/Sand accent color
const ACCENT_COLOR = '#E7DDC8';
const ACCENT_HOVER = '#D4C9B3';

export const lightTheme: Theme = {
  colors: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardSecondary: '#F9FAFB',
    
    text: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    
    accent: ACCENT_COLOR,
    accentHover: ACCENT_HOVER,
    primary: '#1E293B',
    primaryHover: '#0F172A',
    
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    tabBarBackground: '#FFFFFF',
    tabBarBorder: 'rgba(0,0,0,0.06)',
    tabIconActive: ACCENT_COLOR,
    tabIconInactive: '#94A3B8',
    
    overlay: 'rgba(255,255,255,0.88)',
    backdrop: 'rgba(0,0,0,0.4)',
    
    scrollbarTrack: 'rgba(0,0,0,0.03)',
    scrollbarThumb: 'rgba(15, 23, 42, 0.30)',
    scrollbarThumbHover: 'rgba(15, 23, 42, 0.42)',
  },
  
  typography: {
    h1: { fontSize: 32, fontWeight: '800', lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    bodyLarge: { fontSize: 18, fontWeight: '400', lineHeight: 28 },
    caption: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
    button: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  },
  
  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    full: 9999,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  shadows: {
    none: {},
    sm: {
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  },
};

export const darkTheme: Theme = {
  colors: {
    background: '#0A0A0A',
    surface: '#171717',
    card: '#1F1F1F',
    cardSecondary: '#262626',
    
    text: '#F5F5F5',
    textSecondary: '#D4D4D4',
    textMuted: '#A3A3A3',
    
    border: '#2E2E2E',
    borderLight: '#262626',
    
    accent: ACCENT_COLOR,
    accentHover: ACCENT_HOVER,
    primary: '#E7DDC8',
    primaryHover: '#F5F1E8',
    
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    tabBarBackground: '#171717',
    tabBarBorder: 'rgba(255,255,255,0.06)',
    tabIconActive: ACCENT_COLOR,
    tabIconInactive: '#737373',
    
    overlay: 'rgba(23,23,23,0.92)',
    backdrop: 'rgba(0,0,0,0.7)',
    
    scrollbarTrack: 'rgba(255,255,255,0.03)',
    scrollbarThumb: 'rgba(231, 221, 200, 0.25)',
    scrollbarThumbHover: 'rgba(231, 221, 200, 0.40)',
  },
  
  typography: {
    h1: { fontSize: 32, fontWeight: '800', lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    bodyLarge: { fontSize: 18, fontWeight: '400', lineHeight: 28 },
    caption: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
    button: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  },
  
  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    full: 9999,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  shadows: {
    none: {},
    sm: {
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  },
};

// Legacy export for backward compatibility
export const theme = {
  colors: lightTheme.colors,
  radius: lightTheme.radius,
  spacing: lightTheme.spacing,
};