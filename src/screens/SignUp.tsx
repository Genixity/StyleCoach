import React from 'react';
import { View, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import { SignUpProps } from '../types/types';
import { authStyles } from '../styles/authStyles';

function SignUpScreen({ navigation }: SignUpProps) {
  const [value, setValue] = React.useState({
    email: '',
    password: '',
    error: '',
  });
  const { colors } = useTheme();

  async function signUp() {
    if (value.email === '' || value.password === '') {
      setValue({ ...value, error: 'Please enter email and password.' });
      return;
    }

    try {
      await auth().createUserWithEmailAndPassword(value.email, value.password);
    } catch (error: any) {
      setValue({ ...value, error: error.message });
    }
  }

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={authStyles.fullScreen}
    >
      <Image
        source={require('../../assets/logo.png')}
        style={authStyles.logo}
        resizeMode="contain"
      />
      <Text style={[authStyles.headerText, { color: colors.primary }]}>
        Sign Up
      </Text>

      <TextInput
        label="Email"
        value={value.email}
        style={authStyles.input}
        inputMode="email"
        autoComplete="email"
        autoFocus
        onChangeText={(text) => setValue({ ...value, email: text })}
        mode="outlined"
        theme={{ colors: { primary: colors.primary } }}
      />
      <TextInput
        label="Password"
        value={value.password}
        style={authStyles.input}
        autoComplete="new-password"
        onChangeText={(text) => setValue({ ...value, password: text })}
        secureTextEntry
        mode="outlined"
        theme={{ colors: { primary: colors.primary } }}
      />
      {value.error ? (
        <Text style={authStyles.errorText}>{value.error}</Text>
      ) : null}
      <Button
        mode="contained"
        onPress={signUp}
        style={authStyles.button}
        contentStyle={{ paddingVertical: 8 }}
        theme={{ colors: { primary: colors.primary } }}
        uppercase={false}
      >
        Sign Up
      </Button>
      <Text style={authStyles.footerText}>
        Already have an account?{' '}
        <Text
          style={[authStyles.linkText, { color: colors.primary }]}
          onPress={() => navigation.navigate('Sign In')}
        >
          Sign In
        </Text>
      </Text>
      <Text style={authStyles.footerText}>
        Forgot your password?{' '}
        <Text
          style={[authStyles.linkText, { color: colors.primary }]}
          onPress={() => navigation.navigate('Reset Password', { email: value.email })}
        >
          Reset Password
        </Text>
      </Text>
    </KeyboardAwareScrollView>
  );
}

export default SignUpScreen;