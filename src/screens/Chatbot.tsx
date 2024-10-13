// src/screens/Chatbot.tsx

import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableWithoutFeedback,
  Dimensions,
  SectionList,
  RefreshControl,
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { openaiApi } from "../api";
import { useTheme, RadioButton } from 'react-native-paper';
import {
  launchCamera,
  launchImageLibrary,
  ImageLibraryOptions,
  CameraOptions,
} from 'react-native-image-picker';
import Modal from 'react-native-modal';
import RNFS from 'react-native-fs';
import { groupByLastUpdated } from "../utils/chatUtils";
import database from '@react-native-firebase/database';
import { useAuth } from '../hooks/useAuth';
import auth from '@react-native-firebase/auth';
import { PreferencesContext } from '../context/preferencesContext';

interface ChatbotScreenProps {
  route?: any;
}

interface SelectedImage {
  uri: string;
  aspectRatio: number;
}

interface Message {
  _id: string;
  text: string;
  createdAt: number;
  user: {
    _id: number;
    name: string;
  };
  images?: SelectedImage[];
}

const ChatbotScreen = (props: ChatbotScreenProps) => {
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const { colors } = useTheme();
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [focusedChatId, setFocusedChatId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [themeSelection, setThemeSelection] = useState<'system' | 'light' | 'dark'>('system');
  const { setTheme, theme } = useContext(PreferencesContext);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (user) {
      setUserId(user.uid);
    }
  }, [user]);

  useEffect(() => {
    if (userId) {
      fetchChatList();
    }
  }, [userId]);

  useEffect(() => {
    const processMessages = async () => {
      if (messages.length && messages[messages.length - 1].user._id === 2) {
        await getCompletion(messages);
      }
    };
    processMessages();
  }, [messages]);

  const fetchChatList = async () => {
    setFocusedChatId("");
    setRefreshing(true);
    try {
      const snapshot = await database().ref(`/chats/${userId}`).once('value');
      const data = snapshot.val();
      if (data) {
        const chatListData = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        if (chatListData.length) {
          const groupedChatList = groupByLastUpdated(chatListData);
          setChatList(groupedChatList);
        } else {
          setChatList([]);
        }
      } else {
        setChatList([]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChatList([]);
    } finally {
      setRefreshing(false);
    }
  };

  const encodeImageToBase64 = async (uri: string): Promise<string> => {
    try {
      let filePath = uri;

      if (Platform.OS === 'android' && uri.startsWith('content://')) {
        const fileName = uri.split('/').pop();
        const destPath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;
        await RNFS.copyFile(uri, destPath);
        filePath = destPath;
      } else if (Platform.OS === 'ios' && uri.startsWith('assets-library://')) {
        const destPath = `${RNFS.TemporaryDirectoryPath}/${Date.now()}.jpg`;
        await RNFS.copyAssetsFileIOS(uri, destPath, 0, 0);
        filePath = destPath;
      }

      const base64 = await RNFS.readFile(filePath, 'base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error encoding image:', error);
      return '';
    }
  };

  const getCompletion = async (messages: Message[]) => {
    const systemMessage = {
      role: "system",
      content: `You are a helpful assistant.`,
    };

    const transformedMessages = await Promise.all(
      messages.map(async (message) => {
        let content: any;

        if (message.images && message.images.length > 0) {
          content = [];

          if (message.text && message.text.trim() !== '') {
            content.push({ type: "text", text: message.text });
          }

          for (const image of message.images) {
            const base64Image = await encodeImageToBase64(image.uri);
            if (base64Image) {
              content.push({
                type: "image_url",
                image_url: {
                  url: base64Image,
                },
              });
            }
          }
        } else {
          content = message.text;
        }

        return {
          role: message.user._id === 1 ? "assistant" : "user",
          content: content,
        };
      })
    );

    try {
      const response: any = await openaiApi.post("/completions", {
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [systemMessage, ...transformedMessages],
      });
      if (response.ok) {
        const replyMessage: Message = {
          _id: response.data.id,
          text: response.data.choices[0].message.content,
          createdAt: Date.now(),
          user: {
            _id: 1,
            name: "Style Coach",
          },
        };

        const updatedMessages = [...messages, replyMessage];

        setIsTyping(false);
        setMessages(updatedMessages);

        try {
          if (chatId) {
            await database().ref(`/chats/${userId}/${chatId}/messages`).set(
              updatedMessages
            );
          } else {
            const title = await getTitleSummary(updatedMessages[0].text);
            const newChatRef = await database().ref(`/chats/${userId}`).push({
              title: title || "",
              messages: updatedMessages,
            });
            const newChatId = newChatRef.key;
            setChatId(newChatId);
            fetchChatList();
          }
        } catch (error) {
          console.error('Error saving messages to Firebase:', error);
        }
      } else {
        Alert.alert("Something went wrong", response.data?.error?.code || "");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsTyping(false);
    }
  };

  const getTitleSummary = async (text: string) => {
    const systemMessage = {
      role: "system",
      content: `Generate a short title for this message without quotation marks.`,
    };
    try {
      const response: any = await openaiApi.post("/completions", {
        model: "gpt-4o-mini",
        max_tokens: 1024,
        temperature: 0.7,
        messages: [systemMessage, { role: "user", content: text }],
      });
      if (response.ok) {
        return response.data.choices[0].message.content;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onSend = () => {
    if (inputText.trim() === '' && selectedImages.length === 0) return;

    const newMessage: Message = {
      _id: `${Date.now()}`,
      text: inputText,
      createdAt: Date.now(),
      user: {
        _id: 2,
        name: 'User',
      },
      images: selectedImages,
    };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsTyping(true);
    setInputText('');
    setSelectedImages([]);
  };

  const handlePickImage = () => {
    const options: ImageLibraryOptions = {
      selectionLimit: 4 - selectedImages.length,
      mediaType: 'photo',
    };

    launchImageLibrary(options, (response) => {
      if (response.assets) {
        const newImages = response.assets.map((asset) => ({
          uri: asset.uri || '',
          aspectRatio:
            asset.width && asset.height ? asset.width / asset.height : 1,
        }));
        setSelectedImages([...selectedImages, ...newImages]);
      }
    });
  };

  const handleTakePhoto = () => {
    const options: CameraOptions = {
      mediaType: 'photo',
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        // User cancelled the action
      } else if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Unknown error');
      } else if (response.assets) {
        const asset = response.assets[0];
        const newImage = {
          uri: asset.uri || '',
          aspectRatio:
            asset.width && asset.height ? asset.width / asset.height : 1,
        };
        setSelectedImages([...selectedImages, newImage]);
      }
    });
  };

  const removeSelectedImage = (index: number) => {
    const updatedImages = [...selectedImages];
    updatedImages.splice(index, 1);
    setSelectedImages(updatedImages);
  };

  const openFullImage = (uri: string) => {
    setFullImageUri(uri);
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMyMessage = item.user._id === 2;
    const totalImages = item.images ? item.images.length : 0;

    return (
      <View style={{ marginBottom: 10 }}>
        {item.images && totalImages > 0 && (
          <View
            style={[
              styles.imageContainer,
              isMyMessage ? styles.myImageContainer : styles.botImageContainer,
            ]}
          >
            {renderImages(item.images, totalImages)}
          </View>
        )}
        {item.text !== '' && (
          <View
            style={[
              styles.messageContainer,
              isMyMessage ? styles.myMessage : styles.botMessage,
              { backgroundColor: isMyMessage ? colors.primary : colors.surface },
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: isMyMessage ? '#FAF9F6' : colors.onSurface },
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderImages = (images: SelectedImage[], totalImages: number) => {
    const screenWidth = Dimensions.get('window').width;
    const maxImageHeight = 250;

    if (totalImages === 1) {
      const image = images[0];
      const imageAspectRatio = image.aspectRatio;
      let width = screenWidth * 0.8;
      let height = width / imageAspectRatio;

      if (height > maxImageHeight) {
        height = maxImageHeight;
        width = height * imageAspectRatio;
      }

      return (
        <View style={{ alignItems: 'flex-end' }}>
          <TouchableOpacity onPress={() => openFullImage(image.uri)}>
            <Image
              source={{ uri: image.uri }}
              style={{ width, height, borderRadius: 8 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      );
    } else {
      const imagesPerRow = totalImages === 4 ? 2 : totalImages;
      const imageWidth =
        (screenWidth * 0.66 - (imagesPerRow - 1) * 4 - 10) / imagesPerRow;

      return (
        <View style={[styles.imageRow, { justifyContent: 'flex-end' }]}>
          {images
            .map((image, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => openFullImage(image.uri)}
              >
                <Image
                  source={{ uri: image.uri }}
                  style={{
                    width: imageWidth,
                    height: imageWidth,
                    borderRadius: 8,
                    margin: 2,
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))
            .reverse()}
        </View>
      );
    }
  };

  const handleNewChat = () => {
    setChatId(null);
    setMessages([]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search functionality
    // For simplicity, we are not filtering the chatList in this example
  };

  const renderChatListItem = ({ item, section }: any) => (
    <TouchableOpacity
      onPress={() => {
        setChatId(item.id);
        setMessages(item.messages);
        setIsSidePanelOpen(false);
      }}
      onLongPress={() => {
        setFocusedChatId(item.id);
        showContextMenu(item.id, item.title);
      }}
    >
      <Text
        style={[
          styles.chatTitle,
          { color: colors.onSurface },
          focusedChatId === item.id && { backgroundColor: colors.surfaceVariant },
        ]}
        numberOfLines={1}
      >
        {item.title || item.messages?.[0]?.text}
      </Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: { title: string };
  }) => (
    <Text style={[styles.sectionHeader, { color: colors.primary }]}>
      {title}
    </Text>
  );

  const showContextMenu = (chatId: string, currentTitle: string) => {
    Alert.alert(
      'Chat Options',
      '',
      [
        {
          text: 'Rename',
          onPress: () => {
            setRenameChatId(chatId);
            setNewChatTitle(currentTitle);
            setIsRenameModalVisible(true);
          },
        },
        { text: 'Delete', onPress: () => deleteChat(chatId) },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const deleteChat = async (chatId: string) => {
    try {
      await database().ref(`/chats/${userId}/${chatId}`).remove();
      fetchChatList();
    } catch (e) {
      console.error('Error deleting chat:', e);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => setIsSidePanelOpen(true)}
          style={styles.headerButton}
        >
          <Ionicons name="menu" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Style Coach
        </Text>
        <TouchableOpacity
          onPress={messages.length > 0 ? handleNewChat : undefined}
          disabled={messages.length === 0}
          style={styles.headerButton}
        >
          <Ionicons
            name="chatbubbles"
            size={24}
            color={messages.length > 0 ? colors.onSurface : 'grey'}
          />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {/* Chat Content */}
        <View style={styles.chatContainer}>
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <FlatList
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16 }}
            />

            {isTyping && (
              <Text style={[styles.typingIndicator, { color: colors.onSurface }]}>
                Style Coach is typing...
              </Text>
            )}

            <View
              style={[
                styles.inputContainer,
                { borderTopColor: colors.surface, backgroundColor: colors.background },
              ]}
            >
              {selectedImages.length > 0 && (
                <View style={styles.selectedImagesContainer}>
                  {selectedImages.map((image, index) => (
                    <View key={index} style={styles.selectedImageWrapper}>
                      <Image
                        source={{ uri: image.uri }}
                        style={styles.selectedImage}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeSelectedImage(index)}
                      >
                        <Ionicons name="close-circle" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
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
                <TouchableOpacity
                  onPress={onSend}
                  style={[styles.sendButton, { backgroundColor: colors.secondary }]}
                >
                  <Ionicons name="send" size={24} color={'#FFF'} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>

          {/* Full Image Modal */}
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

          {/* Rename Chat Modal */}
          <Modal
            isVisible={isRenameModalVisible}
            onBackdropPress={() => setIsRenameModalVisible(false)}
            style={styles.renameModal}
          >
            <View
              style={[styles.modalContent, { backgroundColor: colors.background }]}
            >
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                Rename Chat
              </Text>
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
                  <Text style={[styles.modalButtonText, { color: colors.primary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await database()
                        .ref(`/chats/${userId}/${renameChatId}`)
                        .update({ title: newChatTitle });
                      setIsRenameModalVisible(false);
                      fetchChatList();
                    } catch (e) {
                      console.error('Error renaming chat:', e);
                    }
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.primary }]}>
                    OK
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>

        {/* Greyed-Out Overlay */}
        {isSidePanelOpen && (
          <TouchableWithoutFeedback onPress={() => setIsSidePanelOpen(false)}>
            <View style={styles.greyedOutOverlay} />
          </TouchableWithoutFeedback>
        )}

        {/* Side Panel */}
        {isSidePanelOpen && (
          <View
            style={[
              styles.sidePanel,
              { backgroundColor: colors.background, borderRightColor: colors.surfaceVariant },
            ]}
          >
            {/* Search Field */}
            <View>
              <TextInput
                style={[
                  styles.searchInput,
                  { backgroundColor: colors.surface, color: colors.onSurface },
                ]}
                placeholder="Search chats..."
                placeholderTextColor={colors.onSurface}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>
            {/* Chat History */}
            <SectionList
              sections={chatList}
              keyExtractor={(item) => item.id}
              renderItem={renderChatListItem}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={{ padding: 10 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={fetchChatList}
                />
              }
              onScrollBeginDrag={() => {
                if (focusedChatId) {
                  setFocusedChatId("");
                }
              }}
            />

            {/* Bottom Container */}
            <TouchableOpacity
              style={[
                styles.bottomContainer,
                { borderTopColor: colors.surfaceVariant },
              ]}
              onPress={() => setIsSettingsModalVisible(true)}
            >
              <Text style={[styles.userEmail, { color: colors.onSurface }]}>
                {user?.email}
              </Text>
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Modal */}
        <Modal
          isVisible={isSettingsModalVisible}
          onBackdropPress={() => setIsSettingsModalVisible(false)}
          style={styles.settingsModal}
        >
          <View
            style={[styles.settingsContent, { backgroundColor: colors.background }]}
          >
            <Text style={[styles.settingsEmail, { color: colors.onSurface }]}>
              {user?.email}
            </Text>
            <Text style={[styles.settingsTitle, { color: colors.onSurface }]}>
              Color Scheme
            </Text>
            <RadioButton.Group
              onValueChange={(value: string) => {
                if (value === 'system' || value === 'light' || value === 'dark') {
                  setTheme(value);
                  setThemeSelection(value);
                }
              }}
              value={theme}
            >
              <RadioButton.Item label="System" value="system" />
              <RadioButton.Item label="Light" value="light" />
              <RadioButton.Item label="Dark" value="dark" />
            </RadioButton.Group>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => auth().signOut()}
            >
              <Text style={[styles.logoutButtonText, { color: colors.error }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default ChatbotScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
  },
  greyedOutOverlay: {
    position: 'absolute',
    left: Dimensions.get('window').width * 0.66,
    top: 0,
    width: Dimensions.get('window').width * 0.34,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  sidePanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: Dimensions.get('window').width * 0.66,
    height: '100%',
    zIndex: 2,
    borderRightWidth: 1,
    padding: 10,
  },
  searchInput: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  chatTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 10,
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  userEmail: {
    fontSize: 14,
  },
  container: {
    flex: 1,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    marginLeft: 50,
    borderRadius: 16,
  },
  botMessage: {
    alignSelf: 'flex-start',
    marginRight: 50,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
  },
  imageContainer: {
    marginBottom: 5,
  },
  myImageContainer: {
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  botImageContainer: {
    alignSelf: 'flex-start',
    marginRight: 50,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    paddingRight: 10,
  },
  typingIndicator: {
    padding: 10,
    fontStyle: 'italic',
    fontSize: 16,
  },
  inputContainer: {
    borderTopWidth: 1,
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
    paddingHorizontal: 15,
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
  settingsModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  settingsContent: {
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  settingsEmail: {
    fontSize: 16,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  logoutButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
  },
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