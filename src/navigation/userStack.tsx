import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChatbotScreen from '../screens/Chatbot';

const Stack = createStackNavigator();

export default function UserStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Chatbot" component={ChatbotScreen} />
    </Stack.Navigator>
  );
}