type Props = {
  score: number | null
  entityKey: string
  onLogout: () => void
}

export default function HackathonUserView({
  score,
  entityKey,
  onLogout,
}: Props) {
  return (
    <div className="user-dashboard">
      <h2>Welcome Hackathon Hero</h2>
      <p>
        Your current score: <strong>{score ?? '...'}</strong>
      </p>
      <p>Entity ID: {entityKey}</p>
      <button onClick={onLogout}>Logout</button>
    </div>
  )
}
