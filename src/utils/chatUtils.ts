export function groupByLastUpdated(chats: any) {
	const currentDate = Date.now();
	const groupedData: any = [];

	chats.sort((a: any, b: any) => {
		const dateA = a.messages[a.messages.length - 1].createdAt;
		const dateB = b.messages[b.messages.length - 1].createdAt;
		return dateB - dateA;
	});

	chats.forEach((chat: any) => {
		const createdAtTimestamp = chat.messages[chat.messages.length - 1].createdAt;
		const timeDiff = currentDate - createdAtTimestamp;
		let group: string;

		if (timeDiff < 24 * 60 * 60 * 1000) {
			group = "Today";
		} else if (timeDiff < 2 * 24 * 60 * 60 * 1000) {
			group = "Yesterday";
		} else if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
			group = "Last 7 Days";
		} else if (timeDiff < 30 * 24 * 60 * 60 * 1000) {
			group = "Last 30 Days";
		} else {
			const monthNames = [
				"January",
				"February",
				"March",
				"April",
				"May",
				"June",
				"July",
				"August",
				"September",
				"October",
				"November",
				"December",
			];
			const date = new Date(createdAtTimestamp);
			group = monthNames[date.getMonth()];
		}

		const existingGroup = groupedData.find((groupObj: any) => groupObj.title === group);

		if (existingGroup) {
			existingGroup.data.push(chat);
		} else {
			groupedData.push({ title: group, data: [chat] });
		}
	});

	return groupedData;
}  