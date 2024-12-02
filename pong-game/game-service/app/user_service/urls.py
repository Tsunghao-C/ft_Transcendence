from django.urls import path, include
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.views import LoginView, LogoutView, PasswordChangeView, PasswordChangeDoneView

urlpatterns = [
	path("register/", CreateUserView.as_view(), name="register"),
	path("token/getToken", TokenObtainPairView.as_view(), name="get_token"), # can delete this later
	
	path("token/validate/", Validate2FAView.as_view(), name="validate_2fa"),
	path("token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("updatemmr/", UpdateMMR.as_view(), name="update_mmr"),
	path("banplayer/", BanPlayer.as_view(), name="banplayer"),
	path("unbanplayer/", UnbanPlayer.as_view(), name="unbanplayer"),

    path("login_temp/", LoginView.as_view(template_name="user_service/login.html"), name="login-user"),
	path("login/", Generate2FAView.as_view(), name="generate_2fa"),
    path("logout/", LogoutView.as_view(), name="logout-user"),

	# user profile
	path("getuser/", CurrentUserView.as_view(), name="get_user"),
	path("update-username/", updateUsernameView.as_view(), name="update_user"),
	path("change-password/", 
	  PasswordChangeView.as_view(
		  template_name="user_service/change_password.html",
		  success_url="/api/user/change-password-done/"
	  ), 
	  name="update_password"),
	path("change-password-done/", PasswordChangeDoneView.as_view(), name="update_password_success"),
	path("change-email/", changeEmailView.as_view(), name="email_change"),
]