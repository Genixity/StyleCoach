import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Card, Avatar, useTheme } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();

  return (
    <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
      <Card style={[styles.card, { backgroundColor: colors.surface }]}>
        <Card.Title
          title={`Welcome, ${user?.email}!`}
          subtitle="Ready to cook?"
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon="chef-hat"
              style={{ backgroundColor: colors.primary }}
            />
          )}
        />
        <Card.Content>
          <Text style={[styles.text, { color: colors.onSurface }]}>
            Start by asking our chatbot for a recipe.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 16,
    elevation: 4,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});