import threading
import asyncio
import websockets
import json

class GameRoom(threading.Thread):
    def __init__(self, room_id, player1_socket, player2_socket):
        self.room_id = room_id
        self.ball = {"x":50, "y":50, "speedX":5, "speedY":5}
        self.players = {}
        self.player1_socket = player1_socket
        self.player2_socket = player2_socket
