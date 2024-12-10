from django.shortcuts import render, redirect

def index(request):
    return render(request, "chat/index.html")

def room(request, room_name):
    ## temporary bypass log in, need to put it back later
    # if not request.user.is_authenticated:
    #     return redirect("/api/user/login/")
    return render(request, 'chat/chatroom.html', {
        'room_name': room_name
    })
