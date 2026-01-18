import { Router } from 'express'
import { getGamebyId, newGameController, getAllGames, updateAnnotation, analyzeGame } from '../controllers/game.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', getAllGames)
router.post('/', newGameController)
router.get('/:id', getGamebyId)
router.patch('/:id/annotations/:moveIndex', updateAnnotation)
router.post('/:id/analyze', analyzeGame)


export default router