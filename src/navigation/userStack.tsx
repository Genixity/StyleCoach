import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChatbotScreen from '../screens/Chatbot';
import PaywallScreen from '../screens/Paywall';
import ChatbotContent from '../screens/ChatbotContent';
import { RootStackParamList } from '../types/types';

const Stack = createStackNavigator<RootStackParamList>();

export default function UserStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Chatbot" component={ChatbotScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
      <Stack.Screen name="ChatbotContent" component={ChatbotContent} />
    </Stack.Navigator>
  );
}