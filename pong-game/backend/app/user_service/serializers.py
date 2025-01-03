import re
from .models import CustomUser
from rest_framework import serializers
from better_profanity import profanity as pf

def nameNotClean(nameToCheck):
	return pf.contains_profanity(nameToCheck)

class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = CustomUser
		fields = [
			"id",
			"username",
			"email",
			"password", 
			"alias", 
			"mmr",
			"is_banned",
			"friendList",
			"blockList",
			"winCount",
			"lossCount",
			"language",
			"avatar",
			]
		extra_kwargs = {
			"password": {"write_only": True}, # we accept the password as an input but we don't return it
			"mmr": {"read_only": True}, # used for matchmaking / leaderboards
			"is_banned": {"read_only": True}, # used later when banning people
			"winCount": {"read_only": True},
			"lossCount": {"read_only": True},
			"blockList": {"read_only": True},
			"friendList": {"read_only": True},
			"language": {"required": False},
			"avatar": {"required": False},
		}

	def validate_password(self, value):
		if len(value) < 12:
			raise serializers.ValidationError({"password": "Too short. This password is less than 12 characters"})
		elif not re.search("[A-Z]", value):
			raise serializers.ValidationError({"password": "password must contain at least one uppercase letter"})
		elif not re.search("[a-z]", value):
			raise serializers.ValidationError({"password": "password must contain at least one lowercase letter"})
		elif not re.search("[0-9]", value):
			raise serializers.ValidationError({"password": "password must contain at least one number"})
		elif not re.search("[!@#$%^&*(),.?\":{}|<>:;\'_+-=~`]", value):
			raise serializers.ValidationError({"password": "password must contain at least one special character"})
		return value

	def validate_username(self, value):
		if nameNotClean(value):
			raise serializers.ValidationError({"username": "this username contains bad language"})
		return value

	def validate_alias(self, value):
		if nameNotClean(value):
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