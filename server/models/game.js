import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
    player1_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SignupSchema',
        required: true
    },
    player2_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SignupSchema',
        required: true
    },
    player1_color: {
        type: String,
        required: true
    },
    player2_color: {
        type: String,
        required: true
    },
    final_grid: {
        type: [mongoose.Schema.Types.Mixed],
        default: Array(25).fill(null)
    },
    result: {
        type: String,
        enum: ['player1_win', 'player2_win', 'draw', 'in_progress'],
        default: 'in_progress'
    },
    winner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SignupSchema',
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'forfeited'],
        default: 'active'
    },
    current_turn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SignupSchema'
    }
}, { timestamps: true });

export default mongoose.model('Game', gameSchema);
