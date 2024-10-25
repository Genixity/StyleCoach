import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { useTheme } from 'react-native-paper';

interface RenameChatModalProps {
    isRenameModalVisible: boolean;
    setIsRenameModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
    newChatTitle: string;
    setNewChatTitle: React.Dispatch<React.SetStateAction<string>>;
    renameChat: () => void;
}

const RenameChatModal: React.FC<RenameChatModalProps> = ({
    isRenameModalVisible,
    setIsRenameModalVisible,
    newChatTitle,
    setNewChatTitle,
    renameChat,
}) => {
    const { colors } = useTheme();

    return (
        <Modal
            isVisible={isRenameModalVisible}
            onBackdropPress={() => setIsRenameModalVisible(false)}
            style={styles.renameModal}
        >
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Rename Chat</Text>
                <TextInput
                    style={[
                        styles.modalInput,
                        { backgroundColor: colors.surface, color: colors.onSurface },
                    ]}
                    value={newChatTitle}
                    onChangeText={setNewChatTitle}
                />
                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setIsRenameModalVisible(false)}>
                        <Text style={[styles.modalButtonText, { color: colors.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={renameChat}>
                        <Text style={[styles.modalButtonText, { color: colors.primary }]}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default RenameChatModal;

const styles = StyleSheet.create({
    renameModal: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        borderRadius: 12,
    },
    modalTitle: {
        fontSize: 18,
        marginBottom: 10,
    },
    modalInput: {
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButtonText: {
        fontSize: 16,
    },
});