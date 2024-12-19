# serializers.py
from rest_framework import serializers
from .models import ChatRoom, Message
from user_service.models import CustomUser

class MessageSerializer(serializers.ModelSerializer):
	sender = serializers.StringRelatedField()
	timestamp = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")

	class Meta:
		model = Message
		fields = ['sender', 'content', 'timestamp', 'is_invite', 'game_room']

class ChatRoomSerializer(serializers.ModelSerializer):
	messages = MessageSerializer(many=True, read_only=True)

	class Meta:
		model = ChatRoom
		fields = ['name', 'messages', 'is_private']
