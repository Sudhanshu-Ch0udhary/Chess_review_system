import { Router } from 'express'
import { getGamebyId, newGameController, getAllGames, updateAnnotation } from '../controllers/game.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', getAllGames)
router.post('/', newGameController)
router.get('/:id', getGamebyId)
router.patch('/:id/annotations/:moveIndex', updateAnnotation)


export default router