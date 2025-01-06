import { fetchWithToken } from "./fetch_request.js";
import { setLocalLobby } from "./game_local.js";
import { setIsTournament } from "./game_utils.js";
import { hideClass, hideElem, showElem } from "./utils.js";
import { TournamentPlayers, goBackButtonEventListener } from "./game_utils.js";
import { setSoloLobby } from "./game_solo.js";
import { translations as trsl } from "./language_pack.js";
import { state } from "./app.js";

export async function setTournamentView(contentContainer) {
	setIsTournament(true);
	contentContainer.innerHTML = `
	<div class="tournament-view" id="tournament-view">
		<div id="tournament-status"></div>
		<div id="match-container"></div>
	</div>
	`;
	const tournamentStatusContainer = document.getElementById("tournament-status");
	const userTournament = await getUserTournament();
	if (userTournament) {
		displayTournament(userTournament, tournamentStatusContainer);
	} else {
		setTournamentViewForm(contentContainer);
	}
}

function displayTournament(tournament, container) {
	if (!container) return;
	container.innerHTML = `
		<h3>${trsl[state.language].tournament} ${tournament.name} </h3>
		<hr>
		<div id="brackets-container"></div>
		<button id="next-match-btn">${trsl[state.language].startNextGame}</button>
		<button id="create-tournament-btn">${trsl[state.language].createNewTournament}</button>
		<div id="match-container"></div>
	`;

	const createTournamentButton = document.getElementById("create-tournament-btn");
	createTournamentButton.addEventListener("click", () => {
		const innerContent = document.getElementById("innerContent");
		setTournamentViewForm(innerContent);
	});
	const nextMatchButton = document.getElementById("next-match-btn");
	nextMatchButton.addEventListener("click", async () => {
		await showNextMatch(tournament.id);
	});

	const bracketsContainer = document.getElementById("brackets-container");
	const numOfBrackets = tournament.brackets.length; // for debugging 7 < odd | delete once fixed
	console.log("num of brackets is : ", numOfBrackets); // for debugging 7 < odd | delete once fixed
	tournament.brackets.forEach((bracket, index) => {
		console.log("index is : ", index); // for debugging 7 < odd | delete once fixed
		const n = bracket.players.length;
		const bracketDiv = document.createElement("div");
		bracketDiv.classList.add("bracket");
		const matchupHtml = getMatchupsHtml(bracket, index);
		let roundTitle = `Round ${index + 1}`;
		if (n % 2 != 0 && index == 0) {
			roundTitle = trsl[state.language].playOff;
		}
		bracketDiv.innerHTML = `
			<h4>${roundTitle}</h4>
			<ul>
				${matchupHtml}
			</ul>
			<hr>
		`;
		bracketsContainer.appendChild(bracketDiv);
	});
}

function isPowerOf2(n) {
	return Number.isInteger(n) &&(n > 0) && (n & (n - 1)) === 0;
}

function getPlayoffHtml(bracket) {
	const n = bracket.players.length;
	const players = bracket.players;

	let numOfQualified = 0;
	while(!isPowerOf2(numOfQualified + ((n - numOfQualified)/2))) {
		numOfQualified++;
	}
	let qualified = `${trsl[state.language].qualified}: `;
	let i = 0;
	while (i < numOfQualified) {
		if (i > 0) {
			qualified += ', ';
		}
		qualified += `${players[i].alias}`;
		i++;
	}
	let html = `<p class="qualified">${qualified}</p>`;
	while (i < n - 1) {
		html += `
			<li class="matchup">
				<span class="left-player">
					<span style="color: ${
						players[i].result === "win" ? "green" : players[i].result === "lose" ? "red" : "gray"
					};">
						${
							players[i].result === "win"
							? "[W]"
							: players[i].result === "lose"
							? "[L]"
							: ""
						}
					</span>
					${players[i].is_ai === "human" ? "" : "[CPU]"} ${players[i].alias}
				</span>
				<span class="vs">| vs |</span>
				<span class="right-player">
					${players[i + 1].alias} ${players[i + 1].is_ai === "human" ? "" : "[CPU]"}
					<span style="color: ${
						players[i + 1].result === "win" ? "green" : players[i + 1].result === "lose" ? "red" : "gray"
					};">
						${
							players[i + 1].result === "win"
							? ` [${trsl[state.language].w}]`
							: players[i + 1].result === "lose"
							? ` [${trsl[state.language].l}]`
							: ""
						}
					</span>
				</span>
			</li>
		`;
		i++;
		i++;
	}

	return html;
}

function getLeftPlayerHtml(player) {
	const html = `
		<li class="matchup">
			<span class="left-player">
				<span style="color: ${
					player.result === "win" ? "green" : player.result === "lose" ? "red" : "gray"
				};">
					${
					player.result === "win"
						? `[${trsl[state.language].w}] `
						: player.result === "lose"
						? `[${trsl[state.language].l}] `
						: ""
					}
				</span>
				${player.is_ai === "human" ? "" : "[CPU]"} ${player.alias}
			</span>
	`;
	return html;
}

function getRightPlayerHtml(player) {
	const html = `
		<span class="vs">| vs |</span>
		<span class="right-player">
			${player.alias} ${player.is_ai === "human" ? "" : "[CPU]"}
			<span style="color: ${
				player.result === "win" ? "green" : player.result === "lose" ? "red" : "gray"
			};">
				${
				player.result === "win"
					? ` [${trsl[state.language].w}]`
					: player.result === "lose"
					? ` [${trsl[state.language].l}]`
					: ""
				}
			</span>
		</span>
	</li>
	`;
	return html;
}

function getMatchupsHtml(bracket, index) {
	let html = "";
	const n = bracket.players.length;
	console.log("number of player is : ", n);

	// /!\ debug print, delete when pushing
	// bracket.players.forEach((player, i) => {
	// 	console.log("player " + i + " is : ", player);
	// })

	// ODD < 7
	if (n % 2 != 0 && index == 0) {
		return getPlayoffHtml(bracket);
	}

	// EVEN
	bracket.players.forEach((player, i) => {
		if (i % 2 == 0) {
			html += getLeftPlayerHtml(player);
		} else {
			html += getRightPlayerHtml(player);
		}
	})
	return html;
}

function setTournamentViewForm(contentContainer) {
	contentContainer.innerHTML = `
	<div class="tournament-view" id="tournament-creation">
		<form id="tournament-form">
			<div>
				<input type="text" id="tournament-name" name="tournamentName" placeholder="${trsl[state.language].tournamentInput}" required />
			</div>
			<hr>
			<div id="players-container">
				<div class="player-entry">
					<input type="text" placeholder="${trsl[state.language].enterPlayer} 1" name="player1" required />
					<select name="type1">
						<option value="human">${trsl[state.language].human}</option>
						<option value="easy">${trsl[state.language].tournamentEasy}</option>
						<option value="medium">${trsl[state.language].tournamentMedium}</option>
						<option value="hard">${trsl[state.language].tournamentHard}</option>
					</select>
				</div>
				<div class="player-entry">
					<input type="text" placeholder="${trsl[state.language].enterPlayer} 2" name="player2" required />
					<select name="type2">
						<option value="human">${trsl[state.language].human}</option>
						<option value="easy">${trsl[state.language].tournamentEasy}</option>
						<option value="medium">${trsl[state.language].tournamentMedium}</option>
						<option value="hard">${trsl[state.language].tournamentHard}</option>
					</select>
				</div>
			</div>
			<button type="button" id="add-player">${trsl[state.language].addPlayer}</button>
			<button type="submit">${trsl[state.language].createTournament}</button>
		</form>
		<div id="tournament-result"></div>
	</div>`;
	setupTournamentForm(contentContainer);
}

export async function submitMatchResult(user1Id, user2Id, winner) {
	const matchContainer = document.getElementById("match-container");
	matchContainer.innerHTML = `<p>${trsl[state.language].submittingResult}</p>`;

	try {
		const response = await fetchWithToken(
			`/api/game/update-match-result/`,
			JSON.stringify({ user1_id: user1Id, user2_id: user2Id, winner: winner }),
			"POST"
		);

		if (!response.ok) {
			alert(`${trsl[state.language].TournamentSubmissionFailed}`);
			matchContainer.innerHTML = `<p>${trsl[state.language].TournamentSubmissionFailed}</p>`;
		}

		const tournament = await getUserTournament();
		if (tournament) {
			displayTournament(tournament, document.getElementById("tournament-status"));
		}
	} catch (error) {
		console.log(error);
		window.location.hash = "login";
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
	matchContainer.innerHTML = `<p>${trsl[state.language].loadingNextMatch}</p>`;

	try {
		const response = await fetchWithToken(`/api/game/next-game/`);
		if (!response.ok) {
			console.log(response);
			alert(`${trsl[state.language].internalError}`);
			return;
		}

		const data = await response.json();
		console.log(data);
		if (data.next_game.next_match) {
			const { player1, player2 } = data.next_game.next_match;
			if (player1.is_ai !== "human" && player2.is_ai != "human") {
				const winner = simulateMatch(player1.is_ai, player2.is_ai);
				submitMatchResult(player1.id, player2.id, winner);
				alert(`${trsl[state.language].aiGameResolved}`);
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
				hideElem("brackets-container");
				hideElem("next-match-btn");
				hideElem("create-tournament-btn");
				if (player1.is_ai === "human" && player2.is_ai === "human") {
					setLocalLobby(matchContainer, true);
				} else {
					let difficulty;
					if (player1.is_ai === "human") {
						difficulty = player2.is_ai;
					} else {
						difficulty = player1.is_ai;
					}
					setSoloLobby(matchContainer, difficulty, true);
				}
			}
		} else if (data.next_game.message) {
			matchContainer.innerHTML = `<p>${trsl[state.language].tournamentIsOver} ${data.next_game.message}</p>`;
		}
	} catch (error) {
		window.location.hash = "login";
	}
}

function setupTournamentForm(contentContainer) {
	const maxPlayers = 16;
	const playersContainer = document.getElementById("players-container");
	const addPlayerButton = document.getElementById("add-player");

	let playerCount = 2;

	addPlayerButton.addEventListener("click", () => {
		if (playerCount >= maxPlayers) {
			alert(`${trsl[state.language].maxPlayer}`);
			return;
		}

		playerCount++;
		const playerEntry = document.createElement("div");
		playerEntry.classList.add("player-entry");
		playerEntry.innerHTML = `
			<input type="text" placeholder="${trsl[state.language].enterPlayer} ${playerCount} ${trsl[state.language].alias}" name="player${playerCount}" required />
			<select id="added-player" name="type${playerCount}">
				<option value="human">${trsl[state.language].human}</option>
				<option value="easy">${trsl[state.language].tournamentEasy}</option>
				<option value="medium">${trsl[state.language].tournamentMedium}</option>
				<option value="hard">${trsl[state.language].tournamentHard}</option>
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
		const aliasesSet = new Set();
		let hasError = false;

		for (let i = 1; i <= playerCount; i++) {
			const alias = formData.get(`player${i}`).trim();
			const is_ai = formData.get(`type${i}`);

			if (!/^[a-zA-Z0-9]+$/.test(alias)) {
				alert(`${alias} ${trsl[state.language].tournamentAlphanum}`);
				hasError = true;
				break;
			}

			if (aliasesSet.has(alias)) {
				alert(`${alias} ${trsl[language].tournamentDuplicates}`);
				hasError = true;
				break;
			}

			aliasesSet.add(alias);
			players.push({ alias, is_ai });
		}

		if (hasError) {
			return ;
		}

		const tournamentData = {
			name: formData.get("tournamentName").trim(),
			players,
		};

		try {
			const response = await fetchWithToken("/api/game/create-tournament/", JSON.stringify(tournamentData), "POST");
			if (!response.ok) {
				alert(`${alias} ${trsl[language].tournamentCreationFailed}`);
			} else {
				const data = await response.json();
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
		window.location.hash = "login";
	}
}
