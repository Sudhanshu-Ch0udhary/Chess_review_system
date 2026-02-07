import { Router} from 'express'
import { saveAnalysis } from '../controllers/analysis.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.post('/:gameId', saveAnalysis)

export default router