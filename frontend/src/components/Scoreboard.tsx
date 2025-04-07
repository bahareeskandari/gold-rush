import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../api";
import "../App.css";

interface Player {
  entityKey: string;
  race: string;
  score: number;
}
export function Scoreboard() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchLeaderboard();
        setPlayers(data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="scoreboard">
      <h2>🏆 Leaderboard</h2>
      <ul>
        {players.map((p, i) => (
          <li key={p.entityKey} className="scoreboard-entry">
            <span>
              {i + 1}. {p.race}
            </span>
            <span>{p.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
