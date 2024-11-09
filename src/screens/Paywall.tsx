import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import Paywall, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useNavigation } from '@react-navigation/native';
import LoadingScreen from './Loading';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/types';
import { useChatbot } from '../hooks/useChatbot';

const PaywallScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { signOut } = useChatbot();

  useEffect(() => {
    const showPaywall = async () => {
      try {
        const paywallResult: PAYWALL_RESULT = await Paywall.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: 'Pro',
        });

        switch (paywallResult) {
          case PAYWALL_RESULT.PURCHASED:
          case PAYWALL_RESULT.RESTORED:
            navigation.navigate('ChatbotContent');
            break;
          case PAYWALL_RESULT.ERROR:
          case PAYWALL_RESULT.CANCELLED:
            await signOut();
            break;
          default:
            await signOut();
            break;
        }
      } catch (e) {
        console.error('Error presenting paywall', e);
        Alert.alert('Error', 'An unexpected error occurred.');
        await signOut();
      }
    };

    showPaywall();
  }, []);

  return <LoadingScreen />;
};

export default PaywallScreen;
