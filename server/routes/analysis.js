import { Router} from 'express'
import { saveAnalysis, getAnalysisByGame } from '../controllers/analysis.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.post('/:gameId',saveAnalysis)
router.get('/:gameId', getAnalysisByGame)

export default router