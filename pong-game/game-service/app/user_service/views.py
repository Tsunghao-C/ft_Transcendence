from django.shortcuts import render
from .models import CustomUser
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

class CreateUserView(generics.CreateAPIView):
	queryset = CustomUser.objects.all()
	serializer_class = UserSerializer
	permission_classes = [AllowAny]

class CurrentUserView(APIView):
	def get(self, request):
		serializer = UserSerializer(request.user)
		return Response(serializer.data)
	
class UpdateMMR(APIView):
	def post(self, request):
		serializer = UserSerializer(request.user)
		userMMR = serializer.data.get("mmr")
		oppMMR = request.data.get("oppMMR")
		# Match outcome, 1 or 0
		S = request.data.get("matchOutcome")

		if oppMMR is None or S is None:
			return Response({"error": "oppMMR and playerWin are required"}, status=400)
		try:
			oppMMR = int(oppMMR)
			S = int(S)
		except ValueError:
			return Response({"error": "Invalid input types"}, status=400)
		# Calculate the 'expected score'
		E = 1 / (1 + 10**((oppMMR - userMMR)/400))
		# Calculate the new mmr
		newMMR = int(userMMR + 30 * (S - E))
		request.user.mmr = newMMR
		request.user.save()
		return Response({"newMMR": newMMR, "message": "MMR updated successfully"})