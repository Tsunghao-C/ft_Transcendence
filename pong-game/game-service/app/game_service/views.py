from django.shortcuts import render
from django.http import JsonResponse

def game_home(request):
    """
    Render a landing page for the game (optional).
    """
    return render(request, "home.html")


def api_status(request):
    """
    Simple endpoint to verify the API is running.
    """
    return JsonResponse({"success": True, "message": "Game API is active"})

