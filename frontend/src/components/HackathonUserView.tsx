type Props = {
  gold: number | null
  entityKey: string
  onLogout: () => void
}

export default function HackathonUserView({
  gold,
  entityKey,
  onLogout,
}: Props) {
  return (
    <div className="user-dashboard">
      <h2>Welcome Hackathon Hero</h2>
      <p>
        Your current score: <strong>{gold ?? '...'}</strong>
      </p>
      <p>Entity ID: {entityKey}</p>
      <button onClick={onLogout}>Logout</button>
    </div>
  )
}
