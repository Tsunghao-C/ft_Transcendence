from rest_framework import serializers
from .models import LeaderBoard, MatchResults, BracketPlayer, Bracket, Tournament
from user_service.serializers import UserSerializer

class BracketPlayerSerializer(serializers.ModelSerializer):
    alias = serializers.CharField(source="player.alias")
    is_ai = serializers.CharField(source="player.is_ai")

    class Meta:
        model = BracketPlayer
        fields = ["id", "alias", "is_ai", "result"]

class BracketSerializer(serializers.ModelSerializer):
    players = BracketPlayerSerializer(source="bracket_players", many=True)

    class Meta:
        model = Bracket
        fields = ["id", "players"]

class TournamentSerializer(serializers.ModelSerializer):
    brackets = BracketSerializer(many=True)

    class Meta:
        model = Tournament
        fields = ["id", "name", "user", "brackets"]

class LeaderBoardSerializer(serializers.ModelSerializer):
    player = UserSerializer()
    class Meta:
        model = LeaderBoard
        fields = ['rank', 'player']

class matchResultsSerializer(serializers.ModelSerializer):
    time = serializers.DateTimeField(format="%d-%m-%Y %H:%M:%S")
    
    class Meta:
        model = MatchResults
        fields = '__all__'