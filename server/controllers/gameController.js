import Game from '../models/game.js';
import SignupSchema from '../models/loginSignup.js';
import mongoose from 'mongoose';

// Get user's game history
export const getGameHistory = async (req, res) => {
    const { userId } = req.params;

    try {
        // Find games where the user was either player1 or player2
        // Only include completed or forfeited games
        const games = await Game.find({
            $or: [
                { player1_id: userId },
                { player2_id: userId }
            ],
            status: { $in: ['completed', 'forfeited'] } // Only completed or forfeited games
        }).sort({ updatedAt: -1 }); // Most recent first

        // Format the response
        const formattedGames = await Promise.all(games.map(async (game) => {
            // Determine if the user was player1 or player2
            const isPlayer1 = game.player1_id.toString() === userId;

            // Get opponent details
            const opponentId = isPlayer1 ? game.player2_id : game.player1_id;
            const opponent = await SignupSchema.findById(opponentId);

            // Determine result from user's perspective
            let result;

            // Check if the game was forfeited
            if (game.status === 'forfeited') {
                console.log(`Game ${game._id} status: ${game.status}, result: ${game.result}`);
                console.log(`User ${userId} is player1: ${isPlayer1}`);
                console.log(`Winner ID: ${game.winner_id}, User ID: ${userId}`);

                // For forfeited games, we need to check the result directly
                if ((isPlayer1 && game.result === 'player2_win') || (!isPlayer1 && game.result === 'player1_win')) {
                    // This user forfeited (lost)
                    result = 'Lost';
                    console.log(`Game ${game._id}: User ${userId} lost by forfeit`);
                } else {
                    // Opponent forfeited (user won)
                    result = 'Won';
                    console.log(`Game ${game._id}: User ${userId} won by forfeit`);
                }
            } else if (game.result === 'draw') {
                result = 'Draw';
            } else if (
                (isPlayer1 && game.result === 'player1_win') ||
                (!isPlayer1 && game.result === 'player2_win')
            ) {
                result = 'Won';
            } else {
                result = 'Lost';
            }

            return {
                _id: game._id,
                opponent: opponent ? opponent.PlayerName : 'Unknown',
                result,
                date: game.updatedAt,
                status: game.status,
                gameResult: game.result,
                winnerId: game.winner_id ? game.winner_id.toString() : null,
                isPlayer1: isPlayer1
            };
        }));

        res.status(200).json(formattedGames);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get details of a specific game
export const getGameDetails = async (req, res) => {
    const { gameId } = req.params;
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Check if the requesting user was part of this game
        const isPlayer1 = game.player1_id.toString() === userId;
        const isPlayer2 = game.player2_id.toString() === userId;

        if (!isPlayer1 && !isPlayer2) {
            return res.status(403).json({ error: 'Not authorized to view this game' });
        }

        // Get opponent details
        const opponentId = isPlayer1 ? game.player2_id : game.player1_id;
        const opponent = await SignupSchema.findById(opponentId);

        // Determine result from user's perspective
        let result;

        // Check if the game was forfeited
        if (game.status === 'forfeited') {
            console.log(`Game detail ${gameId} status: ${game.status}, result: ${game.result}`);
            console.log(`User ${userId} is player1: ${isPlayer1}`);
            console.log(`Winner ID: ${game.winner_id}, User ID: ${userId}`);

            // For forfeited games, we need to check the result directly
            if ((isPlayer1 && game.result === 'player2_win') || (!isPlayer1 && game.result === 'player1_win')) {
                // This user forfeited (lost)
                result = 'lost';
                console.log(`Game ${gameId}: User ${userId} lost by forfeit`);
            } else {
                // Opponent forfeited (user won)
                result = 'won';
                console.log(`Game ${gameId}: User ${userId} won by forfeit`);
            }
        } else if (game.result === 'draw') {
            result = 'draw';
        } else if (
            (isPlayer1 && game.result === 'player1_win') ||
            (!isPlayer1 && game.result === 'player2_win')
        ) {
            result = 'won';
        } else {
            result = 'lost';
        }

        // Format response
        const response = {
            _id: game._id,
            opponent: opponent ? opponent.PlayerName : 'Unknown',
            opponentId: opponentId,
            result,
            finalGrid: game.final_grid,
            myColor: isPlayer1 ? game.player1_color : game.player2_color,
            opponentColor: isPlayer1 ? game.player2_color : game.player1_color,
            date: game.updatedAt,
            status: game.status
        };

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get leaderboard
export const getLeaderboard = async (req, res) => {
    try {
        // Get all users sorted by coins (descending)
        const leaderboard = await SignupSchema.find({})
            .select('PlayerName coins wins losses draws')
            .sort({ coins: -1 });

        res.status(200).json(leaderboard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
