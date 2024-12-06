import json
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from django.test import TestCase
from backend.routing import websocket_urlpatterns  # Import your WebSocket URL routes
from .consumers import GameConsumer  # Import your consumer

class GameConsumerTest(TestCase):
    async def test_connection(self):
        # Create a communicator with the consumer
        communicator = WebsocketCommunicator(URLRouter(websocket_urlpatterns), "/ws/game/test_room/")
        connected, _ = await communicator.connect()
        
        # Assert the connection was successful
        self.assertTrue(connected)
        
        # Check the initial connection message
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'notice')
        self.assertEqual(response['message'], 'Connection established')
        
        await communicator.disconnect()

    async def test_create_private_match(self):
        communicator = WebsocketCommunicator(URLRouter(websocket_urlpatterns), "/ws/game/test_room/")
        await communicator.connect()
        
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'notice')
        self.assertEqual(response['message'], 'Connection established')
        
        # Send create private match request
        await communicator.send_json_to({
            "action": "create_private_match",
            "id": "player1"
        })
        
        # Check the response
        response = await communicator.receive_json_from()
        print(json.dumps(response, indent=4))
        self.assertEqual(response['type'], 'room_creation')
        self.assertIn('room_name', response)
        
        await communicator.disconnect()

    async def test_join_private_match(self):
        # First, create a room
        creator_communicator = WebsocketCommunicator(URLRouter(websocket_urlpatterns), "/ws/game/test_room/")
        await creator_communicator.connect()
        response = await creator_communicator.receive_json_from()
        self.assertEqual(response['type'], 'notice')
        self.assertEqual(response['message'], 'Connection established')
        
        await creator_communicator.send_json_to({
            "action": "create_private_match",
            "id": "player1"
        })
        room_response = await creator_communicator.receive_json_from()
        room_name = room_response['room_name']
        
        # Now try to join the room
        joiner_communicator = WebsocketCommunicator(URLRouter(websocket_urlpatterns), "/ws/game/test_room/")
        await joiner_communicator.connect()
        
        response = await joiner_communicator.receive_json_from()
        self.assertEqual(response['type'], 'notice')
        self.assertEqual(response['message'], 'Connection established')
    
        await joiner_communicator.send_json_to({
            "action": "join_private_match",
            "room_name": room_name,
            "id": "player2"
        })
        
        join_response = await joiner_communicator.receive_json_from()
        print(json.dumps(join_response, indent=4))
        self.assertEqual(join_response['type'], 'notice')
        self.assertEqual(join_response['message'], f'Joined lobby {room_name}')
        
        await creator_communicator.disconnect()
        await joiner_communicator.disconnect()

    async def test_ready_up(self):
        # Create a room and have two players join
        creator_communicator = WebsocketCommunicator(URLRouter(websocket_urlpatterns), "/ws/game/test_room/")
        await creator_communicator.connect()
        
        creation_response = await creator_communicator.receive_json_from()
        self.assertEqual(creation_response['type'], 'notice')
        self.assertEqual(creation_response['message'], 'Connection established')
        print(json.dumps(creation_response, indent=4))
        await creator_communicator.send_json_to({
            "action": "create_private_match",
            "id": "player1"
        })
        room_response = await creator_communicator.receive_json_from()

        print(json.dumps(room_response, indent=4))
        room_name = room_response['room_name']
        
        joiner_communicator = WebsocketCommunicator(URLRouter(websocket_urlpatterns), "/ws/game/test_room/")
        await joiner_communicator.connect()
        
        await joiner_communicator.send_json_to({
            "action": "join_private_match",
            "room_name": room_name,
            "id": "player2"
        })
        await joiner_communicator.receive_json_from()
        
        # Ready up both players
        await creator_communicator.send_json_to({
            "action": "ready_up",
            "room_name": room_name,
            "player_id": "player1"
        })
        
        response = await creator_communicator.receive_json_from()
        self.assertEqual(response['type'], 'notice')
        self.assertEqual(response['message'], 'Player has readied up')

        await joiner_communicator.send_json_to({
            "action": "ready_up",
            "room_name": room_name,
            "player_id": "player2"
        })
        response = await creator_communicator.receive_json_from()
        self.assertEqual(response['type'], 'notice')
        self.assertEqual(response['message'], 'Player has readied up')
        # Check for game start notice
        start_response = await creator_communicator.receive_json_from()
        self.assertEqual(start_response['type'], 'notice')
        self.assertEqual(start_response['message'], 'Game is starting')
        
        await creator_communicator.disconnect()
        await joiner_communicator.disconnect()

    # Add more test methods to cover edge cases like:
    # - Trying to join a full room
    # - Trying to create a room with an existing player
    # - Testing error handling
