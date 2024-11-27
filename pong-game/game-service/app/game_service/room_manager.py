import asyncio
from game_room import GameRoom

class RoomManager:
    def __init__(self): self.rooms = {} #Format: {"room_name": {"players": [...], "ready": [...]}}


    def mark_ready(self, room_name, player_id):
        if player_id in self.rooms[room_name]["players"]:
            self.rooms[room_name]["ready"].append(player_id)

    def all_ready(self, room_name):
        return set(self.rooms[room_name]["players"]) == set(self.rooms[room_name]["ready"])

    async def start_game(self, room_name):
        player_channels = self.rooms[room_name]["players"]
        game_room = GameRoom(room_name, player_channels)
        game_room.start()
        #print and log here
        del self.rooms[room_name]
