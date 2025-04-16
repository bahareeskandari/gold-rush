import { UserData } from '../model'

type Props = {
  userData: UserData | null
  entityKey: string
  onLogout: () => void
}

export default function HackathonUserView({
  userData,
  entityKey,
  onLogout,
}: Props) {
  if (!userData) {
    return (
      <div className="user-dashboard">
        <h2>Loading player data...</h2>
      </div>
    )
  }

  return (
    <div className="user-dashboard">
      <h2>
        Welcome, <span style={{ fontWeight: 500 }}>{userData.name}</span>{' '}
        {userData.emoji}
      </h2>
      <div className="user-card">
        <p>
          <strong>Gold:</strong> {userData.gold}
        </p>
        <p>
          <strong>Theft:</strong> {userData.theft}
          {userData.theft < -3 && ' 🥴'}
          {userData.theft < 0 && userData.theft >= -3 && ' 😬'}
          {userData.theft === 0 && ' 😐'}
          {userData.theft > 0 && userData.theft <= 3 && ' 😎'}
          {userData.theft > 3 && ' 🥷'}
        </p>
        <p>
          <strong>Coordinates:</strong> ({userData.coordinates.x},{' '}
          {userData.coordinates.y})
        </p>
        <p>
          <strong>Leaderboard Position:</strong> {userData.position}{' '}
          {userData.position === '1st' && ' 🏆'}
          {userData.position === '2nd' && ' 🥈'}
          {userData.position === '3rd' && ' 🥉'}
        </p>
        <p>
          <strong>Gold left to pick up:</strong> {userData.totalGoldInGame}
        </p>
        <p style={{ fontSize: '0.85rem', color: '#888' }}>
          Entity ID: {entityKey}
        </p>
      </div>
      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  )
}
