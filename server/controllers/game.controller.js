import Game from '../models/Game.js'
import { extractPGNTags, extractMovesFromPGN, generatePGNHash } from '../utils/pgnParser.js'

export const newGameController = async (req, res) => {
  try {
    const { pgn, event, white, black, date, result } = req.body

    if (!pgn) {
      return res.status(400).json({ error: 'PGN is required' })
    }

    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const pgnHash = generatePGNHash(pgn)

    const existingGame = await Game.findOne({ pgnHash, ownerId: req.userId })
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
      result: result || pgnTags.result || '*',
      ownerId: req.userId
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
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const game = await Game.findOne({ _id: req.params.id, ownerId: req.userId })

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
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const games = await Game.find({ ownerId: req.userId })
      .select('event white black date result createdAt')
      .sort({ createdAt: -1 })

    res.json(games)
  } catch (error) {
    console.error('Error fetching games:', error)
    res.status(500).json({ error: 'Failed to fetch games' })
  }
}

export const updateAnnotation = async (req, res) => {
  try {
    const { id, moveIndex } = req.params
    const { comment, symbols } = req.body

    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const game = await Game.findOne({ _id: id, ownerId: req.userId })

    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }

    // Validate moveIndex
    const moveIdx = parseInt(moveIndex)
    if (isNaN(moveIdx) || moveIdx < 0 || moveIdx >= game.moves.length) {
      return res.status(400).json({ error: 'Invalid move index' })
    }

    // Find existing annotation for this move
    const existingAnnotationIndex = game.annotations.findIndex(
      ann => ann.moveIndex === moveIdx && ann.source === 'manual'
    )

    if (existingAnnotationIndex !== -1) {
      // Update existing annotation
      game.annotations[existingAnnotationIndex].comment = comment || ''
      game.annotations[existingAnnotationIndex].symbols = symbols || []
      
      // Remove annotation if both comment and symbols are empty
      if (!game.annotations[existingAnnotationIndex].comment && 
          game.annotations[existingAnnotationIndex].symbols.length === 0) {
        game.annotations.splice(existingAnnotationIndex, 1)
      }
    } else {
      // Create new annotation only if there's content
      if (comment || (symbols && symbols.length > 0)) {
        game.annotations.push({
          moveIndex: moveIdx,
          comment: comment || '',
          symbols: symbols || [],
          source: 'manual'
        })
      }
    }

    await game.save()
    res.json(game)
  } catch (error) {
    console.error('Error updating annotation:', error)
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid game ID' })
    }
    res.status(500).json({ error: 'Failed to update annotation' })
  }
}

