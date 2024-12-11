from rest_framework import serializers
from .models import LeaderBoard, MatchResults
from user_service.serializers import UserSerializer

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