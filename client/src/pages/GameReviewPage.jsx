import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import MoveList from '../components/MoveList'
import ChessboardView from '../components/ChessboardView'
import AnnotationPanel from '../components/AnnotationPanel'
import './GameReviewPage.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function GameReviewPage() {
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  const { getAuthHeaders } = useAuth()

  const handleMoveSelect = (moveIndex) => {
    setCurrentMoveIndex(moveIndex)
  }

  const handleAnnotationUpdate = (updatedAnnotation) => {
    // Update the game state with the new annotation
    setGame(prevGame => {
      const newAnnotations = [...(prevGame.annotations || [])]
      const existingIndex = newAnnotations.findIndex(
        ann => ann.moveIndex === currentMoveIndex && ann.source === 'manual'
      )

      if (updatedAnnotation) {
        if (existingIndex !== -1) {
          newAnnotations[existingIndex] = updatedAnnotation
        } else {
          newAnnotations.push(updatedAnnotation)
        }
      } else {
        // Remove annotation if it was deleted
        if (existingIndex !== -1) {
          newAnnotations.splice(existingIndex, 1)
        }
      }

      return { ...prevGame, annotations: newAnnotations }
    })
  }

  // Get current move's annotation
  const getCurrentAnnotation = () => {
    if (!game || !game.annotations) return null
    return game.annotations.find(
      ann => ann.moveIndex === currentMoveIndex && ann.source === 'manual'
    )
  }

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`${API_URL}/api/games/${id}`, {
          headers: getAuthHeaders()
        })

        if (response.status === 401) {
          window.location.href = '/login'
          return
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch game')
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
  }, [id, getAuthHeaders])

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
            annotations={game.annotations || []}
          />
          <AnnotationPanel
            gameId={game._id}
            currentMoveIndex={currentMoveIndex}
            annotation={getCurrentAnnotation()}
            onAnnotationUpdate={handleAnnotationUpdate}
          />
        </div>
      </div>
    </div>
  )
}

export default GameReviewPage
