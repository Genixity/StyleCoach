import { create } from "apisauce";
import { OPENAI_API_KEY } from "@env";

export const openaiApi = create({
	baseURL: "https://api.openai.com/v1/chat",
	headers: {
		Authorization: "Bearer " + OPENAI_API_KEY,
		"Content-Type": "application/json",
	},
});