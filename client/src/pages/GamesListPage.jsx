import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './GamesListPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function GamesListPage() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(`${API_URL}/api/games`)

        if (!response.ok) {
          throw new Error('Failed to fetch games')
        }

        const gamesData = await response.json()
        setGames(gamesData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [])

  if (loading) {
    return (
      <div className="games-list-page">
        <p>Loading games...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="games-list-page">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="games-list-page">
      <div className="page-header">
        <h1>My Chess Games</h1>
        <Link to="/games/new" className="btn btn-primary">
          Upload New Game
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="empty-state">
          <h2>No games yet</h2>
          <p>Upload your first chess game to get started!</p>
          <Link to="/games/new" className="btn btn-primary">
            Upload Game
          </Link>
        </div>
      ) : (
        <div className="games-grid">
          {games.map((game) => (
            <Link
              key={game._id}
              to={`/games/${game._id}`}
              className="game-card"
            >
              <div className="game-card-header">
                <h3>{game.event || 'Chess Game'}</h3>
                <span className="game-result">{game.result}</span>
              </div>

              <div className="game-players">
                <div className="player">
                  <span className="player-label">White:</span>
                  <span className="player-name">{game.white}</span>
                </div>
                <div className="player">
                  <span className="player-label">Black:</span>
                  <span className="player-name">{game.black}</span>
                </div>
              </div>

              <div className="game-meta">
                <div className="meta-item">
                  <span className="meta-label">Date:</span>
                  <span className="meta-value">{game.date}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Saved:</span>
                  <span className="meta-value">
                    {new Date(game.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default GamesListPage
