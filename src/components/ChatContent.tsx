import React, { useCallback, useMemo } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  StyleSheet,
  Animated,
  Image,
  Text,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import MessageItem from './MessageItem';
import InputBar from './InputBar';
import FullImageModal from './FullImageModal';
import RenameChatModal from './RenameChatModal';
import { Message, SelectedImage } from '../types/types';
import { TypingAnimation } from 'react-native-typing-animation';

interface ChatContentProps {
  messages: Message[];
  isTyping: boolean;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  selectedImages: SelectedImage[];
  removeSelectedImage: (index: number) => void;
  handlePickImage: () => void;
  handleTakePhoto: () => void;
  onSend: () => void;
  isSendButtonVisible: boolean;
  sendButtonAnimation: Animated.Value;
  openFullImage: (uri: string) => void;
  fullImageUri: string | null;
  setFullImageUri: React.Dispatch<React.SetStateAction<string | null>>;
  isRenameModalVisible: boolean;
  setIsRenameModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  newChatTitle: string;
  setNewChatTitle: React.Dispatch<React.SetStateAction<string>>;
  renameChat: () => void;
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  isTyping,
  inputText,
  setInputText,
  selectedImages,
  removeSelectedImage,
  handlePickImage,
  handleTakePhoto,
  onSend,
  isSendButtonVisible,
  sendButtonAnimation,
  openFullImage,
  fullImageUri,
  setFullImageUri,
  isRenameModalVisible,
  setIsRenameModalVisible,
  newChatTitle,
  setNewChatTitle,
  renameChat,
}) => {
  const { colors } = useTheme();

  const renderMessageItem = useCallback(
    ({ item, index }: { item: Message; index: number }) => (
      <MessageItem item={item} index={index} openFullImage={openFullImage} />
    ),
    [openFullImage]
  );

  const messageKeyExtractor = useCallback((item: Message) => item._id, []);

  const renderEmptyChat = useMemo(
    () => (
      <View style={styles.emptyChatContainer}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
        />
        <Text style={[styles.emptyChatText, { color: colors.onSurface }]}>
          Start a conversation!
        </Text>
      </View>
    ),
    [colors.onSurface]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
    >
      {messages.length === 0 ? (
        renderEmptyChat
      ) : (
        <>
          <FlatList
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={messageKeyExtractor}
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled" // Allow tapping inside FlatList without dismissing the keyboard
          />
          {isTyping && (
            <View style={styles.typingIndicatorContainer}>
              <TypingAnimation dotMargin={10} dotRadius={4} dotColor={colors.onSurface} />
            </View>
          )}
        </>
      )}

      <InputBar
        inputText={inputText}
        setInputText={setInputText}
        selectedImages={selectedImages}
        removeSelectedImage={removeSelectedImage}
        handlePickImage={handlePickImage}
        handleTakePhoto={handleTakePhoto}
        onSend={onSend}
        isSendButtonVisible={isSendButtonVisible}
        sendButtonAnimation={sendButtonAnimation}
      />

      <FullImageModal fullImageUri={fullImageUri} setFullImageUri={setFullImageUri} />

      <RenameChatModal
        isRenameModalVisible={isRenameModalVisible}
        setIsRenameModalVisible={setIsRenameModalVisible}
        newChatTitle={newChatTitle}
        setNewChatTitle={setNewChatTitle}
        renameChat={renameChat}
      />
    </KeyboardAvoidingView>
  );
};

export default React.memo(ChatContent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  typingIndicatorContainer: {
    marginBottom: 35,
    marginLeft: 20,
    alignItems: 'flex-start',
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatText: {
    fontSize: 18,
    marginTop: 20,
  },
  logo: {
    height: 120,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
});