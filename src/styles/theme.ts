import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FF6F00', // Orange
    secondary: '#66BB6A', // Green
    background: '#FAF9F6', // Cream White
    surface: '#FFFFFF',
    text: '#424242', // Dark Gray
    error: '#E53935', // Red
    notification: '#FFC107', // Gold
  },
};

export const DarkThemeCustom = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF8F00', // Lighter Orange
    secondary: '#81C784', // Lighter Green
    background: '#212121', // Dark Gray
    surface: '#424242',
    text: '#FAF9F6', // Cream White
    error: '#EF5350', // Lighter Red
    notification: '#FFD54F', // Lighter Gold
  },
};