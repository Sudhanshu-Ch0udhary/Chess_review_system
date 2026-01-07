import { Router } from 'express'
import { getGamebyId, newGameController, getAllGames, updateAnnotation } from '../controllers/game.controller.js'

const router = Router()

// Get all games (summary)
router.get('/', getAllGames)

// Create a new game from PGN
router.post('/', newGameController)

// Get a single game by ID
router.get('/:id', getGamebyId)

// Update annotation for a specific move
router.patch('/:id/annotations/:moveIndex', updateAnnotation)


export default router