import React, { useEffect } from 'react';
import LoadingScreen from './Loading';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/types';

const ChatbotScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isSubscriber } = useSubscription();

  useEffect(() => {
    if (isSubscriber === null) {
      return;
    }

    if (!isSubscriber) {
      navigation.replace('Paywall');
    } else {
      navigation.replace('ChatbotContent');
    }
  }, [isSubscriber]);

  return <LoadingScreen />;
};

export default ChatbotScreen;