import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigation from './src/navigation';
import { LightTheme, DarkThemeCustom } from './src/styles/theme';
import { PreferencesContext } from './src/context/preferencesContext';

export default function App() {
  const [isThemeDark, setIsThemeDark] = React.useState(false);

  const toggleTheme = () => {
    setIsThemeDark(!isThemeDark);
  };

  const theme = isThemeDark ? DarkThemeCustom : LightTheme;

  return (
    <PreferencesContext.Provider value={{ toggleTheme, isThemeDark }}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <RootNavigation />
        </NavigationContainer>
      </PaperProvider>
    </PreferencesContext.Provider>
  );
}