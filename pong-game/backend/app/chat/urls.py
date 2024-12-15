from django.urls import path, include
from . import views
from django.contrib.auth.views import LoginView, LogoutView

urlpatterns = [
    path("test/", views.chat_test),
    path("index/", views.index, name="index"),
    path("<str:room_name>/", views.room, name="room"),
]
