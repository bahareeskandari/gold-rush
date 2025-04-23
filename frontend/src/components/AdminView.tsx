const TILE_EMOJI = {
  gold: "💰",
  spider: "🕷️",
  mountain: "⛔️",
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

const WORLD_SIZE = 20;

export default function AdminView({
  world,
  onLogout,
  getLogs,
  replaying,
  setReplaying,
}: Props) {
  console.log("world", world);
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
        <div className="button-row">
          <button onClick={() => setReplaying(!replaying)}>
            {replaying ? "▶️ Resume Updates" : "⏸️ Pause Updates"}
          </button>
          <button onClick={() => getLogs()}>▶️ Play summary of game</button>
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
        <div className="logout-container">
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
}
