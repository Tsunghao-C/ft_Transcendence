# from django.utils import timezone
# from .models import OnlineUserActivity
# from .models import CustomUser

# class LogRequestMiddleware():
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):
#         user = request.user
#         if user.is_authenticated:
#             try:
#                 OnlineUserActivity.update_user_activity(user)
#             except Exception as e:
#                 print(f"Error updating user activity: {e}")
#         else:
#             print("User is not authenticated")
#         response = self.get_response(request)
#         return response

from django.utils import timezone
from .models import OnlineUserActivity
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class LogRequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Decode JWT token and set request.user if not already set
        if not request.user.is_authenticated:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                try:
                    user_auth = JWTAuthentication()
                    validated_user, _ = user_auth.authenticate(request)
                    request.user = validated_user
                except AuthenticationFailed:
                    print("Invalid or expired JWT token")
                except Exception as e:
                    print(f"Unexpected error during token authentication: {e}")
        
        # Proceed with updating user activity if authenticated
        if request.user and request.user.is_authenticated:
            try:
                OnlineUserActivity.update_user_activity(request.user, request.path)
            except Exception as e:
                print(f"Error updating user activity: {e}")
        else:
            print(f"User {request.user} is not authenticated")

        response = self.get_response(request)
        return response
