// screens/Settings.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Divider, Switch, useTheme } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import { PreferencesContext } from '../context/preferencesContext';

function Settings() {
  const { toggleTheme, isThemeDark } = React.useContext(PreferencesContext);
  const { colors } = useTheme();

  return (
    <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
      <List.Section>
        <List.Item
          title="Dark Mode"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={isThemeDark}
              onValueChange={toggleTheme}
              color={colors.primary}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Logout"
          left={(props) => <List.Icon {...props} icon="logout" />}
          onPress={() => auth().signOut()}
        />
        <Divider />
      </List.Section>
    </View>
  );
}

export default Settings;

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
});