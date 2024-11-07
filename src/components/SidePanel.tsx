import React from 'react';
import {
    Animated,
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
    SectionList,
    TextInput,
    Dimensions,
    RefreshControl,
    TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from 'react-native-paper';
import ContextMenu from 'react-native-context-menu-view';
import { ChatItem, ChatSection } from '../types/types';
import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';

interface SidePanelProps {
    isSidePanelOpen: boolean;
    sidePanelAnimation: Animated.Value;
    backgroundColorAnimation: Animated.Value;
    burgerToCrossProgress: Animated.Value;
    chatList: ChatSection[];
    chatId: string | null;
    setChatId: React.Dispatch<React.SetStateAction<string | null>>;
    setMessages: React.Dispatch<React.SetStateAction<any[]>>;
    setIsSidePanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isLongPress: React.MutableRefObject<boolean>;
    deleteChat: (chatId: string) => void;
    handleSearch: (query: string) => void;
    searchQuery: string;
    refreshing: boolean;
    fetchChatList: () => void;
    setRenameChatId: React.Dispatch<React.SetStateAction<string | null>>;
    setNewChatTitle: React.Dispatch<React.SetStateAction<string>>;
    setIsRenameModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
    user: any;
    setIsSettingsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidePanel: React.FC<SidePanelProps> = ({
    isSidePanelOpen,
    sidePanelAnimation,
    backgroundColorAnimation,
    burgerToCrossProgress,
    chatList,
    chatId,
    setChatId,
    setMessages,
    setIsSidePanelOpen,
    isLongPress,
    deleteChat,
    handleSearch,
    searchQuery,
    refreshing,
    fetchChatList,
    setRenameChatId,
    setNewChatTitle,
    setIsRenameModalVisible,
    user,
    setIsSettingsModalVisible,
}) => {
    const { colors } = useTheme();
    const { width } = Dimensions.get('window');
    const sidePanelWidth = width * 0.75;
    const sidePanelTranslateX = sidePanelAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-sidePanelWidth, 0],
    });
    const backgroundColor = backgroundColorAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)'],
    });

    const hapticEnabled = true;

    const triggerHapticFeedback = (
        type: HapticFeedbackTypes = HapticFeedbackTypes.impactLight
    ) => {
        if (hapticEnabled) {
            ReactNativeHapticFeedback.trigger(type);
        }
    };

    const renderChatListItem = ({ item }: { item: ChatItem }) => (
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
                if (index === 0) {
                    setRenameChatId(item.id);
                    setNewChatTitle(item.title);
                    setIsRenameModalVisible(true);
                } else if (index === 1) {
                    deleteChat(item.id);
                }
                isLongPress.current = false;
            }}
        >
            <TouchableOpacity
                onPress={() => {
                    if (!isLongPress.current) {
                        triggerHapticFeedback(HapticFeedbackTypes.notificationWarning);
                        setChatId(item.id);
                        setMessages(item.messages);
                        setIsSidePanelOpen(false);
                    }
                    isLongPress.current = false;
                }}
                onLongPress={() => {
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
                        style={[styles.chatTitle, { color: colors.onSurface }]}
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
        <Text style={[styles.sectionHeader, { color: colors.primary }]}>{title}</Text>
    );

    const chatKeyExtractor = (item: ChatItem) => item.id;

    return (
        <>
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
                        <Ionicons
                            name="search"
                            size={20}
                            color={colors.onSurface}
                            style={{ marginRight: 8 }}
                        />
                        <TextInput
                            style={[styles.searchInput, { color: colors.onSurface }]}
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
                    keyExtractor={chatKeyExtractor}
                    renderItem={renderChatListItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={{ padding: 10 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchChatList} />
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
                    <Ionicons name="ellipsis-horizontal" size={24} color={colors.onSurface} />
                </TouchableOpacity>
            </Animated.View>
        </>
    );
};

export default SidePanel;

const styles = StyleSheet.create({
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
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 10,
    },
    bottomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingTop: 10,
        paddingHorizontal: 15,
        justifyContent: 'space-between',
    },
    userEmailValue: {
        fontSize: 15,
    },
    shadowStyle: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 3,
    },
});
