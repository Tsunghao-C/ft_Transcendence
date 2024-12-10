from django.shortcuts import render
from django.http import JsonResponse
from django.http import HttpResponse
from django.conf import settings
import os

def serve_js(request, filename):
    filepath = os.path.join(settings.BASE_DIR, 'game_service/templates', filename)
    if os.path.exists(filepath):
        with open(filepath, 'r') as file:
            content = file.read()
        return HttpResponse(content, content_type="application/javascript")
    else:
        return HttpResponse(status=404)

def game_home(request):
    """
    Render a landing page for the game (optional).
    """
    print("Game_home called")
    return render(request, "home.html")


def api_status(request):
    """
    Simple endpoint to verify the API is running.
    """
    return JsonResponse({"success": True, "message": "Game API is active"})



# # Create your views here.
# def game_test(request, game_id):
#     return render(request, 'game_service/game_test.html', {
#         'game_id': game_id
#     })