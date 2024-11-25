from django.urls import path, include
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("/register/", CreateUserView.as_view(), name="register"),
	path("/token/", TokenObtainPairView.as_view(), name="get_token"),
	path("/token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("/getuser/", CurrentUserView.as_view(), name="get_user"),
    path("/updatemmr/", UpdateMMR.as_view(), name="update_mmr"),
	path("/banplayer/", BanPlayer.as_view(), name="banplayer"),
	path("/unbanplayer/", UnbanPlayer.as_view(), name="unbanplayer"),
]