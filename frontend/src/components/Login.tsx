import { useState } from "react";

type Props = {
  onAdminLogin: (password: string) => void;
  onUserLogin: (entityKey: string) => void;
};

export default function Login({ onAdminLogin, onUserLogin }: Props) {
  const [mode, setMode] = useState<"admin" | "user">("admin");
  const [inputPassword, setInputPassword] = useState("");
  const [inputEntityKey, setInputEntityKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (mode === "admin") {
      if (!inputPassword.trim()) {
        setError("Password required");
        return;
      }
      onAdminLogin(inputPassword);
    } else {
      if (!inputEntityKey.trim()) {
        setError("Entity key required");
        return;
      }
      onUserLogin(inputEntityKey);
    }
  };

  return (
    <div className="login">
      <h2>Select Mode</h2>
      <label>
        <input
          type="radio"
          name="mode"
          value="admin"
          checked={mode === "admin"}
          onChange={() => setMode("admin")}
        />
        Admin
      </label>
      <label style={{ marginLeft: "1rem" }}>
        <input
          type="radio"
          name="mode"
          value="user"
          checked={mode === "user"}
          onChange={() => setMode("user")}
        />
        Hackathon User
      </label>

      <div style={{ marginTop: "1rem" }}>
        {mode === "admin" ? (
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            placeholder="Admin password"
          />
        ) : (
          <input
            type="text"
            value={inputEntityKey}
            onChange={(e) => setInputEntityKey(e.target.value)}
            placeholder="Enter your entity key"
          />
        )}
        <br />
        <button style={{ marginTop: "1rem" }} onClick={handleSubmit}>
          Login
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
