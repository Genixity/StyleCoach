
import React from 'react';
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';

interface ChatListItemProps {
	item: any;
	userId: string;
	onDeleteItem: (id: string) => void;
	focusedChatId: string;
	setFocusedChatId: (id: string) => void;
}

const ChatListItem = ({
	item,
	userId,
	onDeleteItem,
	focusedChatId,
	setFocusedChatId,
}: ChatListItemProps) => {
	const navigation = useNavigation<any>();
	const [showDeleteButton, setShowDeleteButton] = React.useState(false);
	const { colors } = useTheme();

	React.useEffect(() => {
		showDeleteButton && focusedChatId !== item.id && setShowDeleteButton(false);
	}, [focusedChatId]);

	return (
		<Pressable
			onPress={() =>
				showDeleteButton
					? setShowDeleteButton(false)
					: navigation.navigate("Chatbot", {
						chatId: item.id,
						messages: item.messages,
						userId: userId,
					})
			}
			onLongPress={() => (setShowDeleteButton(true), setFocusedChatId(item.id))}
			style={({ pressed }) => [
				styles.container,
				pressed && !showDeleteButton && { opacity: 0.7 },
				showDeleteButton && { backgroundColor: colors.surfaceVariant },
				{ borderColor: colors.secondary },
			]}
		>
			<View style={{ flex: 1 }}>
				<Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
					{item.title || item.messages?.[0]?.text}
				</Text>
				<Text
					style={[styles.description, { color: colors.secondary }]}
					numberOfLines={1}
				>
					{item.messages?.[1]?.text}
				</Text>
			</View>

			{showDeleteButton && (
				<MaterialCommunityIcons
					name="delete"
					size={26}
					color={colors.error}
					onPress={() => onDeleteItem(item.id)}
				/>
			)}
		</Pressable>
	);
};

export default ChatListItem;

const styles = StyleSheet.create({
	container: {
		padding: 12,
		borderWidth: 1,
		borderRadius: 12,
		marginBottom: 16,
		flexDirection: "row",
		alignItems: "center",
	},
	title: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	description: {
		marginTop: 4,
	},
});