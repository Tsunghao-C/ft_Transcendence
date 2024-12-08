import json
# from channels.generic.websocket import WebsocketConsumer
# from asgiref.sync import async_to_sync

# import json

from channels.generic.websocket import AsyncWebsocketConsumer

# You need to run this when using dev server: docker run --rm -p 6379:6379 redis:7 
# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
#         self.room_group_name = f"chat_{self.room_name}"

#         # joon room group
#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()
#         await self.send(text_data=json.dumps({
#             'type':'connection_established',
#             'message':'You are connected now!'
#         }))

#     async def disconnect(self, close_code):
#         # leave room group
#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

#     # receive message from WebSocket
#     async def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         message = text_data_json["message"]
#         alias = text_data_json.get("alias", "anon") #default to anon
#         time = text_data_json.get("time", "unkown time")

#         # send message to room group
#         await self.channel_layer.group_send(
#             self.room_group_name, {
#                 "type": "chat.message", 
#                 "message": message,
#                 "alias": alias,
#                 "time": time,
#             }
#         )

#     # receive message from room group
#     async def chat_message(self, event):
#         message = event["message"]
#         alias = event["alias"]
#         time = event["time"]

#         # send message to WebSocket
#         await self.send(text_data=json.dumps({
#             "message": message,
#             "alias": alias,
#             "time": time,
#         }))

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