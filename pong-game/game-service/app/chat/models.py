from django.db import models
from user_service.models import CustomUser
from django.db.models.signals import post_migrate
from django.dispatch import receiver

class ChatRoom(models.Model):
	name = models.CharField(max_length=255, unique=True)
	is_private = models.BooleanField(default=False)
	members = models.ManyToManyField(CustomUser, related_name='chat_rooms')

class Message(models.Model):
	room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
	sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="sent_messages")
	content = models.TextField()
	timestamp = models.DateTimeField(auto_now_add=True)


@receiver(post_migrate)
def create_default_chatroom(sender, **kwargs):
	ChatRoom.objects.get_or_create(name='general', is_private=False)


# Create your models here.
