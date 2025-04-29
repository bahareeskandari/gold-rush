# Gold Rush - Internal Documentation

## Overview

A turn-based multiplayer game for a hackathon, where players navigate a hidden board using API calls to collect gold, avoid spiders, and compete against each other.  
Players cannot see the board — they must interact blind and get limited information via API.

## Game Rules

- Board size: Default **20x20** (hidden from players).
  - The board size can also be **40x40** if `WORLD_SIZE=40` is set in the environment variables.
- Players move by calling `/walk` (directions: `N`, `S`, `E`, `W`).
- Players can view a **5x5 area** around them with `/look`.
- Mountains are impassable (cannot walk onto them).
- Spiders teleport players randomly across the map and deduct **1 gold** (score cannot go below 0).
- Walking into another player attempts to **steal 1 gold** (if the target has any).
- Gold is picked up automatically when stepping on it.
- Players are rate-limited to **1 action every 2 seconds**.
- Entities timeout and are deleted after **3000 seconds** (50 minutes) of inactivity.

## API Endpoints

### Player Endpoints

- `POST /register`

  - Register a new player with a `name` and `emoji`.
  - Returns `entityKey`, starting `(x,y)` position, name, and emoji.

- `GET /look?entityKey=...`

  - See a 5x5 area centered around current position.
  - Returns tile types (`empty`, `gold`, `spider`, `mountain`, `player`) and a mini visual map.

- `POST /walk`

  - Move the player in a specified direction (`N`, `S`, `E`, `W`).
  - Handles movement, teleportation, gold pickup, and theft logic automatically.

- `GET /score?entityKey=...`
  - Retrieve current player stats: score, theft count, position, emoji, name, and rank.

### Admin Endpoints (Protected)

Admin endpoints require `Authorization: Bearer <admin_password>` where the password is set in `.env` (`VITE_ADMIN_PASSWORD`).

- `GET /admin/world`

  - View full board state, including gold, spiders, mountains, and the complete leaderboard.

- `GET /admin/restart`

  - Reset the entire world and generate a new random map.

- `GET /admin/stop`

  - Stop the game and clear all players and world elements.

- `POST /admin/clear-log`

  - Clear the game log file (`game_log.jsonl`).

- `GET /admin/logs`
  - View the historical event logs (player moves, pickups, thefts).

## World Generation

- 30 random gold positions.
- 15 random spider positions.
- 6 random mountain clusters:
  - Mountain shapes include: lines, squares, L-shapes, or random blobs.
- A background cleanup thread runs every 3 minutes to remove players inactive for over 3000 seconds.

## Mechanics Summary

- Moving into a mountain: **move blocked**.
- Moving into a spider: **teleported randomly** and lose 1 gold.
- Moving into another player: **steal 1 gold** if possible.
- Moving onto gold: **gold automatically picked up**.
- Moving out of bounds: **move blocked**.

## Security

- Admin API routes are protected by Bearer Token authentication.
- Players authenticate via their `entityKey`.
- Players are rate-limited to 1 action (walk or look) every 2 seconds.

## Deployment

- Backend: **FastAPI** app (`main.py`).
- Hosting: **Fly.io**.
- Event logging to a JSONL file (`game_log.jsonl`).
- Periodic cleanup service to delete inactive players.
- **VITE_BACKEND_URL**:
  - Production: `https://gold-rush.fly.dev`
  - Development: `http://127.0.0.1:8000`
- **LOG_FILE** path:
  - Production: `/data/game_log.jsonl`
    - Uses Fly.io volume mount at `/data/` to persist the log across restarts for replay functionality.
  - Development: `game_log.jsonl` in the root directory.
- **WORLD_SIZE**:
  - Controls the size of the board.
  - Default is `20` (resulting in 20x20 grid).
  - Setting `WORLD_SIZE=40` will generate a 40x40 grid instead.

## Frontend

- **Admin dashboard**:

  - Live view of the board (updates every second).
  - Displays full leaderboard.
  - Requires admin authentication.

- **Player dashboard**:
  - Displays own score, theft count, and coordinates.
  - Does not show the global map or other players.

## Notes

- Board coordinates: `(0,0)` is bottom-left; `(19,19)` (or `(39,39)` if WORLD_SIZE=40) is top-right.
- Restarting or stopping the game **deletes all players and entities**.
- Logs can be cleared manually with the `POST /admin/clear-log` endpoint.
