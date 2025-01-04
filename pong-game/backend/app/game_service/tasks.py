from game_service.models import LeaderBoard
import logging

logger = logging.getLogger('root')

def update_leaderboard():
    try:
        LeaderBoard.objects.updateLeaderBoard()
    except Exception as e:
        logger.error(f"Error updating leaderboard: {e}")