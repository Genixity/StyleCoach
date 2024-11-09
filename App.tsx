import './gesture-handler';
import React, { useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigation from './src/navigation';
import { LightTheme, DarkThemeCustom } from './src/styles/theme';
import { PreferencesContext } from './src/context/preferencesContext';
import { Appearance } from 'react-native';
import {
  PUBLIC_REVENUECAT_IOS_KEY,
  PUBLIC_REVENUECAT_ANDROID_KEY,
} from '@env';

const apiKey = Platform.select({
  ios: PUBLIC_REVENUECAT_IOS_KEY,
  android: PUBLIC_REVENUECAT_ANDROID_KEY,
});

export default function App() {
  useEffect(() => {
    if (apiKey) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      Purchases.configure({ apiKey });
    } else {
      console.error('RevenueCat API Key is not defined for this platform');
    }
  }, []);

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