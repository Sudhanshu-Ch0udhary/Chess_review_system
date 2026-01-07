import express from 'express'
import cors from 'cors'
import { configDotenv } from 'dotenv'
import mongoose from 'mongoose'
import gamesRouter from './routes/games.js'

configDotenv()

const app = express()
const port = process.env.PORT || 3000
const mongodb_uri = process.env.MONGODB_URI

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: '*' }))

mongoose.connect(mongodb_uri)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  })

app.use('/api/games', gamesRouter);
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Chess Review System API is running',
    timestamp: new Date().toISOString()
  })
})

app.listen(port, () => {
  console.log(`Server running on PORT ${port}!!!`);
})

export default app