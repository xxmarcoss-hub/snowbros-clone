# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Snow Bros Clone - A 2-player arcade platformer game built with vanilla JavaScript and HTML5 Canvas. Players freeze enemies with snow and push frozen enemies as rolling snowballs. 10 levels plus a final boss fight (Twin Ghouls).

## Development Commands

```bash
# Run the game (requires local server to avoid CORS issues)
python -m http.server 8000
# Then open http://localhost:8000 in browser

# Alternative: use any static file server
npx serve .
```

No build system, bundler, or test framework is configured. Pure vanilla JavaScript.

## Architecture

### Entry Point
- `index.html` loads all scripts and initializes `Game.init()`
- Game loop runs at 60 FPS via `requestAnimationFrame`

### Core Files (js/)
| File | Purpose |
|------|---------|
| `game.js` | Main loop, state machine (MENU→PLAYING→PAUSED→LEVEL_COMPLETE→GAME_OVER/VICTORY) |
| `player.js` | Player class - physics, input, animation, shooting |
| `enemy.js` | Enemy AI - patrol, decisions, snow coverage states |
| `snowball.js` | SnowProjectile, SnowCoverage, RollingSnowball classes |
| `platform.js` | Platform collision system (SOLID vs PASSTHROUGH) |
| `powerup.js` | Power-ups (speed, range, fire_rate, fly) and bonus items |
| `boss.js` | Twin Ghouls boss fight with 2-phase AI |
| `levels.js` | 10 level definitions with platforms and enemy spawns |
| `sprites.js` | Procedural pixel art generation (no image files) |
| `input.js` | Keyboard handling for 2 players |
| `utils.js` | Constants, collision detection (AABB) |
| `audio.js` | Placeholder - audio system not yet implemented |

### Entity Pattern
All game entities follow this structure:
- Constructor initializes properties
- `update(deltaTime)` - per-frame logic
- `render(ctx)` - Canvas drawing
- AABB collision detection

### Key Constants (utils.js)
- Canvas: 256×224 pixels (scaled 3x in CSS)
- Gravity: 0.35, Max fall speed: 6
- Player speed: 1.8, Jump force: -5.5
- Snow: speed 4, range 60, 3 hits to freeze

### Controls
- **P1 (Nick)**: Arrows + Space
- **P2 (Tom)**: WASD + Q
- **Menu**: Enter (start/pause), 1/2 (player count)
- **Debug**: Ctrl+D

## Git Workflow

When making changes, follow this branch strategy:
- `main` - stable releases
- `develop` - integration branch
- `feature/[name]`, `fix/[name]`, `refactor/[name]` - work branches

Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `test:`, `chore:`

Discussions during implementation should be reported as comments in the relevant GitHub issue.

## Language

Comments in the codebase are in Italian. README and documentation are in Italian.
