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
from django.contrib.auth.decorators import login_required
from .forms import AvatarUploadForm
import re

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
	
class updateUsernameView(APIView):
	def post(self, request):
		user = request.user
		serializer = UserSerializer(instance=user, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=201)
		return Response(serializer.errors, status=400)

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
		user = get_object_or_404(CustomUser, id=id)
		if not user.is_banned:
			return Response({"error": "this user is not banned"}, status=400)
		user.is_banned = False
		user.save()
		return Response({"message": f"Player {id} has been unbanned"})

def sendOTP(email:str, username:str, userID, cacheName:str):
	otp_code = random.randint(100000, 999999)
	cache.set(cacheName, {
			'otp': otp_code,
			'email': email
		},
		timeout=300
	)
	message = f"Hello {username},\n\nYour verification code is : {otp_code}\nThis code is valid for 5 minutes."
	send_mail(
		"Your 2FA verification code",
		message,
		"no-reply@example.com",
		[email],
		fail_silently=False,
	)
	# /!\ delete the below later
	print("**********************************")
	print("user.id is : " + str(userID))
	print("otp_code is : " + str(otp_code))
	print("**********************************")

def isOtpValid(userID, enteredOTP, cacheName):
	cachedData = cache.get(cacheName)
	if not cachedData:
		return False
	storedOtp = cachedData.get("otp")
	print("stored Otp is : " + str(storedOtp))
	if storedOtp and str(storedOtp) == str(enteredOTP):
		return True
	return False

class Generate2FAView(APIView):
	authentication_classes = []  # No auth necessary
	permission_classes = [AllowAny]  # Anyone can access this view
	def post(self, request):
		username = request.data.get("username")
		password = request.data.get("password")
		user = authenticate(username=username, password=password)
		if user:
			# /!\ delete this print when in produtction
			# print("The 2FA code is : " + )
			sendOTP(user.email, user.username, user.id, f"otp_{user.id}")
			return Response({"detail": "A 2FA code has been sent", "user_id": str(user.id)}, status=status.HTTP_200_OK)
		return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# Check and validate/refuse the 2FA code entered by user
class Validate2FAView(APIView):
	authentication_classes = []  # No auth necessary
	permission_classes = [AllowAny]  # Anyone can access this view
	def post(self, request):
		userId = request.data.get("user_id")
		otpCode = request.data.get("otpCode")
		print("userId is : " + str(userId))
		print("otp is : " + str(otpCode))
		if isOtpValid(userId, otpCode, f"otp_{userId}"):
			# Code is valid > generate JWT
			refresh = RefreshToken.for_user(request.user)
			return Response({
				"refresh": str(refresh),
				"access": str(refresh.access_token),
				"detail": "2FA code validated",
			}, status=status.HTTP_200_OK)
		return Response({"detail": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

class changeEmailView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		newEmail = request.data.get("new_email")
		if not newEmail or not re.match(r"[^@]+@[^@]+\.[^@]+", newEmail):
			return Response({"error": "invalid email format"}, status=400)
		if CustomUser.objects.filter(email=newEmail).exists():
			return Response({"error": "email is already in use"}, status=400)
		sendOTP(newEmail, user.username, user.id, f"email_change_{user.id}")
		return Response({"detail": "otp code sent"}, status=200)

	def put(self, request):
		user = request.user
		otpCode = request.data.get('otp')
		cacheName = f"email_change_{user.id}"
		if isOtpValid(user.id, otpCode, cacheName):
			cachedData = cache.get(cacheName)
			user.email = cachedData.get("email")
			user.save()
			cache.delete(cacheName)
			return Response({"detail": "email change success"}, status=200)
		return Response({"error": "invalid or expired otp"}, status=400)

@login_required
def upload_avatar(request):
	user = request.user
	if request.method == "POST":
		form = AvatarUploadForm(request.POST, request.FILES, instance=user)
		if form.is_valid():
			form.save()
			return redirect('profile')
	else:
		form = AvatarUploadForm(instance=user)
	return render(request, 'upload_avatar.html', {'form': form, 'user': user})