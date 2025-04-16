import random
import threading
import time
from fastapi import FastAPI, HTTPException, WebSocket, Request, Query, Depends, Header, Security
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from enum import Enum
import os
from dotenv import load_dotenv
import asyncio
from contextlib import asynccontextmanager
import logging
import json
from datetime import datetime, timezone
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

LOG_FILE = "/data/game_log.jsonl" # "game_log.jsonl"  

security = HTTPBearer(auto_error=True)

logger = logging.getLogger("Gold Rush")
logging.basicConfig(level=logging.INFO)

cleanup_enabled = True

load_dotenv()
ADMIN_PASSWORD = os.getenv("VITE_ADMIN_PASSWORD")
if not ADMIN_PASSWORD:
    raise RuntimeError("ADMIN_PASSWORD is not set in .env")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== Server starting up, generating world ===")
    generate_world()
    print_board()
    start_cleanup_thread()
    yield

app = FastAPI(
    lifespan=lifespan,
    swagger_ui_parameters={"docExpansion": "none"},
    openapi_tags=[{"name": "Admin", "description": "Admin-only endpoints"}],
    title="Gold Rush",
    description="Backend API for Gold Rush",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORLD_SIZE = 20
ENTITY_TIMEOUT = 3000

entities = {}
gold_positions = set()
spider_positions = set()
mountain_positions = set()
entity_last_action = {}

lock = threading.Lock()

class RegisterRequest(BaseModel):
    name: str
    emoji: str

class AdminRequest(BaseModel):
    admin_password: str

class EntityKeyPayload(BaseModel):
    entityKey: str

class Direction(str, Enum):
    N = "N"
    S = "S"
    E = "E"
    W = "W"

class WalkRequest(EntityKeyPayload):
    direction: Direction

class Entity:
    def __init__(self, x, y, name, emoji):
        self.x = x
        self.y = y
        self.name = name
        self.emoji = emoji
        self.score = 0
        self.theft = 0

    def pos(self):
        return (self.x, self.y)

def generate_mountain_chunks(num_chunks=6, max_chunk_size=10):
    shapes = ['line', 'square', 'L', 'blob']
    positions = set()

    for _ in range(num_chunks):
        x = random.randint(1, WORLD_SIZE - 2)
        y = random.randint(1, WORLD_SIZE - 2)
        shape = random.choice(shapes)
        chunk = set()

        if shape == 'line':
            direction = random.choice(['horizontal', 'vertical'])
            length = random.randint(3, max_chunk_size)
            for i in range(length):
                if direction == 'horizontal':
                    chunk.add((x + i, y))
                else:
                    chunk.add((x, y + i))

        elif shape == 'square':
            size = random.randint(2, int(max_chunk_size ** 0.5))
            for dx in range(size):
                for dy in range(size):
                    chunk.add((x + dx, y + dy))

        elif shape == 'L':
            arm = random.randint(2, max_chunk_size // 2)
            for i in range(arm):
                chunk.add((x + i, y))
            for i in range(arm):
                chunk.add((x, y + i))

        elif shape == 'blob':
            chunk.add((x, y))
            for _ in range(random.randint(3, max_chunk_size)):
                cx, cy = random.choice(list(chunk))
                nx = cx + random.choice([-1, 0, 1])
                ny = cy + random.choice([-1, 0, 1])
                chunk.add((nx, ny))

        valid_chunk = {
            pos for pos in chunk
            if (
                0 <= pos[0] < WORLD_SIZE and 0 <= pos[1] < WORLD_SIZE and
                pos not in gold_positions and
                pos not in spider_positions and
                pos not in positions
            )
        }

        positions.update(valid_chunk)

    return positions

def generate_world():
    global gold_positions, spider_positions, mountain_positions
    gold_positions.clear()
    spider_positions.clear()
    mountain_positions.clear()

    def get_random_free_tile():
        while True:
            x = random.randint(0, WORLD_SIZE - 1)
            y = random.randint(0, WORLD_SIZE - 1)
            tile = (x, y)
            if (
                tile not in gold_positions
                and tile not in spider_positions
                and tile not in mountain_positions
            ):
                return tile

    while len(gold_positions) < 30:
        gold_positions.add(get_random_free_tile())

    while len(spider_positions) < 15:
        spider_positions.add(get_random_free_tile())

    mountain_positions.update(generate_mountain_chunks(num_chunks=6, max_chunk_size=10))

def cleanup_entities():
    now = time.time()
    to_delete = [key for key, last in entity_last_action.items() if now - last > ENTITY_TIMEOUT]
    for key in to_delete:
        entity = entities.pop(key, None)
        if entity:
            entity_last_action.pop(key, None)

def is_adjacent_to_spider(x, y):
    for sx, sy in spider_positions:
        if abs(sx - x) <= 1 and abs(sy - y) <= 1:
            return True
    return False

def start_cleanup_thread():
    def cleanup_loop():
        while True:
            time.sleep(180)  # wait 3 minutes
            if cleanup_enabled:
                with lock:
                    cleanup_entities()

    t = threading.Thread(target=cleanup_loop, daemon=True)
    t.start()



def verify_admin_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    if token != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Invalid admin token")


def log_board_state(action: str, entity_key: str):
    board_snapshot = {
        "timestamp": datetime.now(timezone.utc).isoformat(),  # <- updated here
        "trigger": action,
        "board": {
            "gold": list(gold_positions),
            "spiders": list(spider_positions),
            "mountains": list(mountain_positions),
            "entities": {
                k: {
                    "x": e.x,
                    "y": e.y,
                    "name": e.name,
                    "emoji": e.emoji,
                    "score": e.score
                }
                for k, e in entities.items()
            }
        }
    }

    try:
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(board_snapshot) + "\n")
    except Exception as e:
        logger.warning(f"Failed to write board log: {e}")

def clear_log_file():
    try:
        with open(LOG_FILE, "w") as f:
            f.truncate(0)
        logger.info("✅ Log file cleared.")
    except Exception as e:
        logger.warning(f"⚠️ Failed to clear log file: {e}")

@app.get("/", include_in_schema=False)
def root():
    return {"status": "Server is running"}

@app.post("/admin/clear-log")
def admin_clear_log(_: str = Depends(verify_admin_token)):
    clear_log_file()
    return {"status": "log file cleared"}

@app.post("/register")
def register(request: RegisterRequest):
    with lock:
        cleanup_entities()

        while True:
            x = random.randint(0, WORLD_SIZE - 1)
            y = random.randint(0, WORLD_SIZE - 1)

            if (
                (x, y) not in mountain_positions
                and (x, y) not in gold_positions
                and (x, y) not in spider_positions
                and not is_adjacent_to_spider(x, y)
                and all(e.pos() != (x, y) for e in entities.values())
            ):
                break

        entity_key = str(random.getrandbits(64))
        entities[entity_key] = Entity(x, y, request.name, request.emoji)
        entity_last_action[entity_key] = time.time()
        
        log_board_state(action="register", entity_key=entity_key)

        return {"entityKey": entity_key, "name": request.name, "emoji": request.emoji, "x": x, "y": y}
        

@app.get(
    "/look",
    summary="Shows a 5x5 area centered on the player",
    description="Example: `/look?entityKey=1234567890`"
)
def look(entityKey: str):
    entity_key = entityKey
    if not entity_key or entity_key not in entities:
        raise HTTPException(status_code=400, detail="Invalid entity key")

    now = time.time()
    last = entity_last_action.get(entity_key, 0)
    if now - last < 2:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    entity_last_action[entity_key] = now
    entity = entities[entity_key]
    radius = 2
    visible = []
    visual_board = []

    for dy in range(radius, -radius - 1, -1):
        row = []
        for dx in range(-radius, radius + 1):
            x = entity.x + dx
            y = entity.y + dy
            tile_char = '.'
            if 0 <= x < WORLD_SIZE and 0 <= y < WORLD_SIZE:
                tile = {"x": x, "y": y, "type": "empty"}
                if (x, y) == entity.pos():
                    tile_char = 'Y'
                elif (x, y) in mountain_positions:
                    tile["type"] = "mountain"
                    tile_char = 'M'
                elif (x, y) in gold_positions:
                    tile["type"] = "gold"
                    tile_char = 'G'
                elif (x, y) in spider_positions:
                    tile["type"] = "spider"
                    tile_char = 'S'
                elif any(e.pos() == (x, y) for k, e in entities.items() if k != entity_key):
                    tile["type"] = "player"
                    tile_char = 'P'
                visible.append(tile)
            row.append(tile_char)
        visual_board.append(' '.join(row))
    return {
        "visible": visible,
        "visual": visual_board
    }


@app.post(
    "/walk",
    summary="Move your entity (N)orth, (S)outh, (E)ast or (W)est",
    description="""
- You **cannot** move outside the board or onto a **mountain** tile.
- If you try to move **onto a spider**, you will be **teleported** to a random location.
- If you try to move **onto a competitor**, you will attempt to **steal gold** from them.
- If you move onto **gold**, it is automatically picked up.
"""
)
def walk(request: WalkRequest):
    entity_key = request.entityKey
    if not entity_key or entity_key not in entities:
        raise HTTPException(status_code=400, detail="Invalid entity key")

    now = time.time()
    last = entity_last_action.get(entity_key, 0)
    if now - last < 2:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    entity_last_action[entity_key] = now
    entity = entities[entity_key]

    dx, dy = 0, 0
    if request.direction == "N":
        dy = 1
    elif request.direction == "S":
        dy = -1
    elif request.direction == "E":
        dx = 1
    elif request.direction == "W":
        dx = -1

    new_x = entity.x + dx
    new_y = entity.y + dy
    new_pos = (new_x, new_y)

    moved = False

    if 0 <= new_x < WORLD_SIZE and 0 <= new_y < WORLD_SIZE:
        if new_pos not in mountain_positions:
            # 🕷️ Spider check first
            if new_pos in spider_positions:
                # Trigger teleport instead of moving
                with lock:
                    while True:
                        x = random.randint(0, WORLD_SIZE - 1)
                        y = random.randint(0, WORLD_SIZE - 1)
                        new_pos = (x, y)
                        if (
                            new_pos not in mountain_positions
                            and new_pos not in gold_positions
                            and new_pos not in spider_positions
                            and all(e.pos() != new_pos for e in entities.values())
                        ):
                            entity.x = x
                            entity.y = y
                            entity.score = max(0, entity.score - 1)
                            logger.info(f"{entity.name} ({entity.emoji}) tried to enter a spider tile and got teleported to {new_pos}")
                            log_board_state(action="spider-teleport", entity_key=entity_key)
                            break
            else:
                # Check if another player is on the target square
                blocking_entity = next((e for k, e in entities.items() if k != entity_key and e.pos() == new_pos), None)
                if blocking_entity:
                    if blocking_entity.score > 0:
                        entity.score += 1
                        entity.theft += 1
                        blocking_entity.score -= 1
                        blocking_entity.theft -= 1
                        logger.info(f"{entity.name} stole from {blocking_entity.name} at {new_pos}")
                        log_board_state(action="theft", entity_key=entity_key)
                else:
                    entity.x = new_x
                    entity.y = new_y
                    moved = True
                    log_board_state(action="move", entity_key=entity_key)

    # 🪙 Auto-pickup gold if standing on it
    with lock:
        pos = entity.pos()
        if pos in gold_positions:
            gold_positions.remove(pos)
            entity.score += 1
            logger.info(f"{entity.name} ({entity.emoji}) picked up gold at {pos}")
            log_board_state(action="pickup", entity_key=entity_key)

    return {"x": entity.x, "y": entity.y, "score": entity.score}


@app.get("/score", summary="Get player info", description="Returns gold, position, emoji and name")
def score(entityKey: str):
    if not entityKey or entityKey not in entities:
        raise HTTPException(status_code=400, detail="Invalid entity key")

    entity = entities[entityKey]

    # Leaderboard position
    sorted_players = sorted(entities.values(), key=lambda e: e.score, reverse=True)
    position = sorted_players.index(entity) + 1

    def ordinal(n):
        return f"{n}{'tsnrhtdd'[(n//10%10!=1)*(n%10<4)*n%10::4]}"

    total_gold = len(gold_positions)

    return {
        "gold": entity.score,
        "theft": entity.theft,
        "name": entity.name,
        "coordinates": {"x": entity.x, "y": entity.y},
        "emoji": entity.emoji,
        "position": ordinal(position),
        "totalGoldInGame": total_gold,
    }

 
@app.get("/admin/world", tags=["Admin"])
def admin_world(credentials: HTTPAuthorizationCredentials = Security(security)):
    verify_admin_token(credentials)
    leaderboard = [
        {"entityKey": key, "name": e.name, "emoji": e.emoji, "score": e.score, "x": e.x, "y": e.y,}
        for key, e in entities.items()
    ]
    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "gold": list(gold_positions),
        "spiders": list(spider_positions),
        "mountains": list(mountain_positions),
        "leaderboard": leaderboard,
    }

@app.get("/admin/restart", tags=["Admin"])
def restart_game(credentials: HTTPAuthorizationCredentials = Security(security)):
    verify_admin_token(credentials)
    global cleanup_enabled
    cleanup_enabled = True
    with lock:
        entities.clear()
        entity_last_action.clear()
        generate_world()
        print_board()
    return {"status": "game restarted"}

@app.get("/admin/stop", tags=["Admin"])
def stop_game(credentials: HTTPAuthorizationCredentials = Security(security)):
    verify_admin_token(credentials)
    global cleanup_enabled
    cleanup_enabled = False
    with lock:
        gold_positions.clear()
        spider_positions.clear()
        mountain_positions.clear()
        entities.clear()
        entity_last_action.clear()
    logger.info("=== GAME STOPPED ===")
    return {"status": "game stopped and all data cleared"}

@app.post("/admin/clear-log", tags=["Admin"])
def admin_clear_log(credentials: HTTPAuthorizationCredentials = Security(security)):
    verify_admin_token(credentials)
    clear_log_file()
    return {"status": "log file cleared"}

def print_board():
    logger.info("\n=== WORLD MAP ===")
    board = [['.' for _ in range(WORLD_SIZE)] for _ in range(WORLD_SIZE)]

    for (x, y) in mountain_positions:
        board[y][x] = 'M'

    for (x, y) in gold_positions:
        board[y][x] = 'G'

    for (x, y) in spider_positions:
        board[y][x] = 'S'

    for e in entities.values():
        x, y = e.x, e.y
        board[y][x] = e.emoji

    for row in reversed(board):
        logger.info(' '.join(row))
    logger.info(f"Gold: {len(gold_positions)}, Spiders: {len(spider_positions)}, Mountains: {len(mountain_positions)}, Players: {len(entities)}")
    logger.info("=================\n")
