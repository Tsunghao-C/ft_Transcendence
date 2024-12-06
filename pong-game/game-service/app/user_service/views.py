from django.shortcuts import render, get_object_or_404
from .models import CustomUser, FriendRequest
from rest_framework import generics

from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth.decorators import login_required
from django.dispatch import receiver
from django.db.models.signals import pre_save
from .forms import UploadAvatarForm
from .serializers import UserSerializer
from .models import CustomUser
import re, os
import uuid

# 2FA
import random
from django.core.cache import cache
from django.core.mail import send_mail

class CreateUserView(generics.CreateAPIView):
	queryset = CustomUser.objects.all()
	serializer_class = UserSerializer
	permission_classes = [AllowAny]

class CurrentUserView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		serializer = UserSerializer(request.user)
		return Response(serializer.data)

class updateUsernameView(APIView):
	permission_classes = [IsAuthenticated]

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
	
	def __updateCounters(self, user, matchOutcome):
		if matchOutcome:
			user.winCount += 1
		else:
			user.lossCount += 1

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
		self.__updateCounters(p1, outcome);
		# inverse outcome for p2
		outcome = 1 - outcome
		p2.mmr = self._get_new_mmr(p2mmr, p1MMR, outcome)
		self.__updateCounters(p2, outcome)
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
	
class sendFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		from_user = request.user
		to_user = get_object_or_404(CustomUser, alias=request.data.get("toAlias"))
		if from_user == to_user:
			return Response({"detail": "you cannot befriend yourself"}, status=400)
		if from_user.is_friend(to_user):
			return Response({"detail": "you are already friends with this user"}, status=400)
		if FriendRequest.objects.filter(from_user=from_user, to_user=to_user).exists():
			return Response({"detail": "Friend request was already sent."}, status=400)
		FriendRequest.objects.create(from_user=from_user, to_user=to_user)
		return Response({"detail": "friend request sent"}, status=200)

class acceptFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		to_user = request.user
		from_user = get_object_or_404(CustomUser, alias=request.data.get("fromAlias"))
		frequest = get_object_or_404(FriendRequest, from_user=from_user, to_user=to_user)
		to_user.friendList.add(from_user)
		from_user.friendList.add(to_user)
		frequest.delete()
		return Response({"detail": "friend request accepted"}, status=200)

class deleteFriendView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		fr_id = request.data.get("fr_id");
		if not fr_id:
			return Response({"detail": "fr_id required"}, status=400)
		fr_user = get_object_or_404(CustomUser, id=fr_id)
		if fr_user not in user.friendList.all():
			return Response({"detail": "this user is not in your friend list"}, status=400)
		user.friendList.remove(fr_user)
		fr_user.friendList.remove(user)
		return Response({"detail": "successfully deleted friend."}, status=200)
	
class rejectFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		to_user = request.user
		from_user = get_object_or_404(CustomUser, alias=request.data.get("fromAlias"))
		frequest = get_object_or_404(FriendRequest, from_user=from_user, to_user=to_user)
		frequest.delete()
		return Response({"detail": "friend request deleted"}, status=200)
	
class blockUserView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		otherUser = get_object_or_404(CustomUser, alias=request.data.get("alias"))
		if user.has_blocked(otherUser):
			return Response({"detail": "this user is already blocked"}, status=400)
		if user == otherUser:
			return Response({"detail": "you cannot block yourself"}, status=400)
		if user.is_friend(otherUser):
			otherUser.friendList.remove(user)
			user.friendList.remove(otherUser)
		user.blockList.add(otherUser)
		return Response({"detail": "user successfully blocked"}, status=200)
	
class unblockUserView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		otherUser = get_object_or_404(CustomUser, alias=request.data.get("alias"))
		if not user.has_blocked(otherUser):
			return Response({"detail": "this user is not blocked"}, status=400)
		if user == otherUser:
			return Response({"detail": "you cannot block yourself"}, status=400)
		user.blockList.remove(otherUser)
		return Response({"detail": "user was successfully unblocked"}, status=200)
	
class getOpenFriendRequestsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		openRequests = FriendRequest.objects.filter(to_user=user.alias)
		if not openRequests.exists():
			return Response({"detail": "No open friend requests."}, status=200)
		friendRequestsData = [
            {
                "from_user": request.from_user.alias,
                "to_user": request.to_user.alias,
                "timestamp": request.timestamp
            }
            for request in openRequests
        ]
		return Response({
			"count": openRequests.count(),
			"requests": friendRequestsData
		}, status=200)

class getSentFriendRequestsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		openRequests = FriendRequest.objects.filter(from_user=user.alias)
		if not openRequests.exists():
			return Response({"detail": "No open friend requests."}, status=200)
		friendRequestsData = [
            {
                "from_user": request.from_user.alias,
                "to_user": request.to_user.alias,
                "timestamp": request.timestamp
            }
            for request in openRequests
        ]
		return Response({
			"count": openRequests.count(),
			"requests": friendRequestsData
		}, status=200)

class changeLanguageView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		currLang = user.language
		newLang = request.data.get("newLang")
		if not newLang or newLang not in ("fr", "en"):
			return Response({"error": "newLang must be supplied as fr or en"}, status=400)
		if newLang == currLang:
			return Response({"error": f"current language is already set to {currLang}"}, status=400)
		user.language = newLang
		user.save()
		return Response({"detail": f"successfully changed language to {newLang}"}, status=200)


class changeAvatarView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		form = UploadAvatarForm(request.POST, request.FILES, instance=user)
		if form.is_valid():
			form.save()
			return Response({"detail": "Avatar uploaded successfully"}, status=200)
		return Response({"errors": form.errors}, status=400)

@receiver(pre_save, sender=CustomUser) # gets called before CustomUser changes are saved
def deleteOldAvatar(sender, instance, **kwargs):
	if not instance.pk:
		return #new user, no old avatar
	try:
		oldAvatar = sender.objects.get(pk=instance.pk).avatar
	except sender.DoesNotExist:
		return # user doesn't exist yet, nothing to delete
	if oldAvatar and oldAvatar != instance.avatar:
		if os.path.isfile(oldAvatar.path) and oldAvatar.name != 'default.jpg':
			os.remove(oldAvatar.path)