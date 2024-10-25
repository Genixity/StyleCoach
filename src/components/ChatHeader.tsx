import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from 'react-native-paper';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface ChatHeaderProps {
  isSidePanelOpen: boolean;
  handleToggleSidePanel: () => void;
  messages: any[];
  handleNewChat: () => void;
  hapticEnabled: boolean;
  burgerToCrossProgress: Animated.Value;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isSidePanelOpen,
  handleToggleSidePanel,
  messages,
  handleNewChat,
  hapticEnabled,
  burgerToCrossProgress,
}) => {
  const { colors } = useTheme();
  const isMessagesEmpty = messages.length === 0;

  const handleMenuPress = useCallback(() => {
    if (hapticEnabled) {
      ReactNativeHapticFeedback.trigger('impactLight');
    }
    handleToggleSidePanel();
  }, [hapticEnabled, handleToggleSidePanel]);

  return (
    <View style={[styles.header, { borderBottomColor: colors.surface }]}>
      <TouchableOpacity onPress={handleMenuPress} style={styles.headerButton}>
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
            name={isSidePanelOpen ? 'close' : 'menu'}
            size={24}
            color={colors.onSurface}
          />
        </Animated.View>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Style Coach</Text>
      <TouchableOpacity
        onPress={!isMessagesEmpty ? handleNewChat : undefined}
        disabled={isMessagesEmpty}
        style={styles.headerButton}
      >
        <Ionicons
          name="chatbubbles-outline"
          size={24}
          color={!isMessagesEmpty ? colors.onSurface : 'grey'}
        />
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(ChatHeader);

const styles = StyleSheet.create({
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
});