import React, { useEffect, useState, useContext, useRef } from "react";
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
  Animated,
  Easing,
  Keyboard,
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { openaiApi } from "../api";
import { useTheme, Switch } from 'react-native-paper';
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
import ContextMenu from 'react-native-context-menu-view';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { TypingAnimation } from 'react-native-typing-animation';
import MessageItem from '../components/MessageItem';

// Helper function to capitalize the first letter
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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

interface ChatItem {
  id: string;
  title: string;
  messages: Message[];
}

interface ChatSection {
  title: string;
  data: ChatItem[];
}

const ChatbotScreen = (props: ChatbotScreenProps) => {
  const isLongPress = useRef(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const { colors } = useTheme();
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [chatList, setChatList] = useState<ChatSection[]>([]);
  const [focusedChatId, setFocusedChatId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const { setTheme, theme } = useContext(PreferencesContext);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const { width } = Dimensions.get('window');
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const sidePanelAnimation = useRef(new Animated.Value(0)).current;
  const backgroundColorAnimation = useRef(new Animated.Value(0)).current;
  const [burgerToCrossProgress] = useState(new Animated.Value(0));
  const sendButtonAnimation = useRef(new Animated.Value(0)).current;
  const [isSendButtonVisible, setIsSendButtonVisible] = useState(false);

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

  useEffect(() => {
    if (isSidePanelOpen) {
      Animated.spring(sidePanelAnimation, {
        toValue: 1,
        useNativeDriver: false,
      }).start();
      Animated.timing(backgroundColorAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      Animated.timing(burgerToCrossProgress, {
        toValue: 1,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.spring(sidePanelAnimation, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
      Animated.timing(backgroundColorAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      Animated.timing(burgerToCrossProgress, {
        toValue: 0,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  }, [isSidePanelOpen]);

  useEffect(() => {
    if (inputText.trim() === '' && selectedImages.length === 0) {
      if (isSendButtonVisible) {
        Animated.timing(sendButtonAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start(() => setIsSendButtonVisible(false));
      }
    } else {
      setIsSendButtonVisible(true);
      Animated.timing(sendButtonAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [inputText, selectedImages]);

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
      content: `You are a helpful assistant. Write structured messages in markdown format.`,
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

  const getTitleSummary = async (text: string): Promise<string | undefined> => {
    const systemMessage = {
      role: "system",
      content: `Generate a short title for this message.`,
    };

    try {
      const response: any = await openaiApi.post("/completions", {
        model: "gpt-4o-mini",
        max_tokens: 1024,
        temperature: 0.7,
        messages: [systemMessage, { role: "user", content: text }],
      });

      if (response.ok) {
        let title = response.data.choices[0].message.content.trim();

        const quoteRegex = /^(['"`])(.*)\1$/;
        const match = title.match(quoteRegex);

        if (match) {
          title = match[2].trim();
        }

        return title;
      }
    } catch (error) {
      console.error("Error fetching title summary:", error);
    }
  };


  const onSend = () => {
    if (inputText.trim() === '' && selectedImages.length === 0) return;

    if (hapticEnabled) {
      ReactNativeHapticFeedback.trigger('impactLight');
    }

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
    Keyboard.dismiss();
  };

  const handlePickImage = () => {
    if (hapticEnabled) {
      ReactNativeHapticFeedback.trigger('impactLight');
    }

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
    if (hapticEnabled) {
      ReactNativeHapticFeedback.trigger('impactLight');
    }

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

  const handleNewChat = () => {
    if (hapticEnabled) {
      ReactNativeHapticFeedback.trigger('impactLight');
    }
    setChatId(null);
    setMessages([]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filteredChats = chatList.map((section: any) => {
      const filteredData = section.data.filter((chat: any) => {
        const titleMatch = chat.title?.toLowerCase().includes(query.toLowerCase());
        const messagesMatch = chat.messages.some((message: any) =>
          message.text.toLowerCase().includes(query.toLowerCase())
        );
        const date = new Date(chat.messages[chat.messages.length - 1].createdAt);
        const dateString = date.toLocaleDateString();
        const dateMatch = dateString.includes(query);
        return titleMatch || messagesMatch || dateMatch;
      });
      return {
        title: section.title,
        data: filteredData,
      };
    }).filter((section: any) => section.data.length > 0);
    setChatList(filteredChats);
  };

  const renderChatListItem = ({ item, section }: { item: ChatItem; section: ChatSection }) => (
    <ContextMenu
      title={item.title || 'Chat Options'}
      actions={[
        {
          title: 'Rename',
          systemIcon: 'pencil',
        },
        {
          title: 'Delete',
          systemIcon: 'trash',
          destructive: true,
        },
      ]}
      onPress={(e) => {
        const { index } = e.nativeEvent;
        if (index === 0) { // Rename je první položka
          setRenameChatId(item.id);
          setNewChatTitle(item.title);
          setIsRenameModalVisible(true);
        } else if (index === 1) { // Delete je druhá položka
          deleteChat(item.id);
        }
        // Reset příznaku po zpracování akce menu
        isLongPress.current = false;
      }}
    >
      <TouchableOpacity
        onPress={() => {
          if (!isLongPress.current) {
            if (hapticEnabled) {
              ReactNativeHapticFeedback.trigger('impactLight');
            }
            setChatId(item.id);
            setMessages(item.messages);
            setIsSidePanelOpen(false);
          }
          // Reset příznaku po zpracování stisku
          isLongPress.current = false;
        }}
        onLongPress={() => {
          // Nastavení příznaku při dlouhém stisknutí
          isLongPress.current = true;
        }}
      >
        <View
          style={[
            styles.chatListItem,
            {
              backgroundColor:
                item.id === chatId ? colors.surfaceVariant : 'transparent',
              paddingVertical: item.id === chatId ? 12 : 8,
            },
          ]}
        >
          <Text
            style={[
              styles.chatTitle,
              { color: colors.onSurface },
            ]}
            numberOfLines={1}
          >
            {item.title || item.messages?.[0]?.text}
          </Text>
        </View>
      </TouchableOpacity>
    </ContextMenu>
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

  const deleteChat = async (chatId: string) => {
    if (hapticEnabled) {
      ReactNativeHapticFeedback.trigger('notificationWarning');
    }
    try {
      await database().ref(`/chats/${userId}/${chatId}`).remove();
      fetchChatList();
    } catch (e) {
      console.error('Error deleting chat:', e);
    }
  };

  const sidePanelWidth = width * 0.75;
  const sidePanelTranslateX = sidePanelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-sidePanelWidth, 0],
  });
  const backgroundColor = backgroundColorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)'],
  });

  const renderEmptyChat = () => (
    <View style={styles.emptyChatContainer}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
      />
      <Text style={[styles.emptyChatText, { color: colors.onSurface }]}>
        Start a conversation!
      </Text>
    </View>
  );

  const renderMessageItem = ({ item, index }: { item: Message; index: number }) => (
    <MessageItem item={item} index={index} openFullImage={openFullImage} />
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => {
            if (hapticEnabled) {
              ReactNativeHapticFeedback.trigger('impactLight');
            }
            setIsSidePanelOpen(!isSidePanelOpen);
          }}
          style={styles.headerButton}
        >
          {/* Animace rotace a změna ikony z "menu" na "close" */}
          <Animated.View
            style={{
              transform: [
                {
                  rotate: burgerToCrossProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '90deg'],
                  }),
                },
              ],
            }}
          >
            <Ionicons
              name={isSidePanelOpen ? "close" : "menu"}
              size={24}
              color={colors.onSurface}
            />
          </Animated.View>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Style Coach
        </Text>
        <TouchableOpacity
          onPress={messages.length > 0 ? handleNewChat : undefined}
          disabled={messages.length === 0}
          style={styles.headerButton}
        >
          <MaterialCommunityIcons
            name="chat-plus"
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
            {messages.length === 0 ? (
              // Zobrazí se pouze renderEmptyChat, pokud nejsou žádné zprávy
              renderEmptyChat()
            ) : (
              // Jinak zobrazí FlatList a případný indikátor psaní
              <>
                <FlatList
                  data={messages}
                  renderItem={renderMessageItem}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={{ padding: 16 }}
                />

                {isTyping && (
                  <View style={styles.typingIndicatorContainer}>
                    <TypingAnimation
                      dotMargin={10}
                      dotRadius={4}
                      dotColor={colors.onSurface}
                    />
                  </View>
                )}
              </>
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
                    if (hapticEnabled) {
                      ReactNativeHapticFeedback.trigger('impactLight');
                    }
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
            <Animated.View style={[styles.greyedOutOverlay, { backgroundColor }]} />
          </TouchableWithoutFeedback>
        )}

        {/* Side Panel */}
        <Animated.View
          style={[
            styles.sidePanel,
            {
              backgroundColor: colors.background,
              borderRightColor: colors.surfaceVariant,
              transform: [{ translateX: sidePanelTranslateX }],
            },
          ]}
        >
          {/* Search Field */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchInputWrapper,
                { backgroundColor: colors.surface },
                styles.shadowStyle,
              ]}
            >
              <Ionicons name="search" size={20} color={colors.onSurface} style={{ marginRight: 8 }} />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: colors.onSurface },
                ]}
                placeholder="Search chats..."
                placeholderTextColor={colors.onSurface}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>
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
          />

          {/* Bottom Container */}
          <TouchableOpacity
            style={[
              styles.bottomContainer,
              { borderTopColor: colors.surfaceVariant, padding: 15 },
            ]}
            onPress={() => setIsSettingsModalVisible(true)}
          >
            <Text style={[styles.userEmailValue, { color: colors.onSurface }]}>
              {user?.email}
            </Text>
            {/* Přidání ikony tří teček */}
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </Animated.View>

        {/* Settings Modal */}
        <Modal
          isVisible={isSettingsModalVisible}
          onBackdropPress={() => setIsSettingsModalVisible(false)}
          style={styles.settingsModal}
        >
          <View
            style={[styles.settingsContent, { backgroundColor: colors.background }]}
          >
            <View style={styles.settingsItem}>
              <Ionicons name="mail" size={24} color={colors.onSurface} style={{ marginRight: 8 }} />
              <Text style={[styles.settingsTitle, { color: colors.onSurface }]}>
                Email
              </Text>
              <View style={styles.colorSchemeSelector}>
                <Text style={[styles.userEmailValue, { color: colors.onSurface }]}>
                  {user?.email}
                </Text>
              </View>
            </View>
            <View style={styles.settingsItem}>
              <Ionicons name="color-palette" size={24} color={colors.onSurface} style={{ marginRight: 8 }} />
              <Text style={[styles.settingsTitle, { color: colors.onSurface }]}>
                Color Scheme
              </Text>
              {/* Použití Menu komponenty pro výběr color schematu */}
              <ContextMenu
                title="Select Color Scheme"
                actions={[
                  { title: 'System' },
                  { title: 'Light' },
                  { title: 'Dark' },
                ]}
                onPress={(e) => {
                  const { index } = e.nativeEvent;
                  const options: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark'];
                  const selectedTheme = options[index];
                  if (selectedTheme) {
                    setTheme(selectedTheme);
                  }
                }}
              >
                <TouchableOpacity style={styles.colorSchemeSelector}>
                  <Text style={{ color: colors.onSurface, fontSize: 18, marginRight: 10 }}>
                    {capitalize(theme)}
                  </Text>
                  <View style={styles.iconContainer}>
                    <Ionicons name="chevron-up-outline" size={20} color={colors.onSurface} style={{ marginBottom: -3 }} />
                    <Ionicons name="chevron-down-outline" size={20} color={colors.onSurface} style={{ marginTop: -3 }} />
                  </View>
                </TouchableOpacity>
              </ContextMenu>
            </View>
            <View style={styles.settingsItem}>
              <Ionicons name="notifications" size={24} color={colors.onSurface} style={{ marginRight: 8 }} />
              <Text style={[styles.settingsTitle, { color: colors.onSurface }]}>
                Haptic Feedback
              </Text>
              <Switch
                value={hapticEnabled}
                onValueChange={(value) => setHapticEnabled(value)}
                color={colors.primary}
              />
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                if (hapticEnabled) {
                  ReactNativeHapticFeedback.trigger('notificationWarning');
                }
                auth().signOut();
              }}
            >
              <Ionicons name="exit-outline" size={24} color={colors.error} style={{ marginRight: 8 }} />
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
    left: Dimensions.get('window').width * 0.75,
    top: 0,
    width: Dimensions.get('window').width * 0.25,
    height: '100%',
    zIndex: 1,
  },
  sidePanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: Dimensions.get('window').width * 0.75,
    height: '100%',
    zIndex: 2,
    borderRightWidth: 1,
  },
  searchContainer: {
    padding: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
  },
  chatListItem: {
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  chatTitle: {
    fontSize: 16,
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
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 15, // Zlepšení odsazení
    justifyContent: 'space-between', // Uspořádání emailu a ikony tří teček
  },
  userEmail: {
    fontSize: 15,
  },
  userEmailValue: {
    fontSize: 15,
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
  container: {
    flex: 1,
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
  logoutButton: {
    marginTop: 20,
    flexDirection: 'row',
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
  shadowStyle: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
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
    width: 131.76,
    height: 120,
    alignSelf: 'center',
  },
  typingIndicatorContainer: {
    marginBottom: 35,
    marginLeft: 20,
    alignItems: 'flex-start',
    backgroundColor: 'red'
  },
});