from rest_framework import serializers
from .models import *

class CreateTournamentSerializer(serializers.Serializer):
	name = serializers.CharField(max_length=100)
	max_players = serializers.IntegerField(min_value=2)
	is_private = serializers.BooleanField()

	def validate_max_players(self, value):
		if value > 20:
			raise serializers.ValidationError("Maximum players cannot exceed 20.")
		return value

	def create(self, validated_data):
		tournament_admin = self.context['request'].user
		return Tournament.objects.create(
			tournament_admin=tournament_admin,
			**validated_data
		)

class TournamentSerializer(serializers.Serializer):
	class Meta:
		model = Tournament
		fields = ["id","tournament_admin","name","is_active","is_finished","max_players","num_curr_players","num_brackets"] 