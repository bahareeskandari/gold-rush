import React from "react";

const TILE_EMOJI = {
  gold: "💰",
  spider: "🕷️",
  mountain: "⛔️",
  player: "👝",
  ORC: "🦟",
};

type World = {
  entities: { [key: string]: Entity };
  gold: number[][];
  spiders: number[][];
  mountains: number[][];
  leaderboard: Entity[];
};

type Props = {
  world: World;
  onLogout: () => void;
  getLogs: () => void;
  replaying: boolean;
  setReplaying: (val: boolean) => void;
};

type Entity = {
  entityKey: string;
  name: string;
  emoji: string;
  score: string;
  x: number;
  y: number;
};

const WORLD_SIZE = 40;

export default function AdminView({
  world,
  onLogout,
  getLogs,
  replaying,
  setReplaying,
}: Props) {
  const renderCell = (x: number, y: number) => {
    const playerHere = world.leaderboard.some((p) => p.x === x && p.y === y);
    const isGoldTile = world.gold.some(([gx, gy]) => gx === x && gy === y);
    const isMountain = world.mountains.some(([mx, my]) => mx === x && my === y);
    const playerAdjacent = world.leaderboard.some(
      (p) => Math.abs(p.x - x) + Math.abs(p.y - y) === 1
    );

    const goldPickup = isGoldTile && playerHere;
    const bumpBlocked = isMountain && playerAdjacent;

    const tileClasses = [
      "tile",
      goldPickup ? "gold-pickup" : "",
      playerHere ? "player-moved" : "",
      bumpBlocked ? "bump-blocked" : "",
    ]
      .join(" ")
      .trim();

    const entity = world.leaderboard.find((p) => p.x === x && p.y === y);
    if (entity) {
      return <div className={tileClasses}>{entity.emoji || "❓"}</div>;
    }

    if (isGoldTile) return <div className={tileClasses}>{TILE_EMOJI.gold}</div>;
    if (world.spiders.some(([sx, sy]) => sx === x && sy === y))
      return <div className={tileClasses}>{TILE_EMOJI.spider}</div>;
    if (isMountain)
      return <div className={tileClasses}>{TILE_EMOJI.mountain}</div>;

    return <div className={tileClasses}></div>;
  };

  return (
    <div className="app">
      <div className="scoreboard">
        <h2>🏆 Leaderboard</h2>
        <ul>
          {world.leaderboard.map((player: Entity, i: number) => (
            <li key={player.entityKey} className="scoreboard-entry">
              <span>
                {i + 1}. {player.name} {player.emoji}
              </span>
              <span>{player.score} 💰</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="board-content">
        {Array.from({ length: WORLD_SIZE }).map((_, row) => (
          <React.Fragment key={row}>
            {Array.from({ length: WORLD_SIZE }).map((_, col) => {
              const x = col;
              const y = WORLD_SIZE - 1 - row;
              return renderCell(x, y);
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="control-panel">
        <div className="button-row vertical">
          <button onClick={() => setReplaying(!replaying)}>
            {replaying ? "▶️ Resume Updates" : "⏸️ Pause Updates"}
          </button>
          <button onClick={() => getLogs()}>▶️ Play summary of game</button>
        </div>
        <div className="logout-container">
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
}
