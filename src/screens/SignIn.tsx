import React from 'react';
import { Image } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import auth from '@react-native-firebase/auth';
import { SignInProps } from '../types/types';
import { authStyles } from '../styles/authStyles';

function SignInScreen({ navigation }: SignInProps) {
  const [value, setValue] = React.useState({
    email: '',
    password: '',
    error: '',
  });
  const { colors } = useTheme();

  async function signIn() {
    if (value.email === '' || value.password === '') {
      setValue({ ...value, error: 'Please enter email and password.' });
      return;
    }

    try {
      await auth().signInWithEmailAndPassword(value.email, value.password);
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
        Sign In
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
        autoComplete="current-password"
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
        onPress={signIn}
        style={authStyles.button}
        contentStyle={{ paddingVertical: 8 }}
        theme={{ colors: { primary: colors.primary } }}
        uppercase={false}
      >
        Sign In
      </Button>
      <Text style={authStyles.footerText}>
        Don't have an account?{' '}
        <Text
          style={[authStyles.linkText, { color: colors.primary }]}
          onPress={() => navigation.navigate('Sign Up')}
        >
          Sign Up
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

export default SignInScreen;