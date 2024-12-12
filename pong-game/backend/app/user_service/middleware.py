from django.utils import timezone
from .models import OnlineUserActivity

class LogRequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            try:
                OnlineUserActivity.update_user_activity(request.user)
            except Exception as e:
                print(f"Error updating user activity: {e}")
        response = self.get_response(request)
        return response