// Stockfish Worker path - matches file in client/public/
const STOCKFISH_PATH = '/stockfish-17.1-lite-single-03e3232.js'

let engine = null
let ready = false

export function initStockfish(onMessage) {
  if (engine) return Promise.resolve()

  return new Promise((resolve, reject) => {
    try {
      engine = new Worker(STOCKFISH_PATH)

      engine.onmessage = (e) => {
        const msg = e.data

        if (msg === 'readyok') {
          ready = true
          resolve()
        }

        if (onMessage) onMessage(msg)
      }

      engine.onerror = (err) => {
        reject(err)
      }

      engine.postMessage('uci')
      engine.postMessage('isready')
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Analyze a single position and return evaluation + best move
 * @param {string} fen - FEN string
 * @param {number} depth - Search depth
 * @returns {Promise<{evaluation: number, bestMove: string, pv: string[]}>}
 */
export function analyzePosition(fen, depth = 14) {
  return new Promise((resolve, reject) => {
    if (!engine || !ready) {
      return reject(new Error('Engine not ready'))
    }

    let evaluation = 0
    let bestMove = null
    let pv = []
    let resolved = false

    const handler = (msg) => {
      if (typeof msg !== 'string' || resolved) return

      // Parse evaluation (centipawns)
      const scoreMatch = msg.match(/score\s+(?:cp|mate)\s+(-?\d+)/)
      if (scoreMatch && !msg.includes('lowerbound') && !msg.includes('upperbound')) {
        evaluation = parseInt(scoreMatch[1])
      }

      // Parse principal variation
      const pvMatch = msg.match(/pv\s+([^\s]+(?:\s+[^\s]+)*)/)
      if (pvMatch) {
        pv = pvMatch[1].split(' ').filter((m) => m)
      }

      // Parse best move
      if (msg.includes('bestmove')) {
        const m = msg.match(/bestmove\s+(\S+)/)
        if (m) bestMove = m[1]

        resolved = true
        engine.onmessage = null // Remove handler
        resolve({
          evaluation: evaluation / 100,
          bestMove,
          pv
        })
      }
    }

    engine.onmessage = (e) => handler(e.data)

    engine.postMessage('ucinewgame')
    engine.postMessage(`position fen ${fen}`)
    engine.postMessage(`go depth ${depth}`)

    // Timeout
    setTimeout(() => {
      if (!resolved) {
        resolved = true
        engine.postMessage('stop')
        reject(new Error('Analysis timeout'))
      }
    }, 30000)
  })
}

/**
 * Classify move quality based on eval change
 */
function classifyMove(evalDiff, isBestMove) {
  if (isBestMove) return 'best'
  const absDiff = Math.abs(evalDiff)
  if (absDiff < 0.3) return 'good'
  if (absDiff < 0.8) return 'inaccuracy'
  if (absDiff < 1.5) return 'mistake'
  return 'blunder'
}

/**
 * Analyze entire game move by move
 * @param {string[]} moves - SAN moves
 * @returns {Promise<Array<{moveIndex, move, evaluation, bestMove, evalDiff, severity, pv}>>}
 */
export async function analyzeGame(moves) {
  const { Chess } = await import('chess.js')
  const chess = new Chess()
  const analyses = []

  await initStockfish()

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    const fenBefore = chess.fen()

    try {
      const analysis = await analyzePosition(fenBefore, 14)
      chess.move(move)
      const fenAfter = chess.fen()
      const analysisAfter = await analyzePosition(fenAfter, 14)

      const evalDiff = analysisAfter.evaluation - analysis.evaluation
      const playedMove = move
      const bestSan = analysis.bestMove ? await uciToSanAsync(analysis.bestMove, fenBefore) : null
      const isBest = bestSan && playedMove === bestSan
      const severity = classifyMove(evalDiff, isBest)

      analyses.push({
        moveIndex: i,
        move: playedMove,
        evaluation: analysisAfter.evaluation,
        bestMove: bestSan,
        evalDiff,
        severity,
        pv: analysisAfter.pv || []
      })
    } catch (err) {
      console.error(`Error analyzing move ${i}:`, err)
      analyses.push({
        moveIndex: i,
        move,
        evaluation: 0,
        bestMove: null,
        evalDiff: 0,
        severity: 'unknown',
        pv: []
      })
    }
  }

  return analyses
}

async function uciToSanAsync(uci, fen) {
  if (!uci || uci.length < 4) return null
  try {
    const { Chess } = await import('chess.js')
    const chess = new Chess(fen)
    const from = uci.slice(0, 2)
    const to = uci.slice(2, 4)
    const promo = uci.length > 4 ? uci[4] : null
    const m = chess.move({ from, to, promotion: promo })
    return m ? m.san : null
  } catch {
    return null
  }
}

export function stopStockfish() {
  if (engine) {
    engine.terminate()
    engine = null
    ready = false
  }
}

export function isReady() {
  return !!engine && ready
}
