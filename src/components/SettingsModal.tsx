import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Switch, useTheme, RadioButton, Button } from 'react-native-paper';

interface SettingsModalProps {
    isSettingsModalVisible: boolean;
    setIsSettingsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
    hapticEnabled: boolean;
    setHapticEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    theme: string;
    capitalize: (s: string) => string;
    user: any;
    signOut: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isSettingsModalVisible,
    setIsSettingsModalVisible,
    hapticEnabled,
    setHapticEnabled,
    setTheme,
    theme,
    capitalize,
    user,
    signOut,
}) => {
    const { colors } = useTheme();
    const [themeModalVisible, setThemeModalVisible] = useState(false);

    return (
        <Modal
            isVisible={isSettingsModalVisible}
            onBackdropPress={() => setIsSettingsModalVisible(false)}
            style={styles.settingsModal}
        >
            <View style={[styles.settingsContent, { backgroundColor: colors.background }]}>
                <View style={styles.settingsItem}>
                    <Ionicons
                        name="mail"
                        size={24}
                        color={colors.onSurface}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.settingsTitle, { color: colors.onSurface }]}>Email</Text>
                    <View style={styles.colorSchemeSelector}>
                        <Text style={[styles.userEmailValue, { color: colors.onSurface }]}>
                            {user?.email}
                        </Text>
                    </View>
                </View>
                <View style={styles.settingsItem}>
                    <Ionicons
                        name="color-palette"
                        size={24}
                        color={colors.onSurface}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.settingsTitle, { color: colors.onSurface }]}>
                        Color Scheme
                    </Text>
                    <TouchableOpacity
                        style={styles.colorSchemeSelector}
                        onPress={() => setThemeModalVisible(true)}
                    >
                        <Text
                            style={{
                                color: colors.onSurface,
                                fontSize: 18,
                                marginRight: 10,
                            }}
                        >
                            {capitalize(theme)}
                        </Text>
                        <Ionicons
                            name="chevron-down-outline"
                            size={20}
                            color={colors.onSurface}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.settingsItem}>
                    <Ionicons
                        name="notifications"
                        size={24}
                        color={colors.onSurface}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.settingsTitle, { color: colors.onSurface }]}>
                        Haptic Feedback
                    </Text>
                    <Switch
                        value={hapticEnabled}
                        onValueChange={setHapticEnabled}
                        color={colors.primary}
                    />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                    <Ionicons
                        name="exit-outline"
                        size={24}
                        color={colors.error}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.logoutButtonText, { color: colors.error }]}>Logout</Text>
                </TouchableOpacity>

                <Modal
                    isVisible={themeModalVisible}
                    onBackdropPress={() => setThemeModalVisible(false)}
                    style={styles.themeSelectionModal}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Select Color Scheme</Text>
                        <RadioButton.Group
                            onValueChange={(value) => setTheme(value as 'system' | 'light' | 'dark')}
                            value={theme}
                        >
                            <RadioButton.Item
                                label="System"
                                value="system"
                                color={colors.primary}
                                labelStyle={{ color: colors.onSurface }}
                            />
                            <RadioButton.Item
                                label="Light"
                                value="light"
                                color={colors.primary}
                                labelStyle={{ color: colors.onSurface }}
                            />
                            <RadioButton.Item
                                label="Dark"
                                value="dark"
                                color={colors.primary}
                                labelStyle={{ color: colors.onSurface }}
                            />
                        </RadioButton.Group>
                        <Button
                            mode="contained"
                            onPress={() => setThemeModalVisible(false)}
                            style={{ marginTop: 20 }}
                            color={colors.primary}
                        >
                            OK
                        </Button>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
};

export default SettingsModal;

const styles = StyleSheet.create({
    settingsModal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    settingsContent: {
        padding: 20,
        paddingBottom: 45,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    settingsTitle: {
        fontSize: 18,
        flex: 1,
    },
    colorSchemeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userEmailValue: {
        fontSize: 15,
    },
    logoutButton: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutButtonText: {
        fontSize: 16,
    },
    themeSelectionModal: {
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
    },
    modalContent: {
        padding: 20,
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
});