import React from 'react';
import { StyleSheet, View, ImageBackground } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { WelcomeProps } from '../types/types';

function WelcomeScreen({ navigation }: WelcomeProps) {
  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.background}
      blurRadius={3}
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Text style={[styles.title, { color: '#FFFFFF' }]}>
          All Your Recipes in One Place
        </Text>
        <Text style={[styles.subtitle, { color: '#FFFFFF' }]}>
          Discover new flavors with our cooking chatbot.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Sign In')}
          style={[styles.button, styles.buttonShadow]}
          contentStyle={{ paddingVertical: 8 }}
          labelStyle={{ color: '#FFFFFF', fontSize: 21, }}
          theme={{ colors: { primary: '#FF6F00' } }}
        >
          Sign In
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Sign Up')}
          style={[styles.button, styles.buttonShadow]}
          contentStyle={{ paddingVertical: 8 }}
          labelStyle={{
            color: '#FFFFFF',
            fontSize: 21,
            textShadowColor: 'rgba(0, 0, 0, 0.6)',
            textShadowOffset: { width: 0, height: 3 },
            textShadowRadius: 4,
          }}
          theme={{ colors: { primary: '#FFFFFF' } }}
        >
          Sign Up
        </Button>
      </View>
    </ImageBackground>
  );
}

export default WelcomeScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 30, 48, 0.6)',
  },
  container: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 4,
  },
  button: {
    marginVertical: 8,
    width: '80%',
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 6.27,
    elevation: 10,
  },
});
