import React, { useEffect, useState } from "react";
import "./App.css"; // We'll style here

const WORLD_SIZE = 20;

const TILE_EMOJI = {
  gold: "🪙",
  spider: "🕷️",
  mountain: "⛰️",
  ELF: "🧝",
  ORC: "🧟",
};

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const [world, setWorld] = useState(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/admin/world?admin_password=${ADMIN_PASSWORD}`
        );
        if (!res.ok) throw new Error("Failed to fetch board");
        const data = await res.json();
        setWorld(data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchBoard(); // fetch once immediately
    const interval = setInterval(fetchBoard, 1000); // fetch every second

    return () => clearInterval(interval);
  }, []);

  const renderCell = (x, y) => {
    if (!world) return null;

    const entity = Object.values(world.entities).find(
      (e) => e.x === x && e.y === y
    );
    if (entity) return TILE_EMOJI[entity.race] || "❓";

    if (world.gold.some(([gx, gy]) => gx === x && gy === y))
      return TILE_EMOJI.gold;
    if (world.spiders.some(([sx, sy]) => sx === x && sy === y))
      return TILE_EMOJI.spider;
    if (world.mountains.some(([mx, my]) => mx === x && my === y))
      return TILE_EMOJI.mountain;

    return "";
  };

  return (
    <div className="board">
      <div style={{ marginBottom: "1rem" }}>
        🧝 = ELF &nbsp; 🧟 = ORC &nbsp; 🪙 = Gold &nbsp; ⛰️ = Mountain &nbsp; 🕷️
        = Spider
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
  );
}

export default App;
