export function groupByLastUpdated(chats: any) {
	const currentDate = new Date();
	const groupedData: any = [];

	chats.sort((a: any, b: any) => {
		const dateA = new Date(a.messages[a.messages.length - 1].createdAt);
		const dateB = new Date(b.messages[b.messages.length - 1].createdAt);
		return dateB?.valueOf() - dateA?.valueOf();
	});

	chats.forEach((chat: any) => {
		const createdAtDate = new Date(chat.messages[chat.messages.length - 1].createdAt);
		const timeDiff = currentDate.valueOf() - createdAtDate.valueOf();
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
			const monthNames = "Months";
			group = monthNames[createdAtDate.getMonth()];
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


export function splitDisplayName(fullName: string) {
	const nameParts = fullName.split(",");
	if (nameParts.length >= 3) {
		const [username, firstName, lastName] = nameParts;
		return { username, firstName, lastName };
	} else {
		// Handle the case where the full name doesn't contain at least two parts
		return { username: "", firstName: "", lastName: "" };
	}
}