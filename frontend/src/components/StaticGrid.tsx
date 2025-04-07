import "../App.css";

export function StaticGrid() {
  const gridSize = 10;
  const rows = [];
  for (let y = gridSize - 1; y >= 0; y--) {
    const cols = [];
    for (let x = 0; x < gridSize; x++) {
      cols.push(
        <div key={`${x}-${y}`} className="grid-cell">
          {`${x},${y}`}
        </div>
      );
    }
    rows.push(
      <div key={y} className="grid-row">
        {cols}
      </div>
    );
  }

  return <div className="grid-container">{rows}</div>;
}
