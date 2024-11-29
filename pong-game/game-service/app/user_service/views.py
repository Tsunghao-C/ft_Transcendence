from django.shortcuts import render, get_object_or_404
from .models import CustomUser
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import  User

# 2FA
import random
from django.core.cache import cache
from django.core.mail import send_mail

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
		p1.mmr = self._get_new_mmr(p1MMR, p2mmr, outcome)
		# inverse outcome for p2
		outcome = 1 - outcome
		p2.mmr = self._get_new_mmr(p2mmr, p1MMR, outcome)
		p1.save()
		p2.save()
		return Response({"message": f"Player 1 new mmr: {p1.mmr}\nPlayer 2 new mmr: {p2.mmr}"})

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

class updateDetailsView(APIView):
	def post(self, request):
		newUsername = request.data.get("newUsername")
		newAlias = request.data.get("newAlias")
		if newAlias:
			request.user.alias = newAlias
		if newUsername:
			request.user.username = newUsername
		request.user.save()
		return Response({"message": f"Player {id} has had their details updated"})
			
class Generate2FAView(APIView):
	authentication_classes = []  # Pas d'authentification nécessaire
	permission_classes = [AllowAny]  # Tout le monde peut accéder à cette vue

	def post(self, request):
		username = request.data.get("username")
		password = request.data.get("password")

		user = authenticate(username=username, password=password)
		if user:
			# Générer un code OTP aléatoire
			otp_code = random.randint(100000, 999999)
			print("**********************************")
			print("user.id is : " + str(user.id))
			print("otp_code is : " + str(otp_code))
			print("**********************************")
			# Stocker le code dans un cache ou une base de données temporaire (lié à l'utilisateur)
			cache.set(f"otp_{user.id}", otp_code, timeout=300)  # Expire en 5 minutes

			message = f"Hello {user.username},\n\nYour verification code is : {otp_code}\nThis code is valid for 5 minutes."
			# Envoyer le code OTP (par email ou SMS)
			send_mail(
				"Your 2FA verification code",
				message,
				"no-reply@example.com",
				[user.email],
				fail_silently=False,
			)
			return Response({"detail": "2FA code has been sent"}, status=status.HTTP_200_OK)
		return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# Check and validate/refuse the 2FA code entered by user
class Validate2FAView(APIView):

	authentication_classes = []  # Pas d'authentification nécessaire
	permission_classes = [AllowAny]  # Tout le monde peut accéder à cette vue

	def post(self, request):
		user_id = request.data.get("user_id")
		otp_code = request.data.get("otp_code")

		# Récupérer le code OTP stocké
		stored_otp = cache.get(f"otp_{user_id}")

		print("stored_otp is : " + str(stored_otp) + " and otp_code is : " + str(otp_code))

		if stored_otp and str(stored_otp) == str(otp_code):
			# Code valide, générer les tokens JWT
			user = CustomUser.objects.get(id=user_id)
			refresh = RefreshToken.for_user(user)
			return Response({
				"refresh": str(refresh),
				"access": str(refresh.access_token),
			}, status=status.HTTP_200_OK)
		return Response({"detail": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)