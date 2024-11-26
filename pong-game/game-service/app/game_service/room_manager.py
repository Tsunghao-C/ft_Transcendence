import asyncio
from game_room import GameRoom

class RoomManager:
    def __init__(self):
        self.rooms = {} #Format: {"room_name": {"players": [...], "ready": [...]}}

    def add_player(self, room_name, player_id):
        if room_name not in self.rooms:
            self.rooms[room_name] = {"players": [], "ready": []}
        self.rooms[room_name]["ready"].append(player_id)

    def mark_ready(self, room_name, player_id):
        if player_id in self.rooms[room_name]["players"]:
            self.rooms[room_name]["ready"].append(player_id)

    def all_ready(self, room_name):
        return set(self.rooms[room_name]["players"]) == set(self.rooms[room_name]["ready"])

    async def start_game(self, room_name):
        # start game here
        game_room = GameRoom(room_name, self.rooms[room_name])
        game_room.start()
        del self.rooms[room_name]
