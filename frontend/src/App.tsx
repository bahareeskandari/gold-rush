import { useEffect, useState } from 'react'
import './App.css'
import AdminView from './components/AdminView'
import HackathonUserView from './components/HackathonUserView'
import Login from './components/Login'
import { UserData } from './model'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

function App() {
  const [adminPassword, setAdminPassword] = useState('')
  const [entityKey, setEntityKey] = useState('')
  const [world, setWorld] = useState(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [checkingEntityId, setCheckingEntityId] = useState(true)

  const mode = adminPassword ? 'admin' : entityKey ? 'user' : null

  // Auto-login via ?entityId=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('entityId')
    if (!fromQuery) {
      setCheckingEntityId(false)
      return
    }

    const tryEntity = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/score?entityKey=${fromQuery}`)
        if (!res.ok) throw new Error('Invalid or expired entityId')
        const userData: UserData = await res.json()

        setEntityKey(fromQuery)
        setUserData(userData)
      } catch (err) {
        console.warn('Auto-login failed:', err)
      } finally {
        setCheckingEntityId(false)
      }
    }

    tryEntity()
  }, [])

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
      const fetchStatus = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/score?entityKey=${entityKey}`)
          if (!res.ok) throw new Error('Failed to fetch status')
          const userData = await res.json()
          setUserData(userData)
        } catch (err) {
          console.error('Score fetch error:', err)
        }
      }

      fetchStatus()
      const interval = setInterval(fetchStatus, 1000)
      return () => clearInterval(interval)
    }
  }, [entityKey])

  const handleLogout = () => {
    setAdminPassword('')
    setEntityKey('')
    setWorld(null)
    setUserData(null)
  }

  // Wait for query string check before showing login
  if (checkingEntityId) return <p style={{ textAlign: 'center' }}>Loading...</p>

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
        userData={userData}
        entityKey={entityKey}
        onLogout={handleLogout}
      />
    )
  }

  return null
}

export default App
