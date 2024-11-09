import React from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function LoadingScreen() {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, {backgroundColor: colors.background}]}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        height: 150,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    loader: {

    },
});