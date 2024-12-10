from django.shortcuts import render

# Create your views here.
def game_test(request, game_id):
    return render(request, 'game_service/game_test.html', {
        'game_id': game_id
    })