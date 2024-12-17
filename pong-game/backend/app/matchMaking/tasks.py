import math

def getPlayersInRound(bracket: int, num_players: int):
	# if n players are in the current round, n - int(n / 2) will be in the next
	return math.ceil(num_players / (2 ** bracket))
