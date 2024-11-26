from gameroom import GameRoom

import threading
import asyncio
import websockets
import json

class LobbyRoom():
    def __init__(self):
        self.players = {}

class Player():
    def __init__(self, socket, id):
        self.socket = socket
        self.id = id

class MasterController():
    def __init__(self):
        self.gameRooms = {}
        self.players = {}
        self.lobbies = {}

    def create_game_room(self, uid, player1_socket, player2_socket):
        game_room = GameRoom(uid, player1_socket, player2_socket)
        self.gameRooms[game_room.id]
        return game_room
