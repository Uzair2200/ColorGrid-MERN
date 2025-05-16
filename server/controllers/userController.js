import SignupSchema from '../models/loginSignup.js';
import mongoose from 'mongoose';

// Update player name
export const updatePlayerName = async (req, res) => {
    const { userId } = req.params;
    const { playerName } = req.body;

    if (!playerName || !playerName.trim()) {
        return res.status(400).json({ error: 'Player name is required' });
    }

    try {
        // Check if user exists
        const user = await SignupSchema.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the name is already taken by another user
        const existingUser = await SignupSchema.findOne({
            PlayerName: playerName.trim(),
            _id: { $ne: userId } // Exclude the current user
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // If the name hasn't changed, no need to update
        if (user.PlayerName === playerName.trim()) {
            return res.status(200).json({
                message: 'No changes made',
                user: {
                    _id: user._id,
                    PlayerName: user.PlayerName,
                    profilePictureUrl: user.profilePictureUrl,
                    coins: user.coins,
                    wins: user.wins,
                    losses: user.losses,
                    draws: user.draws
                }
            });
        }

        // Update player name
        user.PlayerName = playerName.trim();
        await user.save();

        console.log(`User ${userId} updated name to: ${playerName}`);

        res.status(200).json({
            message: 'Player name updated successfully',
            user: {
                _id: user._id,
                PlayerName: user.PlayerName,
                profilePictureUrl: user.profilePictureUrl,
                coins: user.coins,
                wins: user.wins,
                losses: user.losses,
                draws: user.draws
            }
        });
    } catch (error) {
        console.error('Error updating player name:', error);
        if (error.code === 11000) {
            // MongoDB duplicate key error
            return res.status(400).json({ error: 'Username already taken' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};
