# Really Real Tetris - Physics Edition

A Jekyll-based Tetris game with a physics twist. Unlike traditional Tetris, pieces rotate freely and can get stuck at angles. The game features realistic gravity simulation and requires skill to navigate crooked placements.

## Features

- **Physics-Based Gameplay**: Pieces have gravity velocity and can land at any angle
- **Free Rotation**: Use arrow keys to rotate pieces dynamically (↑/↓)
- **Realistic Gravity**: Pieces accelerate as they fall, creating variable speeds
- **Flexible Line Clearing**: Lines clear at 80% capacity (8/10 blocks) to add challenge and forgiveness
- **Score & Progression**: Earn points for placed pieces and line clears, with difficulty increasing per level
- **Next Piece Preview**: See what's coming next
- **Pause/Resume**: Take a break with the P key

## Controls

| Key | Action |
|-----|--------|
| ← → | Move piece left/right |
| ↑ ↓ | Rotate piece counter/clockwise |
| Space | Hard drop (increase fall speed) |
| P | Pause/Resume |

## Getting Started

### Prerequisites
- Ruby 2.7.0 or higher
- Bundler

### Installation

1. Navigate to the project directory:
```bash
cd really-real-tetris
```

2. Install dependencies:
```bash
bundle install
```

3. Build and serve the site:
```bash
bundle exec jekyll serve
```

4. Open your browser to `http://localhost:4000`

## Game Mechanics

### Gravity & Velocity
Pieces accelerate downward with gravity until they hit the floor or another piece. The longer they fall, the faster they move.

### Rotation Physics
Pieces can be freely rotated using arrow keys. Rotation happens smoothly and pieces may land at angles. This adds complexity to placing blocks efficiently.

### Line Clearing
A line is cleared when it's 80% full (8 out of 10 blocks). This allows some flexibility while still requiring reasonable placement:
- Single clear: 40 points × level
- Double clear: 100 points × level
- Triple clear: 300 points × level
- Tetris (4 lines): 1200 points × level

### Scoring
- Base: 10 points per placed piece
- Line clears: Variable based on count and level
- Level increases every 10 lines cleared

## Gameplay Tips

1. **Plan for Rotation**: Physical placement is harder - account for piece rotation when it lands
2. **Use Angles**: Sometimes a crooked piece can help fill gaps
3. **Line Management**: You have 20% tolerance per line, use it wisely
4. **Hard Drop**: Use space to speed up descent when you're placed well

## Project Structure

```
.
├── _config.yml           # Jekyll configuration
├── _layouts/
│   └── default.html      # Base HTML layout
├── assets/
│   ├── css/
│   │   └── style.css     # Game styling
│   └── js/
│       └── game.js       # Game logic & physics
├── index.html            # Game page
├── Gemfile               # Ruby dependencies
└── LICENSE               # License file
```

## License

See LICENSE file for details.

## Future Enhancements

- Sound effects and music
- Different difficulty levels
- Multiplayer mode
- Customizable piece rotation speed
- Mobile touch controls
- High score persistence
- Different gravity presets (low-G, high-G modes)
