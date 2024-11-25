//class Player {
//		constructor (id, color) {
//			this.id = id;
//			this.color = color;
//			this.Paddle = new Paddle(id, color);
//			this.score = 0;
//		}
//	}

	async function getPlayerInfo() {
	try {
		const dbQuery = await fetch('http://django/api/player/info/', {
			method: 'GET',
			headers: {
				'Auth' : `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		});
		if (!dbQuery.ok) {
			throw new Error('Failed to fetch player info');
		}
		const playerInfo = await dbQuery.json();
		return playerInfo;
	} catch (error) {
		console.error('Error fetching player info:', error);
		throw error;
	}
	}

	async function requestRoom() {

	}

	function setupRoom() {

	}
