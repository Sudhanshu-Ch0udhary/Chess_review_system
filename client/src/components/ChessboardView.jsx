import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessground } from 'chessground';
import './ChessboardView.css';

// Import Chessground assets
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

const ChessboardView = ({ game, currentMoveIndex }) => {
  const boardRef = useRef(null);
  const [api, setApi] = useState(null);
  const [fen, setFen] = useState('start');
  const [lastMove, setLastMove] = useState(null);

  // 1. Calculate Game State (FEN + Last Move)
  useEffect(() => {
    const newGame = new Chess();
    let lastMoveInfo = null;

    if (game && game.moves && Array.isArray(game.moves)) {
      for (let i = 0; i < currentMoveIndex; i++) {
        if (i >= game.moves.length) break;
        try {
          const result = newGame.move(game.moves[i]);
          lastMoveInfo = {
            from: result.from,
            to: result.to
          };
        } catch (error) {
          console.error(`Move ${i + 1} FAILED (${game.moves[i]}):`, error);
          break;
        }
      }
    }

    setFen(newGame.fen());
    setLastMove(lastMoveInfo ? [lastMoveInfo.from, lastMoveInfo.to] : []);
  }, [game, currentMoveIndex]);

  // 2. Initialize Chessground (Run Once)
  useEffect(() => {
    if (boardRef.current && !api) {
      const chessgroundApi = Chessground(boardRef.current, {
        fen: 'start',
        provider: {
          url: "https://lichess.org/media/__"
        },
        viewOnly: true, // Review mode is read-only for board interaction
        animation: {
          enabled: true,
          duration: 200
        },
        highlight: {
          lastMove: true,
          check: true
        }
      });
      setApi(chessgroundApi);
    }

    // Cleanup
    return () => {
      // Chessground doesn't have a strict destroy method exposed easily in this version, 
      // but removing the DOM element handles it. 
      // We leave it to React to unmount the div.
    };
  }, [boardRef]);

  // 3. Update Board on State Change
  useEffect(() => {
    if (api) {
      api.set({
        fen: fen,
        lastMove: lastMove
      });
    }
  }, [fen, lastMove, api]);

  return (
    <div className="chessboard-wrapper">
      {/* Chessground mounts into this div */}
      <div ref={boardRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default ChessboardView;
