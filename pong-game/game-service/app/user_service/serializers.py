from .models import CustomUser
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = CustomUser
		fields = ["id", "username", "email", "password", "alias", "mmr"]
		extra_kwargs = {
			"password": {"write_only": True}, # we accept the password as an input but we don't return it
			"mmr": {"read_only": True}, # used for matchmaking / leaderboards
		}

	def create(self, validated_data):
		user = CustomUser.objects.create_user(**validated_data)
		return user