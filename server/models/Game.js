import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  event: {
    type: String,
    default: 'Unknown Event'
  },
  white: {
    type: String,
    required: true
  },
  black: {
    type: String,
    required: true
  },
  date: {
    type: String,
    default: new Date().toISOString().split('T')[0]
  },
  result: {
    type: String,
    enum: ['1-0', '0-1', '1/2-1/2', '*'],
    default: '*'
  },
  pgn: {
    type: String,
    required: true
  },
  pgnHash: {
    type: String,
    required: true,
    index: true 
  },
  moves: {
    type: [String],
    default: []
  },
  annotations: [{
    moveIndex: {
      type: Number,
      required: true
    },
    comment: {
      type: String,
      default: ''
    },
    symbols: {
      type: [String],
      enum: ['!', '!!', '?', '??', '!?', '?!'],
      default: []
    },
    source: {
      type: String,
      enum: ['manual', 'engine'],
      default: 'manual'
    }
  }],
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Game = mongoose.model('Game', gameSchema);

export default Game;

