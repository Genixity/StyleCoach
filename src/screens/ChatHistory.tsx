
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  SafeAreaView,
  Alert,
  RefreshControl,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NavigationProp } from "@react-navigation/native";
import database from '@react-native-firebase/database';
import { groupByLastUpdated } from "../utils/chatUtils";
import ChatListItem from "../components/chatListItem";
import { useAuth } from '../hooks/useAuth';
import { useTheme } from 'react-native-paper';

interface ChatHistoryScreenProps {
  navigation: NavigationProp<any>;
}

const ChatHistoryScreen = ({ navigation }: ChatHistoryScreenProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [focusedChatId, setFocusedChatId] = useState("");
  const [userId, setUserId] = useState("");
  const [chatList, setChatList] = useState([]);
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const { colors } = useTheme();

  useEffect(() => {
    if (user) {
      setUserId(user.uid);
    }
  }, [user]);

  useEffect(() => {
    isFocused && userId && fetchChatList();
  }, [isFocused, userId]);

  const fetchChatList = async () => {
    setFocusedChatId("");
    setRefreshing(true);

    try {
      const snapshot = await database().ref(`/chats/${userId}`).once('value');
      const data = snapshot.val();
      if (data) {
        const chatList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        const transformedList: any = groupByLastUpdated(chatList);
        setChatList(transformedList);
      } else {
        setChatList([]);
      }
    } catch (e) {
      console.error("Error fetching chats:", e);
      setChatList([]);
    }

    setRefreshing(false);
  };

  const onDeleteItem = async (sectionTitle: string, chatId: string) => {
    Alert.alert(
      "Delete Conversation Confirmation",
      "",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              await database().ref(`/chats/${userId}/${chatId}`).remove();
              setChatList((prevState: any) =>
                prevState.map((section: any) =>
                  section.title === sectionTitle
                    ? {
                        ...section,
                        data: section.data?.filter(
                          (item: any) => item.id !== chatId
                        ),
                      }
                    : section
                )
              );
            } catch (e) {
              console.error("Error deleting chat:", e);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const onScrollBeginDrag = () => {
    focusedChatId && setFocusedChatId("");
  };

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: { title: string };
  }) => (
    <Text style={[styles.sectionHeader, { color: colors.primary }]}>
      {title}
    </Text>
  );

  const renderItemSeparator = () => <View style={{ height: 12 }} />;

  const renderSectionSeparator = () => <View style={{ height: 18 }} />;

  const renderItem = ({ item, section }: any) => (
    <ChatListItem
      item={item}
      userId={userId}
      onDeleteItem={onDeleteItem.bind(null, section.title)}
      focusedChatId={focusedChatId}
      setFocusedChatId={setFocusedChatId}
    />
  );

  const renderListEmpty = () => (
    <Text style={[styles.emptyListText, { color: colors.onSurface }]}>
      Your recent conversations will appear here.
    </Text>
  );

  return (
    <SafeAreaView
      style={[styles.safeAreaContainer, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.newChatButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            navigation.navigate("Chatbot", { userId });
          }}
        >
          <Ionicons name="chatbox-ellipses" size={24} color={colors.onPrimary} />
          <Text style={[styles.newChatText, { color: colors.onPrimary }]}>
            Start New Chat
          </Text>
        </TouchableOpacity>

        <SectionList
          sections={chatList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={renderItemSeparator}
          SectionSeparatorComponent={renderSectionSeparator}
          ListEmptyComponent={renderListEmpty}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              tintColor={colors.onBackground}
              refreshing={refreshing}
              onRefresh={fetchChatList}
            />
          }
          onScrollBeginDrag={onScrollBeginDrag}
        />
      </View>
    </SafeAreaView>
  );
};

export default ChatHistoryScreen;

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 30,
  },
  newChatButton: {
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 20,
  },
  newChatText: {
    fontSize: 18,
    marginLeft: 10,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyListText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 50,
  },
});