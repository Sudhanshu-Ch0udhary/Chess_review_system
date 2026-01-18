import { Chess } from 'chess.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

/**
 * Engine Service for analyzing chess positions
 * Uses Stockfish to evaluate positions and find best moves
 */
class EngineService {
  constructor() {
    this.engine = null;
    this.isInitialized = false;
    this.messageQueue = [];
    this.currentCallback = null;
  }

  /**
   * Initialize the Stockfish engine using child_process
   */
  async initialize() {
    if (this.isInitialized && this.engine) {
      return true;
    }

    try {
      // Get the path to stockfish package
      const stockfishPackagePath = join(__dirname, '..', 'node_modules', 'stockfish');
      const stockfishSrcDir = join(stockfishPackagePath, 'src');
      
      // Find the stockfish.js file (it has a versioned name)
      const files = readdirSync(stockfishSrcDir);
      const stockfishJsFile = files.find(f => f.startsWith('stockfish-') && f.endsWith('.js') && !f.includes('worker') && !f.includes('lite') && !f.includes('single'));
      
      if (!stockfishJsFile) {
        throw new Error('Could not find stockfish.js file');
      }
      
      const stockfishJsPath = join(stockfishSrcDir, stockfishJsFile);

      // Spawn Stockfish as a child process
      this.engine = spawn('node', [
        '--experimental-wasm-threads',
        '--experimental-wasm-simd',
        stockfishJsPath
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let buffer = '';
      
      // Handle stdout
      this.engine.stdout.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.forEach(line => this.handleMessage(line.trim()));
      });

      // Handle stderr (Stockfish also outputs to stderr)
      this.engine.stderr.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.forEach(line => this.handleMessage(line.trim()));
      });

      this.engine.on('error', (error) => {
        console.error('Stockfish process error:', error);
      });

      this.engine.on('exit', (code) => {
        if (code !== null && code !== 0) {
          console.error(`Stockfish process exited with code ${code}`);
        }
        this.isInitialized = false;
      });

      // Initialize UCI
      this.sendCommand('uci');
      
      // Wait for uciok
      await this.waitForUciOk();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
      this.isInitialized = false;
      // Don't throw - allow fallback
      return false;
    }
  }

  /**
   * Send a command to the engine
   */
  sendCommand(cmd) {
    if (this.engine && this.engine.stdin && !this.engine.stdin.destroyed) {
      this.engine.stdin.write(cmd + '\n');
    }
  }

  /**
   * Handle messages from the engine
   */
  handleMessage(line) {
    if (!line) return;

    // Handle UCI initialization
    if (line === 'uciok') {
      this.uciReady = true;
    }

    // Call the current callback if set
    if (this.currentCallback) {
      this.currentCallback(line);
    }
  }

  /**
   * Wait for UCI to be ready
   */
  async waitForUciOk(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (this.uciReady) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (this.uciReady) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('UCI initialization timeout'));
        }
      }, 100);
    });
  }

  /**
   * Analyze a position and return evaluation
   * @param {string} fen - FEN string of the position
   * @param {Object} options - Analysis options (depth, time, etc.)
   * @returns {Promise<Object>} Analysis result with eval, bestMove, etc.
   */
  async analyzePosition(fen, options = {}) {
    const depth = options.depth || 15;
    const movetime = options.movetime || 2000; // milliseconds

    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return this.fallbackAnalysis(fen);
      }
    }

    if (!this.engine || this.engine.killed) {
      return this.fallbackAnalysis(fen);
    }

    return new Promise((resolve, reject) => {
      let bestMove = null;
      let evaluation = 0;
      let pv = [];
      let depthReached = 0;
      let resolved = false;

      const messageHandler = (line) => {
        if (!line || resolved) return;

        // Parse depth info
        const depthMatch = line.match(/depth\s+(\d+)/);
        if (depthMatch) {
          depthReached = Math.max(depthReached, parseInt(depthMatch[1]));
        }

        // Parse evaluation (centipawns)
        const scoreMatch = line.match(/score\s+(?:cp|mate)\s+(-?\d+)/);
        if (scoreMatch && !line.includes('lowerbound') && !line.includes('upperbound')) {
          evaluation = parseInt(scoreMatch[1]);
        }

        // Parse principal variation
        const pvMatch = line.match(/pv\s+([^\s]+(?:\s+[^\s]+)*)/);
        if (pvMatch) {
          pv = pvMatch[1].split(' ').filter(m => m);
        }

        // Parse best move
        if (line.includes('bestmove')) {
          const bestMoveMatch = line.match(/bestmove\s+(\S+)/);
          if (bestMoveMatch) {
            bestMove = bestMoveMatch[1];
          }
          
          if (!resolved) {
            resolved = true;
            this.currentCallback = null;
            
            // Convert UCI move to SAN if possible
            let bestMoveSan = bestMove;
            try {
              const chess = new Chess(fen);
              if (bestMove && bestMove.length >= 4) {
                const from = bestMove.substring(0, 2);
                const to = bestMove.substring(2, 4);
                const promotion = bestMove.length > 4 ? bestMove[4] : null;
                const move = chess.move({
                  from: from,
                  to: to,
                  promotion: promotion
                });
                if (move) {
                  bestMoveSan = move.san;
                }
              }
            } catch (e) {
              // Keep UCI notation if conversion fails
            }

            resolve({
              evaluation: evaluation / 100, // Convert centipawns to pawns
              bestMove: bestMoveSan,
              bestMoveUci: bestMove,
              pv: pv,
              depth: depthReached || depth
            });
          }
        }
      };

      // Set the callback
      this.currentCallback = messageHandler;

      // Set timeout
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.currentCallback = null;
          this.sendCommand('stop');
          reject(new Error('Analysis timeout'));
        }
      }, movetime + 5000);

      // Send UCI commands
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth} movetime ${movetime}`);
    });
  }

  /**
   * Fallback analysis using chess.js (basic move validation)
   */
  fallbackAnalysis(fen) {
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    
    if (moves.length === 0) {
      return Promise.resolve({
        evaluation: chess.isCheckmate() ? (chess.turn() === 'w' ? -1000 : 1000) : 0,
        bestMove: null,
        bestMoveUci: null,
        pv: [],
        depth: 0,
        note: 'Fallback analysis - Stockfish not available'
      });
    }

    // Simple heuristic: prefer captures and checks
    const bestMoveObj = moves.reduce((best, move) => {
      const score = (move.captured ? 100 : 0) + (move.san.includes('+') ? 50 : 0);
      return score > best.score ? { move, score } : best;
    }, { move: moves[0], score: 0 });

    return Promise.resolve({
      evaluation: 0,
      bestMove: bestMoveObj.move.san,
      bestMoveUci: null,
      pv: [bestMoveObj.move.san],
      depth: 0,
      note: 'Fallback analysis - Stockfish not available'
    });
  }

  /**
   * Analyze a game move by move
   * @param {string[]} moves - Array of moves in SAN notation
   * @returns {Promise<Array>} Array of analysis results per move
   */
  async analyzeGame(moves) {
    const chess = new Chess();
    const analyses = [];

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      
      // Get position before the move
      const fenBefore = chess.fen();
      
      try {
        // Analyze position before move
        const analysis = await this.analyzePosition(fenBefore, { depth: 15 });
        
        // Make the move
        chess.move(move);
        const fenAfter = chess.fen();
        
        // Analyze position after move
        const analysisAfter = await this.analyzePosition(fenAfter, { depth: 15 });
        
        // Calculate move quality
        const evalDiff = analysisAfter.evaluation - analysis.evaluation;
        const severity = this.classifyMove(evalDiff, analysis.bestMove === move);
        
        analyses.push({
          moveIndex: i,
          move: move,
          evaluation: analysisAfter.evaluation,
          bestMove: analysis.bestMove,
          evalDiff: evalDiff,
          severity: severity,
          pv: analysisAfter.pv || []
        });
      } catch (error) {
        console.error(`Error analyzing move ${i}:`, error);
        analyses.push({
          moveIndex: i,
          move: move,
          evaluation: 0,
          bestMove: null,
          evalDiff: 0,
          severity: 'unknown',
          error: error.message
        });
      }
    }

    return analyses;
  }

  /**
   * Classify move quality based on evaluation difference
   * @param {number} evalDiff - Change in evaluation (in pawns)
   * @param {boolean} isBestMove - Whether the move was the engine's best move
   * @returns {string} Severity classification
   */
  classifyMove(evalDiff, isBestMove) {
    if (isBestMove) {
      return 'best';
    }

    const absDiff = Math.abs(evalDiff);
    
    // Adjust for side to move (negative evalDiff is bad for white, good for black)
    // For simplicity, we'll use absolute value
    if (absDiff < 0.3) {
      return 'good';
    } else if (absDiff < 0.8) {
      return 'inaccuracy';
    } else if (absDiff < 1.5) {
      return 'mistake';
    } else {
      return 'blunder';
    }
  }

  /**
   * Cleanup engine resources
   */
  async cleanup() {
    if (this.engine) {
      try {
        this.sendCommand('quit');
        if (this.engine.kill) {
          this.engine.kill();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    this.engine = null;
    this.isInitialized = false;
    this.uciReady = false;
    this.currentCallback = null;
  }
}

// Export singleton instance
const engineService = new EngineService();
export default engineService;
