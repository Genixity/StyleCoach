import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import auth from '@react-native-firebase/auth';
import { SignInProps } from '../types/types';
import { authStyles } from '../styles/authStyles';

function SignInScreen({ navigation }: SignInProps) {
  const [value, setValue] = useState({
    email: '',
    password: '',
    error: '',
  });
  const [userInfo, setUserInfo] = useState<import('@react-native-google-signin/google-signin').User | null>(null);
  const [inProgress, setInProgress] = useState(false);
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

  async function onAppleButtonPress() {
    // Start the sign-in request
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      // As per the FAQ of react-native-apple-authentication, the name should come first in the following array.
      // See: https://github.com/invertase/react-native-apple-authentication#faqs
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });

    // Ensure Apple returned a user identityToken
    if (!appleAuthRequestResponse.identityToken) {
      throw new Error('Apple Sign-In failed - no identify token returned');
    }

    // Create a Firebase credential from the response
    const { identityToken, nonce } = appleAuthRequestResponse;
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

    // Sign the user in with the credential
    return auth().signInWithCredential(appleCredential);
  }

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '378203909674-8vui5vl7544u914g6pu6hv53ihsr73sl.apps.googleusercontent.com'
    });
  }, []);

  async function onGoogleButtonPress() {
    setInProgress(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        const { idToken } = response.data;
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        await auth().signInWithCredential(googleCredential);
        setUserInfo(response.data);
      }
    } catch (error: any) {
      console.log(error)
      setValue({ ...value, error: 'Someting went wrong.' });
    } finally {
      setInProgress(false);
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
      <AppleButton
        buttonStyle={AppleButton.Style.WHITE_OUTLINE}
        buttonType={AppleButton.Type.SIGN_IN}
        style={{
          width: "100%",
          height: 60,
        }}
        onPress={() => onAppleButtonPress().then(() => console.log('Apple sign-in complete!'))}
      />
      <Button
        mode="contained"
        onPress={onGoogleButtonPress}
        loading={inProgress}
        style={[authStyles.googleButton, { backgroundColor: colors.surface, borderColor: colors.surfaceVariant }]}
        contentStyle={authStyles.content}
        uppercase={false}
        labelStyle={{ color: colors.onSurface }}
        icon={() => (
          <Image
            source={require('../../assets/google_icon.png')}
            style={authStyles.icon}
          />
        )}
      >
        Sign in with Google
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