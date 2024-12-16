import random
import asyncio
import logging
from typing import Literal, Optional
from game_room import CANVAS_HEIGHT, CANVAS_WIDTH, PADDLE_HEIGHT, PADDLE_WIDTH, BALL_RADIUS

logger = logging.getLogger(__name__)

class PongAI:
    def __init__(self,
                 difficulty: Literal['easy', 'medium', 'hard'] = 'medium',
                 side: Literal['left', 'right'] = 'right'):
        self.side = side
        self.canvas_width = CANVAS_WIDTH
        self.canvas_height = CANVAS_HEIGHT
        self.paddle_height = PADDLE_HEIGHT
        self.paddle_x = CANVAS_WIDTH * 0.9 if side == 'right' else CANVAS_WIDTH * 0.1
        self.paddle_y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2
        self.difficulties = {
            'easy': {
                'prediction_noise': (-50, 50),
                'reaction_delay': 0.2,
                'mistake_chance': 0.15,
                'decision_cooldown': 0.1
            },
            'medium': {
                'prediction_noise': (-30, 30),
                'reaction_delay': 0.1,
                'mistake_chance': 0.1,
                'decision_cooldown': 0.07
            },
            'hard': {
                'prediction_noise': (-15, 15),
                'reaction_delay': 0.05,
                'mistake_chance': 0.05,
                'decision_cooldown': 0.05
            }
        }
        self.settings = self.difficulties[difficulty]
        self.last_decision_time = 0
        self.current_move = 'move_stop'

    async def predict_ball_position(self, ball_x: float, ball_y: float, ball_dx: float, ball_dy:float) -> Optional[float]:
        is_approaching = (ball_dx > 0 and self.sie == 'right') or (ball_dx < 0 and self.side == 'left')

        if not is_approaching:
            return None
        
        time_to_reach = abs((self.paddle_x - ball_x) / ball_dx)
        predicted_y = ball_y + (ball_dy * time_to_reach)

        # Add noise to prediction
        noise_range = self.settings['prediction_noise']
        predicted_y += random.uniform(*noise_range)

        predicted_y = min(max(predicted_y, 0), self.canvas_height)
        return predicted_y
    
    def _decide_movement(self, target_y: float) -> str:
        # add chances to make mistake
        if random.random() < self.settings['mistake_chance']:
            return random.choice(['move_up', 'move_down', 'move_stop'])
        
        paddle_center = self.paddle_y + self.paddle_height / 2
        distance_to_target = target_y - paddle_center

        if abs(distance_to_target) < 10:
            return 'move_stop'
        
        return 'move_up' if distance_to_target < 0 else 'move_down'

    async def calculate_move(self, ball_x: float, ball_y: float, ball_dx: float, ball_dy: float) -> str:
        current_time = asyncio.get_event_loop().time()
        if current_time - self.last_decision_time < self.settings['decision_cooldown']:
            return self.current_move
        
        predicted_y = await self.predict_ball_position(ball_x, ball_y, ball_dx, ball_dy)
        if predicted_y is None:
            return 'move_stop'
        
        await asyncio.sleep(self.settings['reaction_delay'])

        self.last_decision_time = current_time
        self.current_move = self._decide_movement(predicted_y)

        return self.current_move



