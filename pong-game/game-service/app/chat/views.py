from django.shortcuts import render, redirect

def index(request):
    return render(request, "chat/index.html")

def room(request, room_name):
    if not request.user.is_authenticated:
        return redirect("/api/user/login/")
    return render(request, "chat/chatroom.html", {"room_name": room_name})

