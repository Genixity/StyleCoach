import React from 'react';
import { SafeAreaView, View, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useChatbot } from '../hooks/useChatbot';
import ChatHeader from '../components/ChatHeader';
import ChatContent from '../components/ChatContent';
import SettingsModal from '../components/SettingsModal';
import SidePanel from '../components/SidePanel';

const ChatbotContent = () => {
  const {
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
    setChatId,
    setMessages,
    setInputText,
    setFullImageUri,
    setIsSidePanelOpen,
    setIsSettingsModalVisible,
    setIsRenameModalVisible,
    setRenameChatId,
    setNewChatTitle,
    setHapticEnabled,
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
  } = useChatbot();

  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ChatHeader
        isSidePanelOpen={isSidePanelOpen}
        handleToggleSidePanel={handleToggleSidePanel}
        messages={messages}
        handleNewChat={handleNewChat}
        hapticEnabled={hapticEnabled}
        burgerToCrossProgress={burgerToCrossProgress}
      />
      
      <View style={{ flex: 1 }}>
        {/* Wrap only ChatContent with TouchableWithoutFeedback */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ChatContent
            messages={messages}
            isTyping={isTyping}
            inputText={inputText}
            setInputText={setInputText}
            selectedImages={selectedImages}
            removeSelectedImage={removeSelectedImage}
            handlePickImage={handlePickImage}
            handleTakePhoto={handleTakePhoto}
            onSend={onSend}
            isSendButtonVisible={isSendButtonVisible}
            sendButtonAnimation={sendButtonAnimation}
            openFullImage={openFullImage}
            fullImageUri={fullImageUri}
            setFullImageUri={setFullImageUri}
            isRenameModalVisible={isRenameModalVisible}
            setIsRenameModalVisible={setIsRenameModalVisible}
            newChatTitle={newChatTitle}
            setNewChatTitle={setNewChatTitle}
            renameChat={renameChat}
          />
        </TouchableWithoutFeedback>

        {/* SidePanel and SettingsModal are outside the TouchableWithoutFeedback */}
        <SidePanel
          isSidePanelOpen={isSidePanelOpen}
          sidePanelAnimation={sidePanelAnimation}
          backgroundColorAnimation={backgroundColorAnimation}
          burgerToCrossProgress={burgerToCrossProgress}
          chatList={chatList}
          chatId={chatId}
          setChatId={setChatId}
          setMessages={setMessages}
          setIsSidePanelOpen={setIsSidePanelOpen}
          isLongPress={isLongPress}
          deleteChat={deleteChat}
          handleSearch={handleSearch}
          searchQuery={searchQuery}
          refreshing={refreshing}
          fetchChatList={fetchChatList}
          setRenameChatId={setRenameChatId}
          setNewChatTitle={setNewChatTitle}
          setIsRenameModalVisible={setIsRenameModalVisible}
          user={user}
          setIsSettingsModalVisible={setIsSettingsModalVisible}
        />

        <SettingsModal
          isSettingsModalVisible={isSettingsModalVisible}
          setIsSettingsModalVisible={setIsSettingsModalVisible}
          hapticEnabled={hapticEnabled}
          setHapticEnabled={setHapticEnabled}
          setTheme={setTheme}
          theme={theme}
          capitalize={capitalize}
          user={user}
          signOut={signOut}
        />
      </View>
    </SafeAreaView>
  );
};

export default ChatbotContent;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});