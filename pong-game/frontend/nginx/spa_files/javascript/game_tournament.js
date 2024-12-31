import { fetchWithToken, getLanguageCookie } from "./fetch_request.js";
import { setLocalLobby } from "./game_local.js";
import { setIsTournament } from "./game_utils.js";
import { hideElem } from "./utils.js";
import { TournamentPlayers } from "./game_utils.js";
import { setSoloLobby } from "./game_solo.js";
import { translations as trslt } from "./language_pack.js";


export async function setTournamentView(contentContainer) {
	setIsTournament(true);
	contentContainer.innerHTML = `
	<div class="tournament-view" id="tournament-view">
		<div id="tournament-status"></div>
		<button id="create-tournament-btn">Create New Tournament</button>
		<div id="match-container">
	</div>
	`;

	const tournamentStatusContainer = document.getElementById("tournament-status");
	const createTournamentButton = document.getElementById("create-tournament-btn");

	const userTournament = await getUserTournament();

	if (userTournament) {
		displayTournament(userTournament, tournamentStatusContainer);
	} else {
		tournamentStatusContainer.innerHTML = `<p>No tournament in progress.</p>`;
	}

	createTournamentButton.addEventListener("click", () => {
		setTournamentViewForm(contentContainer);
	});
}

function displayTournament(tournament, container) {
	const lng = getLanguageCookie() ||  "en";
	if (!container) return;

	container.innerHTML = `
		<h3>Tournament: ${tournament.name}</h3>
		<!-- <p>Owner: ${tournament.user}</p> -->
		<button id="go-back-EOG" style="display: none;">${trslt[lng].back}</button>
		<div id="brackets-container"></div>
		<button id="next-match-btn">Start next game</button>
		<div id="match-container"></div>
	`;

	const bracketsContainer = document.getElementById("brackets-container");

	tournament.brackets.forEach((bracket, index) => {
		const bracketDiv = document.createElement("div");
		bracketDiv.classList.add("bracket");
		bracketDiv.innerHTML = `
			<h4>Bracket ${index + 1}</h4>
			<ul>
				${bracket.players
					.map(
						(player) =>		
							`<li>
								${player.alias} (${player.is_ai === "human" ? "Human" : player.is_ai})
								<span style="color: ${
									player.result === "win" ? "green" : player.result === "lose" ? "red" : "gray"
								};">
									${
									player.result === "win"
										? "Qualified"
										: player.result === "lose"
										? "Eliminated"
										: "Not Played"
									}
								</span>
							</li>`
					)
					.join("")}
			</ul>
		`;

		bracketsContainer.appendChild(bracketDiv);
	});

	const nextMatchButton = document.getElementById("next-match-btn");
	nextMatchButton.addEventListener("click", async () => {
		await showNextMatch(tournament.id);
	});
}

function setTournamentViewForm(contentContainer) {
	contentContainer.innerHTML = `
	<div class="tournament-view" id="tournament-creation">
		<form id="tournament-form">
			<div>
				<input type="text" id="tournament-name" name="tournamentName" placeholder="Enter tournament name" required />
			</div>
			<hr>
			<div id="players-container">
				<div class="player-entry">
					<input type="text" placeholder="Enter player 1 alias" name="player1" required />
					<select name="type1">
						<option value="human">Human</option>
						<option value="easy">AI - Easy</option>
						<option value="medium">AI - Medium</option>
						<option value="hard">AI - Hard</option>
					</select>
				</div>
				<div class="player-entry">
					<input type="text" placeholder="Enter player 2 alias" name="player2" required />
					<select name="type2">
						<option value="human">Human</option>
						<option value="easy">AI - Easy</option>
						<option value="medium">AI - Medium</option>
						<option value="hard">AI - Hard</option>
					</select>
				</div>
			</div>
			<button type="button" id="add-player">+ Add Player</button>
			<button type="submit">Create Tournament</button>
		</form>
		<div id="tournament-result"></div>
	</div>`;

	setupTournamentForm(contentContainer);
}

export async function submitMatchResult(user1Id, user2Id, winner) {
	const matchContainer = document.getElementById("match-container");
	matchContainer.innerHTML = `<p>Submitting match result...</p>`;

	try {
		const response = await fetchWithToken(
			`/api/game/update-match-result/`,
			JSON.stringify({ user1_id: user1Id, user2_id: user2Id, winner: winner }),
			"POST"
		);

		if (!response.ok) {
			throw new Error("Failed to submit match result.");
		}

		alert("Match result updated successfully.");
		const tournament = await getUserTournament();
		if (tournament) {
			displayTournament(tournament, document.getElementById("tournament-status"));
		}
	} catch (error) {
		console.log(error);
		matchContainer.innerHTML = `<p>Error submitting match result.</p>`;
	}
}

function simulateMatch(difficulty1, difficulty2) {
    const probabilities = {
        'hard': { 'easy': 0.75, 'medium': 0.67, 'hard': 0.50 },
        'medium': { 'easy': 0.67, 'medium': 0.50, 'hard': 0.33 },
        'easy': { 'easy': 0.50, 'medium': 0.33, 'hard': 0.25 }
    };

    const chanceToWin = probabilities[difficulty1][difficulty2];

    const randomValue = Math.random();
    const winner = randomValue <= chanceToWin ? 'left' : 'right';

    return winner;
}

async function showNextMatch() {
	const matchContainer = document.getElementById("match-container");
	matchContainer.innerHTML = `<p>Loading next match...</p>`;

	try {
		const response = await fetchWithToken(`/api/game/next-game/`);
		if (!response.ok) {
			console.log(response);
			alert("nothing is working");
		}

		const data = await response.json();
		console.log(data);
		if (data.next_game.next_match) {
			const { player1, player2 } = data.next_game.next_match;
			if (player1.is_ai !== "human" && player2.is_ai != "human") {
				const winner = simulateMatch(player1.is_ai, player2.is_ai);
				submitMatchResult(player1.id, player2.id, winner);
				alert("ai game happened at the speed of light");
			} else {
				if (player1.is_ai !== "human" && player2.is_ai === "human") {
					TournamentPlayers.player2.id = player1.id;
					TournamentPlayers.player2.alias = player1.alias;
					TournamentPlayers.player1.id = player2.id;
					TournamentPlayers.player1.alias = player2.alias;
				} else {
					TournamentPlayers.player1.id = player1.id;
					TournamentPlayers.player1.alias = player1.alias;
					TournamentPlayers.player2.id = player2.id;
					TournamentPlayers.player2.alias = player2.alias;
				}
				if (player1.is_ai === "human" && player2.is_ai === "human") {
					setLocalLobby(matchContainer, true);
				} else {
					let difficulty;
					if (player1.is_ai === "human") {
						difficulty = player2.is_ai;
					} else {
						difficulty = player1.is_ai;
					}
					setSoloLobby(matchContainer, difficulty);
				}
			}
		} else if (data.next_game.message) {
			matchContainer.innerHTML = `<p>${data.next_game.message}</p>`;
		}
	} catch (error) {
		console.log(error);
		matchContainer.innerHTML = `<p>Error fetching next match.</p>`;
	}
}




function setupTournamentForm(contentContainer) {
	const maxPlayers = 16;
	const playersContainer = document.getElementById("players-container");
	const addPlayerButton = document.getElementById("add-player");

	let playerCount = 2;

	addPlayerButton.addEventListener("click", () => {
		if (playerCount >= maxPlayers) {
			alert("Maximum of 16 players allowed.");
			return;
		}

		playerCount++;
		const playerEntry = document.createElement("div");
		playerEntry.classList.add("player-entry");
		playerEntry.innerHTML = `
			<input type="text" placeholder="Enter player ${playerCount} alias" name="player${playerCount}" required />
			<select id="added-player" name="type${playerCount}">
				<option value="human">Human</option>
				<option value="easy">AI - Easy</option>
				<option value="medium">AI - Medium</option>
				<option value="hard">AI - Hard</option>
			</select>
			<button type="button" class="remove-player">X</button>
		`;
		playersContainer.appendChild(playerEntry);

		playerEntry.querySelector(".remove-player").addEventListener("click", () => {
			playerEntry.remove();
			playerCount--;
		});
	});

	const form = document.getElementById("tournament-form");
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		const formData = new FormData(form);
		const players = [];

		for (let i = 1; i <= playerCount; i++) {
			players.push({
				alias: formData.get(`player${i}`),
				is_ai: formData.get(`type${i}`),
			});
		}

		const tournamentData = {
			name: formData.get("tournamentName"),
			players,
		};

		try {
			const response = await fetchWithToken("/api/game/create-tournament/", JSON.stringify(tournamentData), "POST");
			if (!response.ok) {
				alert("Failed to create tournament. Please try again.");
			} else {
				const data = await response.json();
				alert("Tournament created successfully!");

				setTournamentView(contentContainer);
			}
		} catch (error) {
			console.log(error);
			window.location.hash = "login";
		}
	});
}

async function getUserTournament() {
	try {
		const response = await fetchWithToken("/api/game/create-tournament/");
		if (response.ok) {
			return await response.json();
		} else {
			return null;
		}
	} catch (error) {
		console.log("Error fetching tournament:", error);
		return null;
	}
}