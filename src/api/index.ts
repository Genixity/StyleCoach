import { create } from "apisauce";
import database from '@react-native-firebase/database';

const API_KEY = "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";

export const getFirebaseReference = (path: string) => {
	return database().ref(path);
};

export const openaiApi = create({
	baseURL: "https://api.openai.com/v1/chat",
	headers: {
		Authorization: "Bearer " + API_KEY,
		"Content-Type": "application/json",
	},
});