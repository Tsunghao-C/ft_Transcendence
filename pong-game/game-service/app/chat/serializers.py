from rest_framework import serializers
from .models import ChatRoom, Message

class ChatRoomSerializer(serializers.ModelSerializer):
	class Meta:
		model = ChatRoom
		fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
	sender = serializers.StringRelatedField()

	class Meta:
		model = Message
		fields = ['id', 'sender', 'content', 'timestamp']
