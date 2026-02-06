import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './NewGamePage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function NewGamePage() {
  const [pgn, setPgn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { getAuthHeaders, logout } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ pgn }),
      })

      if (response.status === 401) {
        logout()
        window.location.href = '/login'
        return
      }

      if (response.status === 409) {
        const errorData = await response.json()
        navigate(`/games/${errorData.existingGame.id}`)
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create game')
      }

      const game = await response.json()
      navigate(`/games/${game._id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="new-game-page">
      <h1>Upload Chess Game</h1>
      <p>Paste your game in PGN format below</p>
      
      <form onSubmit={handleSubmit} className="pgn-form">
        <textarea
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
          placeholder="Paste PGN here...&#10;&#10;Example:&#10;[Event &quot;Casual Game&quot;]&#10;[White &quot;Player 1&quot;]&#10;[Black &quot;Player 2&quot;]&#10;[Result &quot;1-0&quot;]&#10;&#10;1. e4 e5 2. Nf3 Nc6 3. Bb5 ..."
          required
          className="pgn-input"
          rows={15}
        />
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving...' : 'Save Game'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewGamePage

