const TILE_EMOJI = {
  gold: "🪙",
  spider: "🕷️",
  mountain: "⛰️",
  player: "🧝",
  ORC: "🧟",
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
};

type Entity = {
  entityKey: string;
  name: string;
  emoji: string;
  score: string;
  x: number;
  y: number;
};

const WORLD_SIZE = 20;

export default function AdminView({ world, onLogout }: Props) {
  const renderCell = (x: number, y: number) => {
    const entity = world.leaderboard.find(
      (entityItem: Entity) => entityItem.x === x && entityItem.y === y
    );
    if (entity) return entity.emoji || "❓";

    if (world.gold.some(([gx, gy]: number[]) => gx === x && gy === y))
      return TILE_EMOJI.gold;
    if (world.spiders.some(([sx, sy]: number[]) => sx === x && sy === y))
      return TILE_EMOJI.spider;
    if (world.mountains.some(([mx, my]: number[]) => mx === x && my === y))
      return TILE_EMOJI.mountain;

    return "";
  };

  return (
    <div className="game-container">
      <div className="scoreboard">
        <h2>🏆 Leaderboard</h2>
        <ul>
          {world.leaderboard.map((player: Entity, i: number) => (
            <li key={player.entityKey} className="scoreboard-entry">
              <span>
                {i + 1}. {player.name} {player.emoji}
              </span>
              <span>{player.score}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="board">
        <div style={{ marginBottom: "1rem" }}>
          🪙 = Gold &nbsp; ⛰️ = Mountain &nbsp; 🕷️ = Spider
        </div>
        {Array.from({ length: WORLD_SIZE }).map((_, row) => (
          <div className="row" key={row}>
            {Array.from({ length: WORLD_SIZE }).map((_, col) => {
              const x = col;
              const y = WORLD_SIZE - 1 - row;
              return (
                <div className="tile" key={`${x}-${y}`}>
                  {renderCell(x, y)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="logout-container">
        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
