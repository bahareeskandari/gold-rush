// File: src/api.ts
export async function fetchLeaderboard() {
  const res = await fetch('http://localhost:8000/leaderboard')
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json()
}
