import React from 'react';
import { View, Image } from 'react-native';
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
      navigation.navigate('Sign In');
    } catch (error: any) {
      setValue({ ...value, error: error.message });
    }
  }

  return (
    <View style={[authStyles.fullScreen, { backgroundColor: colors.background }]}>
      <View style={authStyles.container}>
        <Image
          source={require('../../assets/logo.png')}
          style={authStyles.logo}
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
      </View>
    </View>
  );
}

export default SignUpScreen;