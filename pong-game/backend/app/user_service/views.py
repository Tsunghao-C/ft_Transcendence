from django.shortcuts import render, get_object_or_404
from .models import CustomUser, FriendRequest, OnlineUserActivity
from rest_framework import generics

from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, logout
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth.decorators import login_required
from django.dispatch import receiver
from django.db.models.signals import pre_save
from .forms import UploadAvatarForm
from .serializers import UserSerializer, nameNotClean
from .models import CustomUser, OnlineUserActivity
import re, os
import uuid
from game_service.views import recordMatch
from game_service.models import LeaderBoard, MatchResults
import re

# 2FA
# import random
import secrets
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from .models import TemporaryOTP

class CreateUserView(generics.CreateAPIView):
	queryset = CustomUser.objects.all()
	serializer_class = UserSerializer
	permission_classes = [AllowAny]

class CurrentUserView(APIView):
	permission_classes = [IsAuthenticated]
	def get(self, request):
		serializer = UserSerializer(request.user)
		if request.user.is_banned:
			logout(request)
			return Response({"detail": "You have been banned"}, status=403)
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

class BanPlayer(APIView):
	def post(self, request):
		if not request.user.is_admin:
			return Response({"error":"Only admins can ban players"}, status=400)
		id = request.data.get("id")
		user = get_object_or_404(CustomUser, id=id)
		if user.is_banned:
			return Response({"error": "this user is already banned"}, status=400)
		if user.is_admin:
			return Response({"error": "you cannot ban an admin"}, status=400)
		user.is_banned = True
		user.save()
		return Response({"message": f"Player {id} has been banned"})

class UnbanPlayer(APIView):
	def post(self, request):
		if not request.user.is_admin:
			return Response({"error":"Only admins can unban players"}, status=400)
		id = request.data.get("id")
		user = get_object_or_404(CustomUser, id=id)
		if not user.is_banned:
			return Response({"error": "this user is not banned"}, status=400)
		user.is_banned = False
		user.save()
		return Response({"message": f"Player {id} has been unbanned"})

####################### Validate 2FA #######################

def generate_otp(user):
	# otp = random.randint(100000, 999999)
	otp = secrets.randbelow(900000) + 100000
	# Delete previous otps
	TemporaryOTP.objects.filter(user_id=user.id).delete()
	# Create a new OTP
	TemporaryOTP.objects.create(
		user_id=user.id,
		otp=otp,
		expires_at=timezone.now() + timedelta(minutes=5)
	)
	return otp

def sendOTP(email:str, username:str, userID, cacheName:str, user):
	otp_code = generate_otp(user)
	message = f"Hello {username},\n\nYour verification code is : {otp_code}\nThis code is valid for 5 minutes."
	send_mail(
		"Your 2FA verification code",
		message,
		"no-reply@example.com",
		[email],
		fail_silently=False,
	)
	print(f"sent otp to {email}")
	# print("**********************************")
	# print("user.id is : " + str(user.id))
	# print("otp_code is : " + str(otp_code))
	# print("**********************************")

class Generate2FAView(APIView):
	permission_classes = [AllowAny]  # Anyone can access this view
	def post(self, request):
		username = request.data.get("username")
		password = request.data.get("password")
		user = authenticate(username=username, password=password)
		if user and user.is_banned:
			return Response({"detail": "you are banned"}, status=403)
		elif user:
			sendOTP(user.email, user.username, user.id, f"otp_{user.id}", user)
			return Response({"detail": "A 2FA code has been sent", "user_id": str(user.id)}, status=status.HTTP_200_OK)
		return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

####################### Generate 2FA #######################

def validate_otp(user_id, entered_otp):
	try:
		otp_record = TemporaryOTP.objects.get(
			user_id=user_id, 
			otp=entered_otp, 
			expires_at__gt=timezone.now()
		)
		otp_record.delete()
		return True
	except TemporaryOTP.DoesNotExist:
		return False

class Validate2FAView(APIView):
	permission_classes = [AllowAny]  # Anyone can access this view
	def post(self, request):
		userId = request.data.get("user_id")
		otpCode = request.data.get("otpCode")
		print("userId is : " + str(userId))
		print("otp is : " + str(otpCode))
		if not userId or not otpCode:
			return Response({"detail": "User ID and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)
		if validate_otp(userId, otpCode):
			try:
				user = CustomUser.objects.get(id=userId)
			except CustomUser.DoesNotExist:
				return Response({"detail": "User does not exist."}, status=status.HTTP_404_NOT_FOUND)
			refresh = RefreshToken.for_user(user)
			return Response({
				"refresh": str(refresh),
				"access": str(refresh.access_token),
				"detail": "2FA code validated",
			}, status=status.HTTP_200_OK)
		return Response({"detail": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

####################### Rest #######################

class changeEmailView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		newEmail = request.data.get("new_email")
		if not newEmail or not re.match(r"[^@]+@[^@]+\.[^@]+", newEmail):
			return Response({"error": "invalid email format"}, status=400)
		if CustomUser.objects.filter(email=newEmail).exists():
			return Response({"error": "email is already in use"}, status=400)
		user.email = newEmail
		user.save()
		return Response({"detail": "email change success"}, status=200)

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

class changeAliasView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		newAlias = request.data.get("alias")
		if nameNotClean(newAlias):
			return Response({"error": "this alias contains bad language"}, status=400)
		if CustomUser.objects.filter(alias=newAlias).exists():
			return Response({"error": "alias is already in use"}, status=400)
		user.alias = newAlias
		user.save()
		return Response({"detail": "alias successfully changed"}, status=200)

class changePasswordView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		old_password = request.data.get('old_password')
		new_password = request.data.get('new_password')

		if not user.check_password(old_password):
			return Response({'error': 'Incorrect old password'}, status=400)

		user.set_password(new_password)
		user.save()

		return Response({'detail': 'Password changed successfully'})

class sendFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		from_user = request.user
		to_user = get_object_or_404(CustomUser, alias=request.data.get("toAlias"))
		if to_user.is_admin:
			return Response({"detail": "user not found"}, status=400)
		if from_user == to_user:
			return Response({"detail": "you cannot befriend yourself"}, status=400)
		if from_user.is_friend(to_user):
			return Response({"detail": "you are already friends with this user"}, status=400)
		if from_user.has_blocked(to_user):
			return Response({"detail": "you are blocking this user"}, status=400)
		if to_user.has_blocked(from_user):
			return Response({"detail": "this user is blocking you"}, status=400)
		if FriendRequest.objects.filter(from_user=from_user, to_user=to_user).exists():
			return Response({"detail": "Friend request was already sent."}, status=400)
		pendingRequest = FriendRequest.objects.filter(from_user=to_user, to_user=from_user).first()
		if pendingRequest:
			to_user.friendList.add(from_user)
			from_user.friendList.add(to_user)
			pendingRequest.delete()
			return Response({"detail": "friend request accepted"}, status=200)
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

	def delete(self, request):
		user = request.user
		fr_user = get_object_or_404(CustomUser, alias=request.data.get("alias"))
		if not user.is_friend(fr_user):
			return Response({"detail": "this user is not in your friend list"}, status=400)
		user.friendList.remove(fr_user)
		fr_user.friendList.remove(user)
		return Response({"detail": "successfully deleted friend."}, status=200)

class rejectFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request):
		to_user = request.user
		from_user = get_object_or_404(CustomUser, alias=request.data.get("fromAlias"))
		frequest = get_object_or_404(FriendRequest, from_user=from_user, to_user=to_user)
		frequest.delete()
		return Response({"detail": "friend request deleted"}, status=200)

class cancelFriendRequestView(APIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request):
		from_user = request.user
		to_user = get_object_or_404(CustomUser, alias=request.data.get("toAlias"))
		frequest = get_object_or_404(FriendRequest, from_user=from_user, to_user=to_user)
		frequest.delete()
		return Response({"detail": "friend request deleted"}, status=200)

class blockUserView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		otherUser = get_object_or_404(CustomUser, alias=request.data.get("alias"))
		if otherUser.is_admin:
			return Response({"detail": "invalid choice"}, status=400)
		if user.has_blocked(otherUser):
			return Response({"detail": "this user is already blocked"}, status=400)
		if user == otherUser:
			return Response({"detail": "you cannot block yourself"}, status=400)
		if user.is_friend(otherUser):
			otherUser.friendList.remove(user)
			user.friendList.remove(otherUser)
		sentFriendRequest = FriendRequest.objects.filter(from_user=user, to_user=otherUser).first()
		if (sentFriendRequest):
			sentFriendRequest.delete()
		receiveFriendRequest = FriendRequest.objects.filter(from_user=otherUser, to_user=user).first()
		if (receiveFriendRequest):
			receiveFriendRequest.delete()
		user.blockList.add(otherUser)
		return Response({"detail": "user successfully blocked"}, status=200)

class unblockUserView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		otherUser = get_object_or_404(CustomUser, alias=request.data.get("alias"))
		if not user.has_blocked(otherUser):
			return Response({"detail": "this user is not blocked"}, status=400)
		user.blockList.remove(otherUser)
		return Response({"detail": "user was successfully unblocked"}, status=200)

class getOpenFriendRequestsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		openRequests = FriendRequest.objects.filter(to_user=user)
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

class getProfileView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		alias = request.query_params.get("alias")
		user_id = request.query_params.get("uid")
		own_profile = request.query_params.get("own")
		if user_id:
			profile = get_object_or_404(CustomUser, id=user_id)
		elif alias:
			profile = get_object_or_404(CustomUser, alias=alias)
		elif own_profile:
			profile = request.user
		else:
			return Response(
				{"error": "Either 'id' 'alias' or 'own' must be provided."},
				status=400
			)
		if not user.is_admin and profile.is_admin:
			return Response({"error": "You cannot view this profile"}, status=400)
		user = request.user
		# Still to be added : match history, rank and a way to manage the button add friend, request sent, request pending but not necessary
		profileData = {
				"id": profile.id,
				"alias": profile.alias,
				"mmr": profile.mmr,
				"wins": profile.winCount,
				"losses": profile.lossCount,
				"avatar": profile.avatar.url,
				"isCurrent": user == profile,
				"isFriend": user.is_friend(profile),
				"hasBlocked": user.has_blocked(profile),
				"isSent": user.is_sent(profile),
				"isPending": user.is_pending(profile),
				"rank": LeaderBoard.getPlayerRank(profile),
				"matchHistory": MatchResults.getPlayerGames(profile),
				"onlineStatus": OnlineUserActivity.get_user_status(profile),
				"userIsAdmin": user.is_admin,
				"isBanned": profile.is_banned,
			}
		return Response({
			"profile": profileData
		}, status=200)

class getFriendsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		friendList = request.user.friendList.all()
		friendData = [
			{
				"id": friend.id,
				"alias": friend.alias,
				"avatar": friend.avatar.url,
				"mmr": friend.mmr,
				"wins": friend.winCount,
				"losses": friend.lossCount,
			}
			for friend in friendList
		]
		return Response({
			"count": friendList.count(),
			"requests": friendData
		}, status=200)



class getBlocksView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		blockList = request.user.blockList.all()
		blockData = [
			{
				"id": block.id,
				"alias": block.alias,
			}
			for block in blockList
		]
		return Response({
			"count": blockList.count(),
			"requests": blockData
		}, status=200)

class getSentFriendRequestsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		openRequests = FriendRequest.objects.filter(from_user=user)
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
		if not newLang or newLang not in ("fr", "en", "pt"):
			return Response({"error": "newLang must be supplied as fr, en or pt"}, status=400)
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
