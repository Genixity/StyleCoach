import React from 'react';
import {
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
} from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface FullImageModalProps {
    fullImageUri: string | null;
    setFullImageUri: React.Dispatch<React.SetStateAction<string | null>>;
}

const FullImageModal: React.FC<FullImageModalProps> = ({
    fullImageUri,
    setFullImageUri,
}) => {
    return (
        <Modal
            isVisible={fullImageUri !== null}
            onBackdropPress={() => setFullImageUri(null)}
            style={styles.fullImageModal}
        >
            <TouchableWithoutFeedback onPress={() => setFullImageUri(null)}>
                <View style={styles.fullImageContainer}>
                    {fullImageUri && (
                        <Image
                            source={{ uri: fullImageUri }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setFullImageUri(null)}
                    >
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default FullImageModal;

const styles = StyleSheet.create({
    fullImageModal: {
        margin: 0,
    },
    fullImageContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
    },
});