import React from 'react';

export const PreferencesContext = React.createContext({
  setTheme: (theme: 'system' | 'light' | 'dark') => {},
  theme: 'system' as 'system' | 'light' | 'dark',
});