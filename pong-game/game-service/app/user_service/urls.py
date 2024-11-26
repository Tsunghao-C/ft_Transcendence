from django.contrib import admin
from django.urls import path, include
from user_service.views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import views as auth_views


urlpatterns = [
	path("register/", CreateUserView.as_view(), name="register"),
	path("token/", TokenObtainPairView.as_view(), name="get_token"),
	path("token/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("getuser/", CurrentUserView.as_view(), name="get_user"),
    path("updatemmr/", UpdateMMR.as_view(), name="update_mmr"),
	path("banplayer/", BanPlayer.as_view(), name="banplayer"),
	path("unbanplayer/", UnbanPlayer.as_view(), name="unbanplayer"),
	#auth
	path("password_change/", auth_views.PasswordChangeView.as_view(template_name="user_service/password_change.html"), name="password_change"),
	path("password_change/done/", auth_views.PasswordChangeDoneView.as_view(template_name="user_service/password_change_done.html"), name="password_change_done"),
]