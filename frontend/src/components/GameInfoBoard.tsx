import "../App.css";

const GameInfoBoard = () => {
  return (
    <div className="info-board">
      <h1>Gold Rush Hackathon — API Documentation</h1>

      <section>
        <p>
          Make <strong>API calls</strong> to navigate the hidden board and find
          gold. You can't see the full board, but API responses will show your
          current coordinates and surroundings.
        </p>
        <p>
          You can use <strong>any programming language</strong>,{" "}
          <strong>Postman</strong>, or the <strong>Swagger UI</strong> to
          interact with the API. The winner is the player who collects the most
          gold in the shortest time.
        </p>
      </section>

      <section>
        <h2>Entities</h2>
        <ul>
          <li>
            <strong>Gold (G) 💰:</strong> collect it to score points.
          </li>
          <li>
            <strong>Spiders (S) 🕷️:</strong> touching a spider teleports you to
            a random location and costs you 1 point.
          </li>
          <li>
            <strong>Mountains (M) ⛰️:</strong> cannot move onto mountains
            (treated as walls).
          </li>
          <li>
            <strong>Players (P):</strong> you can steal gold by moving onto
            another player's tile.
          </li>
        </ul>
      </section>

      <section>
        <h3>Swagger UI</h3>
        <p>
          <a
            href="https://gold-rush.fly.dev/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://gold-rush.fly.dev/docs
          </a>
        </p>

        <h3>Backend URL Endpoint</h3>
        <p>
          <a
            href="https://gold-rush.fly.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://gold-rush.fly.dev
          </a>
        </p>

        <h3>Frontend Scoreboard</h3>
        <p>
          <a
            href="https://gold-rush-frontend.fly.dev/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://gold-rush-frontend.fly.dev/
          </a>
        </p>
      </section>

      <section>
        <h2>How to Play</h2>
        <ol>
          <li>
            Register with <code>/register</code>. (save entityKey from response
            body)
          </li>
          <li>
            Move around the board using <code>/walk</code>.
          </li>
          <li>
            Look around using <code>/look</code>.
          </li>
          <li>Steal from nearby players.</li>
          <li>Collect gold to increase your score.</li>
          <li>Survive spiders and stay active!</li>
        </ol>
      </section>
    </div>
  );
};

export default GameInfoBoard;
