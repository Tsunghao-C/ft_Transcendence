import random
import asyncio
import time
import logging
from typing import Literal, Optional

logger = logging.getLogger(__name__)

class PongAI:
    def __init__(self,
                 difficulty: Literal['easy', 'medium', 'hard'] = 'medium',
                 side: Literal['left', 'right'] = 'right',
                 canvas_width: int = 800,
                 canvas_height: int = 600,
                 paddle_height: int = 100):
        self.side = side
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.paddle_height = paddle_height
        self.paddle_x = canvas_width * 0.9 if side == 'right' else canvas_width * 0.1
        self.paddle_y = canvas_height / 2 - paddle_height / 2
        self.difficulties = {
            'easy': {
                'prediction_noise': (-8, 8),
                'reaction_delay': 1,
                'mistake_chance': 0.1,
            },
            'medium': {
                'prediction_noise': (-5, 5),
                'reaction_delay': 0.5,
                'mistake_chance': 0.08,
            },
            'hard': {
                'prediction_noise': (-1, 1),
                'reaction_delay': 0.2,
                'mistake_chance': 0.05,
            }
        }
        self.settings = self.difficulties[difficulty]
        self.last_decision_time = 0
        self.current_move = 'move_stop'

    def _is_at_boundary(self) -> bool:
        return (self.paddle_y <= 0) or (self.paddle_y + self.paddle_height >= self.canvas_height)

    def _should_return_to_center(self, ball_dx: float) -> bool:
        ball_moving_away = (ball_dx < 0) if self.side == 'right' else (ball_dx > 0)
        return ball_moving_away

    def _get_center_move(self) -> str:
        paddle_center = self.paddle_y + (self.paddle_height / 2)
        canvas_center = self.canvas_height / 2

        deadzone = 10
        if abs(paddle_center - canvas_center) < deadzone:
            return 'move_stop'

        if paddle_center > canvas_center:
            if self.paddle_y <= 0:
                return 'move_stop'
            return 'move_up'
        else:
            if (self.paddle_y + self.paddle_height) >= self.canvas_height:
                return 'move_stop'
            return 'move_down'

    def predict_ball_position(self, ball_x: float, ball_y: float, ball_dx: float, ball_dy:float) -> Optional[float]:
        is_approaching = (ball_dx > 0 and self.side == 'right') or (ball_dx < 0 and self.side == 'left')

        if not is_approaching:
            return None
        
        time_to_reach = abs((self.paddle_x - ball_x) / ball_dx)
        predicted_y = ball_y + (ball_dy * time_to_reach)

        # consider bounces from top and bottom
        while predicted_y < 0 or predicted_y > self.canvas_height:
            if predicted_y < 0:
                predicted_y = -predicted_y
            elif predicted_y > self.canvas_height:
                predicted_y = 2 * self.canvas_height - predicted_y

        # Add noise to prediction
        noise_range = self.settings['prediction_noise']
        predicted_y += random.uniform(noise_range[0], noise_range[1])

        padding = self.paddle_height / 4
        predicted_y = min(max(predicted_y, padding), self.canvas_height - padding)
        return predicted_y
    
    def _decide_movement(self, target_y: float) -> str:
        # add chances to make mistake
        # if self._is_at_boundary():
        #     return self._get_center_move()
        paddle_center = self.paddle_y + self.paddle_height / 2
        distance_to_target = target_y - paddle_center

        if random.random() < self.settings['mistake_chance']:
            return random.choice(['move_up', 'move_down', 'move_stop'])

        if abs(distance_to_target) < 5:
            return 'move_stop'
        
        # Avoid moving forward it at boundaries
        if distance_to_target < 0 and self.paddle_y <= 0:
            return 'move_stop'
        if distance_to_target > 0 and (self.paddle_y + self.paddle_height) >= self.canvas_height:
            return 'move_stop'
        
        return 'move_up' if distance_to_target < 0 else 'move_down'

    def update_paddle_pos(self, move_direction):
        if move_direction == 'move_up':
            self.paddle_y = max(0, self.paddle_y - 5)
        elif move_direction == 'move_down':
            self.paddle_y = min(self.canvas_height - self.paddle_height, self.paddle_y + 5)

    async def calculate_move(self, ball_x: float, ball_y: float, ball_dx: float, ball_dy: float) -> str:
        current_time = time.time()

        if current_time - self.last_decision_time < self.settings['reaction_delay']:
            if self.current_move != 'move_stop':
                self.update_paddle_pos(self.current_move)
            return self.current_move
        
        self.last_decision_time = current_time
        
        predicted_y = self.predict_ball_position(ball_x, ball_y, ball_dx, ball_dy)
        if predicted_y is not None:
            self.current_move = self._decide_movement(predicted_y)
        elif self._should_return_to_center(ball_dx):
            center_move = self._get_center_move()
            if center_move != 'move_stop':
                self.current_move = center_move

        self.update_paddle_pos(self.current_move)

        return self.current_move
