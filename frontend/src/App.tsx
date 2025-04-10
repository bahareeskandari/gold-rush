import { useEffect, useState } from 'react'
import './App.css'
import AdminView from './components/AdminView'
import HackathonUserView from './components/HackathonUserView'
import Login from './components/Login'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

function App() {
  const [adminPassword, setAdminPassword] = useState('')
  const [entityKey, setEntityKey] = useState('')
  const [world, setWorld] = useState(null)
  const [score, setScore] = useState<number | null>(null)

  const mode = adminPassword ? 'admin' : entityKey ? 'user' : null

  useEffect(() => {
    if (mode === 'admin') {
      const fetchBoard = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/admin/world`, {
            headers: {
              Authorization: `Bearer ${adminPassword}`,
            },
          })
          if (!res.ok) throw new Error('Failed to fetch board')
          const data = await res.json()
          setWorld(data)
        } catch (err) {
          console.error('Fetch error:', err)
        }
      }

      fetchBoard()
      const interval = setInterval(fetchBoard, 1000)
      return () => clearInterval(interval)
    }
  }, [adminPassword])

  useEffect(() => {
    if (mode === 'user') {
      const fetchScore = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/score?entityKey=${entityKey}`)
          if (!res.ok) throw new Error('Failed to fetch score')
          const data = await res.json()
          setScore(data.score)
        } catch (err) {
          console.error('Score fetch error:', err)
        }
      }

      fetchScore()
      const interval = setInterval(fetchScore, 1000)
      return () => clearInterval(interval)
    }
  }, [entityKey])

  const handleLogout = () => {
    setAdminPassword('')
    setEntityKey('')
    setWorld(null)
    setScore(null)
  }

  if (!mode) {
    return (
      <Login
        onAdminLogin={(pwd) => setAdminPassword(pwd)}
        onUserLogin={(key) => setEntityKey(key)}
      />
    )
  }

  if (mode === 'admin' && world) {
    return <AdminView world={world} onLogout={handleLogout} />
  }

  if (mode === 'user') {
    return (
      <HackathonUserView
        score={score}
        entityKey={entityKey}
        onLogout={handleLogout}
      />
    )
  }

  return null
}

export default App
