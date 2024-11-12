import React, { useCallback } from 'react';
import {
  View,
  TextInput,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
  FlatList,
  ListRenderItem,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from 'react-native-paper';
import { SelectedImage } from '../types/types';

interface InputBarProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  selectedImages: SelectedImage[];
  removeSelectedImage: (index: number) => void;
  handlePickImage: () => void;
  handleTakePhoto: () => void;
  onSend: () => void;
  isSendButtonVisible: boolean;
  sendButtonAnimation: Animated.Value;
}

const InputBar: React.FC<InputBarProps> = ({
  inputText,
  setInputText,
  selectedImages,
  removeSelectedImage,
  handlePickImage,
  handleTakePhoto,
  onSend,
  isSendButtonVisible,
  sendButtonAnimation,
}) => {
  const { colors } = useTheme();

  const renderSelectedImage: ListRenderItem<SelectedImage> = useCallback(
    ({ item, index }) => (
      <View style={styles.selectedImageWrapper}>
        <Image source={{ uri: item.uri }} style={styles.selectedImage} />
        <TouchableOpacity
          style={styles.removeImageButton}
          onPress={() => removeSelectedImage(index)}
        >
          <Ionicons name="close-circle" size={20} color="red" />
        </TouchableOpacity>
      </View>
    ),
    [removeSelectedImage]
  );

  return (
    <View
      style={[
        styles.inputContainer,
        { borderTopColor: colors.surface, backgroundColor: colors.background },
      ]}
    >
      {selectedImages.length > 0 && (
        <FlatList
          data={selectedImages}
          renderItem={renderSelectedImage}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          contentContainerStyle={styles.selectedImagesContainer}
        />
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.textInput,
            { backgroundColor: colors.surface, color: colors.onSurface },
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={colors.onSurface}
        />
        <TouchableOpacity onPress={handlePickImage} style={styles.iconButton}>
          <Ionicons name="image" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleTakePhoto} style={styles.iconButton}>
          <Ionicons name="camera" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        {isSendButtonVisible && (
          <Animated.View
            style={[
              styles.sendButton,
              {
                backgroundColor: colors.secondary,
                opacity: sendButtonAnimation,
                transform: [
                  {
                    scale: sendButtonAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity onPress={onSend}>
              <Ionicons name="send" size={24} color={'#FFF'} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

export default React.memo(InputBar);

const styles = StyleSheet.create({
  inputContainer: {
    borderTopWidth: 1,
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  selectedImageWrapper: {
    position: 'relative',
    marginRight: 15,
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  iconButton: {
    marginLeft: 10,
    padding: 5,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 20,
  },
});