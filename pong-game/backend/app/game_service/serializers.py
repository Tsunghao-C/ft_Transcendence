from rest_framework import serializers
from .models import LeaderBoard, MatchResults

class LeaderBoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaderBoard
        fields = '__all__'

class matchResultsSerializer(serializers.ModelSerializer):
    time = serializers.DateTimeField(format="%d-%m-%Y %H:%M:%S")
    
    class Meta:
        model = MatchResults
        fields = '__all__'