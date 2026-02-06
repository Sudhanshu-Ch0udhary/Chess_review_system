import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AnnotationPanel.css';

const CHESS_SYMBOLS = ['!', '!!', '?', '??', '!?', '?!'];

function AnnotationPanel({ gameId, currentMoveIndex, annotation, engineAnalysis, onAnnotationUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState('');
  const [symbols, setSymbols] = useState([]);
  const { getAuthHeaders } = useAuth();

  
  useEffect(() => {
    if (annotation) {
      setComment(annotation.comment || '');
      setSymbols(annotation.symbols || []);
    } else {
      setComment('');
      setSymbols([]);
    }
    setIsEditing(false);
  }, [annotation, currentMoveIndex]);

  const handleSymbolToggle = (symbol) => {
    setSymbols(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  const handleSave = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(
        `${API_URL}/api/games/${gameId}/annotations/${currentMoveIndex}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ comment, symbols }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save annotation');
      }

      const updatedGame = await response.json();

      // Find the updated annotation for this move
      const updatedAnnotation = updatedGame.annotations.find(
        ann => ann.moveIndex === currentMoveIndex && ann.source === 'manual'
      );

      onAnnotationUpdate(updatedAnnotation);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving annotation:', error);
      alert('Failed to save annotation. Please try again.');
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (annotation) {
      setComment(annotation.comment || '');
      setSymbols(annotation.symbols || []);
    } else {
      setComment('');
      setSymbols([]);
    }
    setIsEditing(false);
  };

  const hasContent = comment.trim() || symbols.length > 0;

  return (
    <div className="annotation-panel">
      <div className="annotation-header">
        <h3>Annotations</h3>
        {!isEditing && (
          <button
            className="edit-button"
            onClick={() => setIsEditing(true)}
            title="Edit annotation"
          >
            ✏️
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="annotation-edit">
          <div className="symbols-section">
            <label>Chess Symbols:</label>
            <div className="symbol-buttons">
              {CHESS_SYMBOLS.map(symbol => (
                <button
                  key={symbol}
                  className={`symbol-button ${symbols.includes(symbol) ? 'active' : ''}`}
                  onClick={() => handleSymbolToggle(symbol)}
                  title={`Toggle ${symbol}`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          <div className="comment-section">
            <label htmlFor="annotation-comment">Comment:</label>
            <textarea
              id="annotation-comment"
              className="annotation-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your analysis or notes for this move..."
              rows={4}
            />
          </div>

          <div className="annotation-actions">
            <button className="save-button" onClick={handleSave}>
              Save
            </button>
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="annotation-display">
          {engineAnalysis && (
            <div className="engine-analysis-section">
              <h4>Engine Analysis</h4>
              <div className={`engine-severity engine-severity-${engineAnalysis.severity}`}>
                {engineAnalysis.severity?.toUpperCase()}
              </div>
              <div className="engine-details">
                <div className="engine-detail-item">
                  <span className="detail-label">Evaluation:</span>
                  <span className={`detail-value ${engineAnalysis.evaluation >= 0 ? 'positive' : 'negative'}`}>
                    {engineAnalysis.evaluation >= 0 ? '+' : ''}{Number(engineAnalysis.evaluation).toFixed(2)}
                  </span>
                </div>
                {engineAnalysis.bestMove && (
                  <div className="engine-detail-item">
                    <span className="detail-label">Best move:</span>
                    <span className="detail-value best-move">{engineAnalysis.bestMove}</span>
                  </div>
                )}
                {engineAnalysis.evalDiff !== 0 && (
                  <div className="engine-detail-item">
                    <span className="detail-label">Eval change:</span>
                    <span className={`detail-value ${engineAnalysis.evalDiff >= 0 ? 'positive' : 'negative'}`}>
                      {engineAnalysis.evalDiff >= 0 ? '+' : ''}{Number(engineAnalysis.evalDiff).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          {hasContent ? (
            <>
              {symbols.length > 0 && (
                <div className="symbols-display">
                  {symbols.map((symbol, idx) => (
                    <span key={idx} className={`symbol symbol-${symbol.replace(/[^a-z]/gi, '')}`}>
                      {symbol}
                    </span>
                  ))}
                </div>
              )}
              {comment && (
                <div className="comment-display">
                  <p>{comment}</p>
                </div>
              )}
            </>
          ) : (
            !engineAnalysis && <p className="no-annotation">No annotation for this move. Click ✏️ to add one.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AnnotationPanel;
