import { Router } from 'express'
import { generateReview, getReviewByGame } from '../controllers/review.controller.js'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/:gameId', generateReview)
router.get('/:gameId', getReviewByGame)

export default router