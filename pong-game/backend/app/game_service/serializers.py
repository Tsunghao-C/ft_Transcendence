from rest_framework import serializers
from .models import LeaderBoard

class LeaderBoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaderBoard
        fields = '__all__'