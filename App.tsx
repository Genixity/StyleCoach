import './gesture-handler';
import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigation from './src/navigation';
import { LightTheme, DarkThemeCustom } from './src/styles/theme';
import { PreferencesContext } from './src/context/preferencesContext';
import { Appearance } from 'react-native';

export default function App() {
  const [theme, setTheme] = React.useState<'system' | 'light' | 'dark'>('system');

  const getTheme = () => {
    if (theme === 'system') {
      const colorScheme = Appearance.getColorScheme();
      return colorScheme === 'dark' ? DarkThemeCustom : LightTheme;
    } else if (theme === 'dark') {
      return DarkThemeCustom;
    } else {
      return LightTheme;
    }
  };

  return (
    <PreferencesContext.Provider value={{ setTheme, theme }}>
      <PaperProvider theme={getTheme()}>
        <NavigationContainer>
          <RootNavigation />
        </NavigationContainer>
      </PaperProvider>
    </PreferencesContext.Provider>
  );
}