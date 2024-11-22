from django.shortcuts import render, get_object_or_404
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

# I'll need to add in some sort of match authentication later
class UpdateMMR(APIView):
	def _get_new_mmr(self, userMMR: int, oppMMR: int, matchOutcome: int):
		# Calculate the 'expected score'
		E = 1 / (1 + 10**((oppMMR - userMMR)/400))
		return int(userMMR + 30 * (matchOutcome - E))

	def post(self, request):
		p1ID = request.data.get("p1ID")
		p2ID = request.data.get("p2ID")
		p1 = get_object_or_404(CustomUser, id=p1ID)
		p2 = get_object_or_404(CustomUser, id=p2ID)
		p1MMR = p1.mmr
		p2mmr = p2.mmr
		# Match outcome, 1 or 0 based on p1
		outcome = request.data.get("matchOutcome")
		if outcome not in [1, 0]:
			return Response({"error": "Invalid match input"}, status=400)
		p1.mmr = self._get_new_mmr(self, p1MMR, p2mmr, outcome)
		# inverse outcome or p2
		outcome = 1 - outcome
		p2.mmr = self._get_new_mmr(self, p2mmr, p1MMR, outcome)
		p1.save()
		p2.save()

class BanPlayer(APIView):
	def post(self, request):
		if not request.user.is_superuser:
			return Response({"error":"Only super users can ban players"}, status=400)
		id = request.data.get("playerId")
		if id is None:
			return Response({"error": "playerId is required"}, status=400)
		try:
			id = int(id)
		except ValueError:
			return Response({"error": "Invalid input type"}, status=400)
		user = get_object_or_404(CustomUser, id=id)
		if user.is_banned:
			return Response({"error": "this user is already banned"}, status=400)
		user.is_banned = True
		user.save()
		return Response({"message": f"Player {id} has been banned"})

class UnbanPlayer(APIView):
	def post(self, request):
		if not request.user.is_superuser:
			return Response({"error":"Only super users can unban players"}, status=400)
		id = request.data.get("playerId")
		if id is None:
			return Response({"error": "playerId is required"}, status=400)
		try:
			id = int(id)
		except ValueError:
			return Response({"error": "Invalid input type"}, status=400)
		user = get_object_or_404(CustomUser, id=id)
		if not user.is_banned:
			return Response({"error": "this user is not banned"}, status=400)
		user.is_banned = False
		user.save()
		return Response({"message": f"Player {id} has been unbanned"})

