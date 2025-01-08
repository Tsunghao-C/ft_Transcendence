from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.views import LoginView, LogoutView, PasswordChangeView, PasswordChangeDoneView

urlpatterns = [
	# register
	path("register/", CreateUserView.as_view(), name="register"),
	
	# login
	path("2FA/generate/", Generate2FAView.as_view(), name="generate_2fa"),
	path("2FA/validate/", Validate2FAView.as_view(), name="validate_2fa"),
	path("token/refresh/", TokenRefreshView.as_view(), name="refresh"),
	path("logout/", LogoutView.as_view(), name="logout-user"),

	# game administration
	path("banplayer/", BanPlayer.as_view(), name="banplayer"),
	path("unbanplayer/", UnbanPlayer.as_view(), name="unbanplayer"),

	# user profile
	path("getuser/", CurrentUserView.as_view(), name="get_user"),
	path("update-username/", updateUsernameView.as_view(), name="update_user"),
	path("change-email/", changeEmailView.as_view(), name="email_change"),
	path("change-password/", changePasswordView.as_view(), name="password_change"),
	path("change-alias/", changeAliasView.as_view(), name="change_alias"),
	path("send-friend-request/", sendFriendRequestView.as_view(), name="add_friend"),
	path("get-friends/", getFriendsView.as_view(), name="get_friends"),
	path("get-profile/", getProfileView.as_view(), name="get_profile"),
	path("accept-friend-request/", acceptFriendRequestView.as_view(), name="accept_friend"),
	path("reject-friend-request/", rejectFriendRequestView.as_view(), name="reject_friend"),
	path("cancel-friend-request/", cancelFriendRequestView.as_view(), name="cancel_friend"),
	path("delete-friend/", deleteFriendView.as_view(), name="delete_friend"),
	path("get-blocks/", getBlocksView.as_view(), name="get_blocks"),
	path("block-user/", blockUserView.as_view(), name="block_user"),
	path("unblock-user/", unblockUserView.as_view(), name="unblock_user"),
	path("get-friend-requests/", getOpenFriendRequestsView.as_view(), name="get_friend_requests"),
	path("get-sent-friend-requests/", getSentFriendRequestsView.as_view(), name="get_sent_frequests"),
	path("change-language/", changeLanguageView.as_view(), name="change_language"),
	path("change-avatar/", changeAvatarView.as_view(), name="avatar_change"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)