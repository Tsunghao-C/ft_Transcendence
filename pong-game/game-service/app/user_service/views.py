from django.shortcuts import render
from .models import CustomUser
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

class CreateUserView(generics.CreateAPIView):
	queryset = CustomUser.objects.all()
	serializer_class = UserSerializer
	permission_classes = [AllowAny]

class CurrentUserView(APIView):
	def get(self, request):
		serializer = UserSerializer(request.user)
		return Response(serializer.data)