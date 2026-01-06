import Game from '../models/Game.js'
import { extractPGNTags, extractMovesFromPGN, generatePGNHash } from '../utils/pgnParser.js'

export const newGameController = async (req, res) => {
  try {
    const { pgn, event, white, black, date, result } = req.body

    if (!pgn) {
      return res.status(400).json({ error: 'PGN is required' })
    }

    // Generate hash for duplicate detection
    const pgnHash = generatePGNHash(pgn)

    const existingGame = await Game.findOne({ pgnHash })
    if (existingGame) {
      return res.status(409).json({
        error: 'This game has already been saved',
        existingGame: {
          id: existingGame._id,
          event: existingGame.event,
          white: existingGame.white,
          black: existingGame.black,
          date: existingGame.date,
          result: existingGame.result,
          createdAt: existingGame.createdAt
        }
      })
    }

    const pgnTags = extractPGNTags(pgn)
    const moves = extractMovesFromPGN(pgn)

    const game = new Game({
      pgn,
      pgnHash,
      moves,
      event: event || pgnTags.event || 'Unknown Event',
      white: white || pgnTags.white || 'Unknown',
      black: black || pgnTags.black || 'Unknown',
      date: date || pgnTags.date || new Date().toISOString().split('T')[0],
      result: result || pgnTags.result || '*'
    })

    const savedGame = await game.save()
    res.status(201).json(savedGame)
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' })
  }
}

export const getGamebyId = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)

    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }

    res.json(game)
  } catch (error) {
    console.error('Error fetching game:', error)
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid game ID' })
    }
    res.status(500).json({ error: 'Failed to fetch game' })
  }
}

export const getAllGames = async (req, res) => {
  try {
    const games = await Game.find({})
      .select('event white black date result createdAt')
      .sort({ createdAt: -1 })

    res.json(games)
  } catch (error) {
    console.error('Error fetching games:', error)
    res.status(500).json({ error: 'Failed to fetch games' })
  }
}


