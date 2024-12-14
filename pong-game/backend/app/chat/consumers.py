import json
from channels.generic.websocket import AsyncWebsocketConsumer

## Dedicated consumer for WS Health Check
class ChatHealthConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'health_test'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Health check successful'
        }))
        # await self.close()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'health_message',
                'message': 'Channel layer test successful'
            }
        )
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def health_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'group_message',
            'message': event['message']
        }))

# Temparay testing on lobby.html, jsut to check WS is working
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'test'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        await self.send(text_data=json.dumps({
            'type':'connection_established',
            'message':'You are connected now!'
        }))

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        alias = text_data_json.get("alias", "anon") #default to anon
        time = text_data_json.get("time", "unkown time")

        # send message to room group
        await self.channel_layer.group_send(
            self.room_group_name, {
                "type": "chat_message", 
                "message": message,
                "alias": alias,
                "time": time,
            }
        )
        print('Message:', message)

        # self.send(text_data=json.dumps({
        #     'type':'chat',
        #     'message':message
        # }))

    async def chat_message(self, event):
        message = event["message"]
        alias = event["alias"]
        time = event["time"]

        # send message to WebSocket
        await self.send(text_data=json.dumps({
            "message": message,
            "alias": alias,
            "time": time,
        }))