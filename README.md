# Space Quiz Shooter

A browser-based shooting game that combines quiz questions with arcade-style gameplay.

## How to Play

1. Open the `index.html` file in a web browser to start the game.
2. Use the left and right arrow keys to move your ship.
3. Use the following keys to shoot different bullet types:
   - `A`: Option A
   - `S`: Option B
   - `D`: Option C
   - `F`: Option D
   - `W`: True (✅)
   - `E`: False (❌)

## Game Rules

- Questions appear on the left side of the screen.
- Enemies appear in the game area, each linked to a question in the question box.
- Shoot the correct answer bullet at the enemy to destroy it.
- If you shoot the wrong answer, the enemy gains a shield.
- After an enemy gets 3 shields, you become invincible for 5 seconds.
- If an enemy reaches the bottom of the screen, you lose one health point (unless invincible).
- The game ends when you lose all 10 health points.

## Features

- 80 multiple-choice and 20 true/false questions
- Score tracking
- Health bar
- Invincibility power-up
- Increasing difficulty as you play

## Development

This game is built using vanilla HTML, CSS, and JavaScript.

### Project Structure

```
game/
├── assets/        # Game images
├── css/           # Styling
│   └── style.css
├── js/            # Game logic
│   ├── game.js
│   └── questions.js
└── index.html     # Main game page
```

## Credits

Created as a learning project for quiz-based gaming. 