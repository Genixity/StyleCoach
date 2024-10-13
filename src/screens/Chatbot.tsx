import React, { useEffect, useState } from "react";
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
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFirebaseReference, openaiApi } from "../api";
import { useTheme } from 'react-native-paper';
import { launchCamera, launchImageLibrary, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
import Modal from 'react-native-modal';
import RNFS from 'react-native-fs';

interface ChatbotScreenProps {
  route: any;
}

interface SelectedImage {
  uri: string;
  aspectRatio: number;
}

interface Message {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: number;
    name: string;
  };
  images?: SelectedImage[];
}

const ChatbotScreen = ({ route }: ChatbotScreenProps) => {
  const [isTyping, setIsTyping] = useState(false);
  const [userId] = useState(route.params.userId);
  const [chatId, setChatId] = useState(route.params.chatId);
  const [messages, setMessages] = useState<Message[]>(route.params.messages || []);
  const [inputText, setInputText] = useState('');
  const { colors } = useTheme();
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);

  useEffect(() => {
    const processMessages = async () => {
      if (messages.length && messages[messages.length - 1].user._id === 2) {
        await getCompletion(messages);
      }
    };
    processMessages();
  }, [messages]);

  const encodeImageToBase64 = async (uri: string): Promise<string> => {
    try {
      let filePath = uri;

      if (Platform.OS === 'android' && uri.startsWith('content://')) {
        const fileName = uri.split('/').pop();
        const destPath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;
        await RNFS.copyFile(uri, destPath);
        filePath = destPath;
      } else if (Platform.OS === 'ios' && uri.startsWith('assets-library://')) {
        // Pro iOS získáme reálnou cestu k souboru
        const destPath = `${RNFS.TemporaryDirectoryPath}/${Date.now()}.jpg`;
        await RNFS.copyAssetsFileIOS(uri, destPath, 0, 0);
        filePath = destPath;
      }

      const base64 = await RNFS.readFile(filePath, 'base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Chyba při kódování obrázku:', error);
      return '';
    }
  };

  const getCompletion = async (messages: Message[]) => {
    const systemMessage = {
      role: "system",
      content: `You are a helpful assistant.`,
    };

    const transformedMessages = await Promise.all(messages.map(async (message) => {
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
    }));

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
          createdAt: new Date(),
          user: {
            _id: 1,
            name: "Style coach",
          },
        };

        const updatedMessages = [...messages, replyMessage];

        setIsTyping(false);
        setMessages(updatedMessages);

        console.log('Saving messages to Firebase:', updatedMessages);

        try {
          if (chatId) {
            await getFirebaseReference(`/chats/${userId}/${chatId}/messages`).set(
              updatedMessages
            );
          } else {
            const title = await getTitleSummary(updatedMessages[0].text);
            const newChatRef = await getFirebaseReference(`/chats/${userId}`).push({
              title: title || "",
              messages: updatedMessages,
            });
            const newChatId = newChatRef.key;
            setChatId(newChatId);
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
      createdAt: new Date(),
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
          aspectRatio: asset.width && asset.height ? asset.width / asset.height : 1,
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
      } else if (response.errorCode) {
        Alert.alert('Chyba', response.errorMessage || 'Neznámá chyba');
      } else if (response.assets) {
        const asset = response.assets[0];
        const newImage = {
          uri: asset.uri || '',
          aspectRatio: asset.width && asset.height ? asset.width / asset.height : 1,
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
            <Text style={[styles.messageText, { color: colors.onSurface }]}>{item.text}</Text>
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
      const imageWidth = (screenWidth * 0.66 - (imagesPerRow - 1) * 4 - 10) / imagesPerRow;

      return (
        <View style={[styles.imageRow, { justifyContent: 'flex-end' }]}>
          {images.map((image, index) => (
            <TouchableOpacity key={index} onPress={() => openFullImage(image.uri)}>
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
          )).reverse()}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
            Style coach píše...
          </Text>
        )}

        <View style={[styles.inputContainer, { borderTopColor: colors.surface, backgroundColor: colors.background }]}>
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
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.onSurface }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Napište zprávu..."
              placeholderTextColor={colors.onSurface}
            />
            <TouchableOpacity onPress={handlePickImage} style={styles.iconButton}>
              <Ionicons name="image" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTakePhoto} style={styles.iconButton}>
              <Ionicons name="camera" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onSend} style={[styles.sendButton, { backgroundColor: colors.secondary }]}>
              <Ionicons name="send" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
            <TouchableOpacity style={styles.closeButton} onPress={() => setFullImageUri(null)}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default ChatbotScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  selectedImageWrapper: {
    position: 'relative',
    marginRight: 5,
    marginBottom: 5,
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
    paddingBottom: 5,
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
    backgroundColor: 'black',
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