from django.urls import path
from . import views

urlpatterns = [
    # path("", views.game_home, name="access_home"),
    # path('privateMatch.js', views.serve_js, {'file_path': 'privateMatch.js'}),
    # path('joinMatch.js', views.serve_js, {'file_path': 'joinMatch.js'}),
    path('test/', views.game_test, name='game_test'),
    # path('test/<str:game_id>/', views.game_test, name='game_test'),
]