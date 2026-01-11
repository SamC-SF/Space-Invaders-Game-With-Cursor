# Space Invaders Game

A classic Space Invaders game built with HTML5 Canvas, CSS, and JavaScript.

## How to Run

### Option 1: Simple (Just Open the HTML File)
Simply double-click `index.html` or open it in your web browser. The game should work directly!

### Option 2: Using a Local Web Server (Recommended)
Run the provided script:
```bash
chmod +x run.sh
./run.sh
```

Or manually start a server:

**Using Python:**
```bash
python3 -m http.server 8000
# or
python -m http.server 8000
```

**Using Node.js (if you have http-server installed):**
```bash
npx http-server -p 8000
```

Then open your browser and go to: `http://localhost:8000`

## Controls

- **WASD** - Move the player ship
- **Mouse** - Aim your weapon
- **Left Click** - Shoot

## Game Features

- Classic Space Invaders gameplay
- Boss enemies that spawn periodically
- Power-ups (fire rate boost, nuke, speed boost)
- Score tracking
- Lives system
- Progressive difficulty

Enjoy the game!
