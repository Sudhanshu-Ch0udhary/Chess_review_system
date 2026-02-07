import { Router } from 'express'
import { generateReview } from '../controllers/review.controller.js'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/:gameId', authenticate, generateReview)

export default router