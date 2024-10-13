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
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFirebaseReference, openaiApi } from "../api";
import { useTheme } from 'react-native-paper';

interface ChatbotScreenProps {
  route: any;
}

interface Message {
  _id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: number;
    name: string;
  };
}

const ChatbotScreen = ({ route }: ChatbotScreenProps) => {
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState(route.params.userId);
  const [chatId, setChatId] = useState(route.params.chatId);
  const [messages, setMessages] = useState<Message[]>(route.params.messages || []);
  const [inputText, setInputText] = useState('');
  const { colors } = useTheme();

  useEffect(() => {
    if (messages.length && messages[messages.length - 1].user._id === 2) {
      getCompletion(messages);
    }
  }, [messages]);

  const getCompletion = async (messages: Message[]) => {
    const systemMessage = {
      role: "system",
      content: `You are a helpful assistant.`,
    };

    const transformedMessages = messages.map((message) => ({
      role: message.user._id === 1 ? "assistant" : "user",
      content: message.text,
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
    if (inputText.trim() === '') return;
    const newMessage: Message = {
      _id: `${Date.now()}`,
      text: inputText,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'User',
      },
    };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsTyping(true);
    setInputText('');
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMyMessage = item.user._id === 2;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.botMessage,
          { backgroundColor: isMyMessage ? colors.primary : colors.surface }
        ]}
      >
        <Text style={[styles.messageText, { color: colors.onSurface }]}>{item.text}</Text>
      </View>
    );
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
            Style coach is typing...
          </Text>
        )}

        <View style={[styles.inputContainer, { borderTopColor: colors.surface, backgroundColor: colors.background }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.surface, color: colors.onSurface }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Write a message..."
            placeholderTextColor={colors.onSurface}
          />
          <TouchableOpacity onPress={onSend} style={[styles.sendButton, { backgroundColor: colors.secondary }]}>
            <Ionicons name="send" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: 10,
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
  typingIndicator: {
    padding: 10,
    fontStyle: 'italic',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 20,
  },
});