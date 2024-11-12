import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  logo: {
    height: 120,
    alignSelf: 'center',
    marginBottom: 32,
    resizeMode: 'contain',
  },
  headerText: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 16,
  },
  linkText: {
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  messageText: {
    marginBottom: 10,
    textAlign: 'center',
  },
});