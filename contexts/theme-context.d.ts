import * as React from 'react';

export interface ThemeColors {
  text: string;
  background: string;
  tint: string;
  primary: string;
  secondary: string;
  accent: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  success: string;
  error: string;
  warning: string;
  isDark: boolean;
  buttonColor?: string;
  apiTextColor?: string;
}

export interface ThemeContextType {
  colors: ThemeColors;
  fonts: any;
  isDark: boolean;
  colorScheme: 'light' | 'dark';
  toggleTheme: () => Promise<void>;
}

export function ThemeProvider(props: { children: React.ReactNode }): React.JSX.Element;
export function useTheme(): ThemeContextType;
