from game_service.models import LeaderBoard

def update_leaderboard():
    # Calls the LeaderBoardManager to update the leaderboard
    LeaderBoard.objects.updateLeaderBoard()
