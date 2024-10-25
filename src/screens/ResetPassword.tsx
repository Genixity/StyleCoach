import React from 'react';
import { View, Image } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import { ResetPasswordProps } from '../types/types';
import { authStyles } from '../styles/authStyles';

function ResetPasswordScreen({ navigation, route }: ResetPasswordProps) {
  const [email, setEmail] = React.useState(route.params?.email || '');
  const [message, setMessage] = React.useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const { colors } = useTheme();

  const sendResetEmail = async () => {
    if (email.trim() === '') {
      setMessage({ type: 'error', text: 'Please enter your email.' });
      return;
    }

    try {
      await auth().sendPasswordResetEmail(email);
      setMessage({ type: 'success', text: 'A link to reset your password has been sent to your email.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <View style={[authStyles.fullScreen, { backgroundColor: colors.background }]}>
      <View style={authStyles.container}>
        <Image
          source={require('../../assets/logo.png')}
          style={authStyles.logo}
          resizeMode="contain"
        />
        <Text style={[authStyles.headerText, { color: colors.primary }]}>
          Reset Password
        </Text>

        <TextInput
          label="Email"
          value={email}
          style={authStyles.input}
          inputMode="email"
          autoComplete="email"
          autoFocus
          onChangeText={setEmail}
          mode="outlined"
          theme={{ colors: { primary: colors.primary } }}
        />

        {message && (
          <Text style={[authStyles.messageText, { color: message.type === 'error' ? 'red' : 'green' }]}>
            {message.text}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={sendResetEmail}
          style={authStyles.button}
          contentStyle={{ paddingVertical: 8 }}
          theme={{ colors: { primary: colors.primary } }}
          uppercase={false}
        >
          Send Reset Link
        </Button>

        <Text style={authStyles.footerText}>
          Remembered your password?{' '}
          <Text
            style={[authStyles.linkText, { color: colors.primary }]}
            onPress={() => navigation.navigate('Sign In')}
          >
            Sign In
          </Text>
        </Text>
      </View>
    </View>
  );
}

export default ResetPasswordScreen;