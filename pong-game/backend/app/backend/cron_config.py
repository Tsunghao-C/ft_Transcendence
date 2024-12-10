import os
from datetime import timedelta

# Default value of 15 if environment variable is not set
LDB_UPDATE_TIMER = int(os.environ.get("LDB_UPDATE_TIMER", 15))

CRONJOBS = [
    (f"*/{LDB_UPDATE_TIMER} * * * *", "'game_service.models.LeaderBoard.objects.updateLeaderBoard'")
]
