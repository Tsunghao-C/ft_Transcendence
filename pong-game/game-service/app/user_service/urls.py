from django.urls import path, include
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.views import LoginView, LogoutView

urlpatterns = [
    path("/register/", CreateUserView.as_view(), name="register"),
	# path("/token/", TokenObtainPairView.as_view(), name="get_token"),
	path("/token/", Generate2FAView.as_view(), name="generate_2fa"),
	path("/token/validate/", Validate2FAView.as_view(), name="validate_2fa"),
	path("/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("/getuser/", CurrentUserView.as_view(), name="get_user"),
    path("/updatemmr/", UpdateMMR.as_view(), name="update_mmr"),
	path("/banplayer/", BanPlayer.as_view(), name="banplayer"),
	path("/unbanplayer/", UnbanPlayer.as_view(), name="unbanplayer"),
    path("/login/", LoginView.as_view(template_name="user_service/login.html"), name="login-user"),
    path("/logout/", LogoutView.as_view(), name="logout-user"),
]