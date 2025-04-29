import { useEffect, useState } from "react";
import "./App.css";
import AdminView from "./components/AdminView";
import HackathonUserView from "./components/HackathonUserView";
import Login from "./components/Login";
import { UserData } from "./model";

export const VITE_BACKEND_URL = "https://gold-rush.fly.dev"; //"http://127.0.0.1:8000" in developement mode

function App() {
  const [adminPassword, setAdminPassword] = useState("");
  const [replaying, setReplaying] = useState(false);

  const [entityKey, setEntityKey] = useState("");
  const [world, setWorld] = useState(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [checkingEntityId, setCheckingEntityId] = useState(true);

  const mode = adminPassword ? "admin" : entityKey ? "user" : null;

  // Auto-login via ?entityId=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("entityId");
    if (!fromQuery) {
      setCheckingEntityId(false);
      return;
    }

    const tryEntity = async () => {
      try {
        const res = await fetch(
          `${VITE_BACKEND_URL}/score?entityKey=${fromQuery}`
        );
        if (!res.ok) throw new Error("Invalid or expired entityId");
        const userData: UserData = await res.json();

        setEntityKey(fromQuery);
        setUserData(userData);
      } catch (err) {
        console.warn("Auto-login failed:", err);
      } finally {
        setCheckingEntityId(false);
      }
    };

    tryEntity();
  }, []);

  useEffect(() => {
    if (mode === "admin" && !replaying) {
      const fetchBoard = async () => {
        try {
          const res = await fetch(`${VITE_BACKEND_URL}/admin/world`, {
            headers: {
              Authorization: `Bearer ${adminPassword}`,
            },
          });
          if (!res.ok) throw new Error("Failed to fetch board");
          const data = await res.json();
          setWorld(data);
        } catch (err) {
          console.error("Fetch error:", err);
        }
      };

      fetchBoard();
      const interval = setInterval(fetchBoard, 1000);
      return () => clearInterval(interval);
    }
  }, [adminPassword, replaying]); // <== add replaying to deps

  useEffect(() => {
    if (mode === "user") {
      const fetchStatus = async () => {
        try {
          const res = await fetch(
            `${VITE_BACKEND_URL}/score?entityKey=${entityKey}`
          );
          if (!res.ok) throw new Error("Failed to fetch status");
          console.log("await res", await res);
          const userData = await res.json();
          console.log("userData", userData);
          setUserData(userData);
        } catch (err) {
          console.error("Score fetch error:", err);
        }
      };

      fetchStatus();
      const interval = setInterval(fetchStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [entityKey]);

  const handleLogout = () => {
    setAdminPassword("");
    setEntityKey("");
    setWorld(null);
    setUserData(null);
  };
  const getLogs = async () => {
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/admin/logs`, {
        headers: {
          Authorization: `Bearer ${adminPassword}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      const logs = await res.json();

      setReplaying(true); // stop live updates

      let i = 0;
      const interval = setInterval(() => {
        if (i >= logs.length) {
          clearInterval(interval);
          console.log("Replay finished.");
          return;
        }

        const snapshot = logs[i];
        setWorld(snapshot.board); // <-- this is the key
        i++;
      }, 300); // ~3 fps replay
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const clearLogs = async () => {
    try {
      const res = await fetch(`${VITE_BACKEND_URL}/admin/clear-log`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminPassword}`,
        },
      });
      if (!res.ok) throw new Error("Failed to clear logs");
      console.log("Logs cleared successfully.");
    } catch (err) {
      console.error("Clear logs error:", err);
    }
  };

  // Wait for query string check before showing login
  if (checkingEntityId)
    return <p style={{ textAlign: "center" }}>Loading...</p>;

  if (!mode) {
    return (
      <Login
        onAdminLogin={(pwd) => setAdminPassword(pwd)}
        onUserLogin={(key) => setEntityKey(key)}
      />
    );
  }

  if (mode === "admin" && world) {
    return (
      <AdminView
        world={world}
        onLogout={handleLogout}
        getLogs={getLogs}
        clearLogs={clearLogs}
        replaying={replaying}
        setReplaying={setReplaying}
      />
    );
  }

  if (mode === "user") {
    return (
      <HackathonUserView
        userData={userData}
        entityKey={entityKey}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}

export default App;
