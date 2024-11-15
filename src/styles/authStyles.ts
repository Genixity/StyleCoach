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
    marginVertical: 8,
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
  googleButton: {
    width: '100%',
    marginVertical: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  icon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
});