import threading
import asyncio
import websockets
import json

class GameRoom(threading.Thread):
    def __init__(self, room_id, player_channels):
        self.room_id = room_id
        self.ball = {"x":50, "y":50, "speedX":5, "speedY":5}
        self.player_channels = player_channels
