import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Switch, useTheme } from 'react-native-paper';
import ContextMenu from 'react-native-context-menu-view';

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
                    <ContextMenu
                        title="Select Color Scheme"
                        actions={[
                            { title: 'System' },
                            { title: 'Light' },
                            { title: 'Dark' },
                        ]}
                        onPress={(e) => {
                            const { index } = e.nativeEvent;
                            const options: Array<'system' | 'light' | 'dark'> = [
                                'system',
                                'light',
                                'dark',
                            ];
                            const selectedTheme = options[index];
                            if (selectedTheme) {
                                setTheme(selectedTheme);
                            }
                        }}
                    >
                        <TouchableOpacity style={styles.colorSchemeSelector}>
                            <Text
                                style={{
                                    color: colors.onSurface,
                                    fontSize: 18,
                                    marginRight: 10,
                                }}
                            >
                                {capitalize(theme)}
                            </Text>
                            <View style={styles.iconContainer}>
                                <Ionicons
                                    name="chevron-up-outline"
                                    size={20}
                                    color={colors.onSurface}
                                    style={{ marginBottom: -3 }}
                                />
                                <Ionicons
                                    name="chevron-down-outline"
                                    size={20}
                                    color={colors.onSurface}
                                    style={{ marginTop: -3 }}
                                />
                            </View>
                        </TouchableOpacity>
                    </ContextMenu>
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
    iconContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
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
});