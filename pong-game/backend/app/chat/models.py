from django.db import models
from user_service.models import CustomUser
from match_making.models import *
from django.db.models.signals import post_migrate
from django.dispatch import receiver

class ChatRoom(models.Model):
	name = models.CharField(max_length=255, unique=True, db_index=True)
	is_private = models.BooleanField(default=False)
	is_tournament = models.BooleanField(default=False)
	tournament_name = models.CharField(max_length=255, default="")
	members = models.ManyToManyField(CustomUser, related_name='chat_rooms')

	@classmethod
	def get_or_create_private_room(cls, user1, user2):
		room_name = f"private_{min(user1.id, user2.id)}_{max(user1.id, user2.id)}"
		room, created = cls.objects.get_or_create(
			name=room_name,
			defaults={
				"is_private": True
			}
		)
		if created:
			room.members.set([user1, user2])
		return room

	@classmethod
	def create_tournament_room(cls, tournament):
		room_name = f"{tournament.id}"
		try:
			room = cls.objects.create(
				name=room_name,
				is_tournament=True,
				tournament_name=tournament.name,
			)
			room.members.add(tournament.tournament_admin)
			return room
		except Exception as e:
			raise ValueError(f"chat room for tournament '{room_name}' already taken")

class Message(models.Model):
	room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
	sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="sent_messages")
	content = models.TextField()
	timestamp = models.DateTimeField(auto_now_add=True)


# @receiver(post_migrate)
# def create_default_chatroom(sender, **kwargs):
# 	ChatRoom.objects.get_or_create(name='general', is_private=False)


# Create your models here.

