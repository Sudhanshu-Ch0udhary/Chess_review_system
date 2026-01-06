import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import MoveList from '../components/MoveList'
import ChessboardView from '../components/ChessboardView'
import './GameReviewPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function GameReviewPage() {
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)

  const handleMoveSelect = (moveIndex) => {
    setCurrentMoveIndex(moveIndex)
  }

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`${API_URL}/api/games/${id}`)

        if (!response.ok) {
          throw new Error('Failed to fetch game')
        }

        const gameData = await response.json()
        setGame(gameData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchGame()
    }
  }, [id])

  if (loading) {
    return (
      <div className="game-review-page">
        <p>Loading game...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="game-review-page">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="game-review-page">
        <p>Game not found</p>
      </div>
    )
  }

  return (
    <div className="game-review-page">
      <div className="game-review-header">
        <h1>Game Review</h1>
      </div>

      <div className="game-layout">
        <div className="game-main">
          <div className="board-container">
            <ChessboardView
              game={game}
              currentMoveIndex={currentMoveIndex}
            />
          </div>
        </div>

        <div className="game-sidebar">
          <MoveList
            moves={game.moves}
            currentMoveIndex={currentMoveIndex}
            onMoveSelect={handleMoveSelect}
          />
        </div>
      </div>
    </div>
  )
}

export default GameReviewPage
