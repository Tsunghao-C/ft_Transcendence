export const playerDatas = {
	players: {
		Player1: {
			login: "Player1",
			username: "Player1",
			password: "Player1",
			mailAddress: "Player1@g.com",
			profilePicture: "wtf.jpeg",
			mmr: 1500,
			win: 13,
			lose: 12,
			rank: 3,
			status: "online",
			friends: ["Player4"],
			blocks: ["Player3"],
			pending: ["Player3"],
			sent: ["Player2"],
			matchHistory: [["27/11/2024", "W", "Player2", [11, 2]]]
		},

		Player2: {
			login: "Player2",
			username: "Player2",
			password: "Player2",
			mailAddress: "Player2@g.com",
			profilePicture: "wtf.jpeg",
			mmr: 2500,
			win: 13,
			lose: 12,
			rank: 2,
			status: "offline",
			friends: ["Player1"],
			blocks: ["Player3"],
			matchHistory: []
		},

		Player3: {
			login: "Player3",
			username: "Player3",
			password: "Player3",
			mailAddress: "Player3@g.com",
			profilePicture: "wtf.jpeg",
			mmr: 3500,
			win: 13,
			lose: 12,
			rank: 1,
			status: "online",
			friends: [],
			blocks: ["Player3"],
			matchHistory: [["27/11/2024", "W", "Player4", [11, 2]]]
		},

		Player4: {
				login: "Player4",
				username: "Player4",
				password: "Player4",
				mailAddress: "Player4@g.com",
				profilePicture: "wtf.jpeg",
				mmr: 500,
				win: 13,
				lose: 12,
				rank: 4,
				status: "ingame",
				friends: [],
				blocks: ["Player3"],
				matchHistory: [["27/11/2024", "W", "Player2", [11, 2]], ["27/11/2024", "L", "Player1", [5, 11]], ["26/11/2024", "W", "Player3", [11, 1]],["25/11/2024", "W", "Player2", [11, 2]], ["24/11/2024", "L", "Player1", [5, 11]], ["23/11/2024", "W", "Player3", [11, 1]], ["22/11/2024", "W", "Player2", [11, 2]], ["21/11/2024", "L", "Player1", [5, 11]], ["20/11/2024", "W", "Player3", [11, 1]], ["19/11/2024", "W", "Player2", [11, 2]], ["18/11/2024", "L", "Player1", [5, 11]], ["17/11/2024", "W", "Player3", [11, 1]], ["16/11/2024", "W", "Player2", [11, 2]], ["14/11/2024", "L", "Player1", [5, 11]], ["/11/2024", "W", "Player3", [11, 1]], ["27/11/2024", "W", "Player2", [11, 2]], ["27/11/2024", "L", "Player1", [5, 11]], ["26/11/2024", "W", "Player3", [11, 1]], ["27/11/2024", "W", "Player2", [11, 2]], ["27/11/2024", "L", "Player1", [5, 11]], ["26/11/2024", "W", "Player3", [11, 1]]]
		}
	},
};


const addFriend = (login, friendLogin) => {
	const Player = playerDatas.players[login];
	if (Player && !Player.friends.includes(friendLogin)) {
		Player.friends.push(friendLogin);
	}
	};


