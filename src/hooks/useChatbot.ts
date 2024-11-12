import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Animated, Easing, Platform, Alert, Keyboard } from 'react-native';
import RNFS from 'react-native-fs';
import { launchCamera, launchImageLibrary, ImageLibraryOptions, CameraOptions, MediaType, ImagePickerResponse } from 'react-native-image-picker';
import database from '@react-native-firebase/database';
import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import { openaiApi } from '../api';
import { useAuth } from './useAuth';
import { PreferencesContext } from '../context/preferencesContext';
import { groupByLastUpdated } from '../utils/chatUtils';
import { Message, SelectedImage, ChatSection } from '../types/types';
import auth from '@react-native-firebase/auth';

export const useChatbot = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [chatList, setChatList] = useState<ChatSection[]>([]);
  const [originalChatList, setOriginalChatList] = useState<ChatSection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [isSendButtonVisible, setIsSendButtonVisible] = useState(false);

  const { user } = useAuth();
  const { setTheme, theme } = useContext(PreferencesContext);

  const sidePanelAnimation = useRef(new Animated.Value(0)).current;
  const backgroundColorAnimation = useRef(new Animated.Value(0)).current;
  const [burgerToCrossProgress] = useState(new Animated.Value(0));
  const sendButtonAnimation = useRef(new Animated.Value(0)).current;
  const isLongPress = useRef(false);

  const userId = user?.uid || '';

  const triggerHapticFeedback = useCallback(
    (type: HapticFeedbackTypes = HapticFeedbackTypes.impactLight) => {
      if (hapticEnabled) {
        ReactNativeHapticFeedback.trigger(type, {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      }
    },
    [hapticEnabled]
  );

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

  const fetchChatList = useCallback(async () => {
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
          setOriginalChatList(groupedChatList);
        } else {
          setChatList([]);
          setOriginalChatList([]);
        }
      } else {
        setChatList([]);
        setOriginalChatList([]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChatList([]);
      setOriginalChatList([]);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

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
      role: 'system',
      content: `You are a helpful assistant. You can write structured messages in markdown format.`,
    };

    const transformedMessages = await Promise.all(
      messages.map(async (message) => {
        let content: string | any[] = '';

        if (message.images && message.images.length > 0) {
          content = [];

          if (message.text && message.text.trim() !== '') {
            content.push({ type: 'text', text: message.text });
          }

          for (const image of message.images) {
            const base64Image = await encodeImageToBase64(image.uri);
            if (base64Image) {
              content.push({
                type: 'image_url',
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
          role: message.user._id === 1 ? 'assistant' : 'user',
          content: content,
        };
      })
    );

    try {
      const response: any = await openaiApi.post('/completions', {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        messages: [systemMessage, ...transformedMessages],
      });
      if (response.status === 200) {
        const replyMessage: Message = {
          _id: response.data.id,
          text: response.data.choices[0].message.content,
          createdAt: Date.now(),
          user: {
            _id: 1,
            name: 'Style Coach',
          },
        };

        setIsTyping(false);
        setMessages((prevMessages) => [...prevMessages, replyMessage]);

        try {
          if (chatId) {
            await database()
              .ref(`/chats/${userId}/${chatId}/messages`)
              .set([...messages, replyMessage]);
          } else {
            const title = await getTitleSummary(messages[0].text);
            const newChatRef = await database().ref(`/chats/${userId}`).push({
              title: title || '',
              messages: [...messages, replyMessage],
            });
            const newChatId = newChatRef.key;
            setChatId(newChatId);
            fetchChatList();
          }
        } catch (error) {
          console.error('Error saving messages to Firebase:', error);
        }
      } else {
        Alert.alert('Something went wrong', response.data?.error?.code || '');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsTyping(false);
    }
  };

  const getTitleSummary = async (text: string): Promise<string | undefined> => {
    const systemMessage = {
      role: 'system',
      content: `Generate a short title for this message.`,
    };

    try {
      const response: any = await openaiApi.post('/completions', {
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [systemMessage, { role: 'user', content: text }],
      });

      if (response.status === 200) {
        let title = response.data.choices[0].message.content.trim();

        const quoteRegex = /^(['"`])(.*)\1$/;
        const match = title.match(quoteRegex);

        if (match) {
          title = match[2].trim();
        }

        return title;
      }
    } catch (error) {
      console.error('Error fetching title summary:', error);
    }
  };

  const onSend = useCallback(() => {
    if (inputText.trim() === '' && selectedImages.length === 0) return;

    triggerHapticFeedback();

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

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setIsTyping(true);
    setInputText('');
    setSelectedImages([]);
    Keyboard.dismiss();
  }, [inputText, selectedImages, triggerHapticFeedback]);

  const handlePickImage = useCallback(() => {
    triggerHapticFeedback();

    const options: ImageLibraryOptions = {
      selectionLimit: 4 - selectedImages.length,
      mediaType: 'photo' as MediaType,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets) {
        const newImages = response.assets.map((asset) => ({
          uri: asset.uri || '',
          aspectRatio:
            asset.width && asset.height ? asset.width / asset.height : 1,
        }));
        setSelectedImages((prevImages) => [...prevImages, ...newImages]);
      }
    });
  }, [selectedImages.length, triggerHapticFeedback]);

  const handleTakePhoto = useCallback(async () => {
    try {
      triggerHapticFeedback();
  
      const options: CameraOptions = {
        mediaType: 'photo' as MediaType,
        saveToPhotos: true,
      };
  
      const result: ImagePickerResponse = await launchCamera(options);
  
      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
  
      if (result.errorCode) {
        console.error('ImagePicker Error: ', result.errorMessage);
        Alert.alert('Error', 'Failed to take photo. Please try again.');
        return;
      }
  
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newImage: SelectedImage = {
          uri: asset.uri || '',
          aspectRatio:
            asset.width && asset.height ? asset.width / asset.height : 1,
        };
        setSelectedImages((prevImages) => [...prevImages, newImage]);
      }
    } catch (error) {
      console.error('Unexpected Error: ', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  }, [triggerHapticFeedback, setSelectedImages]);

  const removeSelectedImage = (index: number) => {
    const updatedImages = [...selectedImages];
    updatedImages.splice(index, 1);
    setSelectedImages(updatedImages);
  };

  const openFullImage = (uri: string) => {
    setFullImageUri(uri);
  };

  const handleNewChat = useCallback(() => {
    triggerHapticFeedback();
    setChatId(null);
    setMessages([]);
    Keyboard.dismiss();
  }, [triggerHapticFeedback]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setChatList(originalChatList);
      return;
    }
    const filteredChats = originalChatList
      .map((section) => {
        const filteredData = section.data.filter((chat) => {
          const titleMatch = chat.title
            ?.toLowerCase()
            .includes(query.toLowerCase());
          const messagesMatch = chat.messages.some((message) =>
            message.text.toLowerCase().includes(query.toLowerCase())
          );
          const date = new Date(
            chat.messages[chat.messages.length - 1].createdAt
          );
          const dateString = date.toLocaleDateString();
          const dateMatch = dateString.includes(query);
          return titleMatch || messagesMatch || dateMatch;
        });
        return {
          title: section.title,
          data: filteredData,
        };
      })
      .filter((section) => section.data.length > 0);
    setChatList(filteredChats);
  };

  const deleteChat = async (chatId: string) => {
    triggerHapticFeedback(HapticFeedbackTypes.notificationWarning);
    try {
      await database().ref(`/chats/${userId}/${chatId}`).remove();
      fetchChatList();
      if (chatId === chatId) {
        setChatId(null);
        setMessages([]);
      }
    } catch (e) {
      console.error('Error deleting chat:', e);
    }
  };

  const renameChat = async () => {
    triggerHapticFeedback(HapticFeedbackTypes.notificationWarning);
    try {
      await database()
        .ref(`/chats/${userId}/${renameChatId}`)
        .update({ title: newChatTitle });
      setIsRenameModalVisible(false);
      fetchChatList();
    } catch (e) {
      console.error('Error renaming chat:', e);
    }
  };

  const handleToggleSidePanel = useCallback(() => {
    triggerHapticFeedback();
    setIsSidePanelOpen((prev) => !prev);
    Keyboard.dismiss();
  }, [triggerHapticFeedback]);

  const signOut = () => {
    triggerHapticFeedback(HapticFeedbackTypes.notificationWarning);
    auth().signOut();
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return {
    isTyping,
    chatId,
    messages,
    inputText,
    selectedImages,
    fullImageUri,
    isSidePanelOpen,
    chatList,
    refreshing,
    searchQuery,
    isSettingsModalVisible,
    isRenameModalVisible,
    renameChatId,
    newChatTitle,
    hapticEnabled,
    isSendButtonVisible,
    sidePanelAnimation,
    backgroundColorAnimation,
    burgerToCrossProgress,
    sendButtonAnimation,
    isLongPress,
    user,
    theme,
    userId,
    setTheme,
    setIsTyping,
    setChatId,
    setMessages,
    setInputText,
    setSelectedImages,
    setFullImageUri,
    setIsSidePanelOpen,
    setChatList,
    setRefreshing,
    setSearchQuery,
    setIsSettingsModalVisible,
    setIsRenameModalVisible,
    setRenameChatId,
    setNewChatTitle,
    setHapticEnabled,
    setIsSendButtonVisible,
    fetchChatList,
    onSend,
    handlePickImage,
    handleTakePhoto,
    removeSelectedImage,
    openFullImage,
    handleNewChat,
    handleSearch,
    deleteChat,
    renameChat,
    handleToggleSidePanel,
    signOut,
    capitalize,
  };
};