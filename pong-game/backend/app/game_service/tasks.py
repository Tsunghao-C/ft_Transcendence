from game_service.models import LeaderBoard

def update_leaderboard():
    print("Updating leaderboard...")
    LeaderBoard.objects.updateLeaderBoard()