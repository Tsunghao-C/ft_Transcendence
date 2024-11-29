from .models import CustomUser
from rest_framework import serializers
import profanity_filter import ProfanityFilter

pf = ProfanityFilter(languages=['en','fr'])

def isNameClean(nameToCheck):
	return pf.is_clean(nameToCheck)

class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = CustomUser
		fields = ["id", "username", "email", "password", "alias", "mmr", "is_banned"]
		extra_kwargs = {
			"password": {"write_only": True}, # we accept the password as an input but we don't return it
			"mmr": {"read_only": True}, # used for matchmaking / leaderboards
			"is_banned": {"read_only": True} # used later when banning people
		}

	def validate_username(self, value):
		if not isNameClean(value):
			raise serializers.ValidationError({"username": "this username contains bad language"})
		if CustomUser.objects.filter(username=validated_data["username"]).exists():
				raise serializers.ValidationError({"username": "this username already exists"})
		return value

	def validate_alias(self, value):
		if not isNameClean(value):
			raise serializers.ValidationError({"alias": "this alias contains bad language"})
		return value

	def create(self, validated_data):
		user = CustomUser.objects.create_user(**validated_data)
		return user

	def update(self, instance, validated_data):
		if "username" in validated_data:
			instance.username = validated_data["username"]
		if "alias" in validated_data:
			instance.alias = validated_data["alias"]
		instance.save()
		return instance