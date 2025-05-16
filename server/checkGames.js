import mongoose from 'mongoose';
import Game from './models/game.js';
import SignupSchema from './models/loginSignup.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Function to check all games
const checkGames = async () => {
  try {
    // Get all games
    const games = await Game.find({ status: 'forfeited' });
    
    console.log(`Found ${games.length} forfeited games`);
    
    // Check each game
    for (const game of games) {
      console.log(`\nGame ID: ${game._id}`);
      console.log(`Status: ${game.status}`);
      console.log(`Result: ${game.result}`);
      
      // Get player details
      const player1 = await SignupSchema.findById(game.player1_id);
      const player2 = await SignupSchema.findById(game.player2_id);
      
      console.log(`Player 1: ${player1.PlayerName} (${game.player1_id})`);
      console.log(`Player 2: ${player2.PlayerName} (${game.player2_id})`);
      
      // Check winner
      if (game.winner_id) {
        const winner = await SignupSchema.findById(game.winner_id);
        console.log(`Winner: ${winner.PlayerName} (${game.winner_id})`);
        
        // Check if winner is correct based on result
        if (game.result === 'player1_win' && game.winner_id.toString() !== game.player1_id.toString()) {
          console.log('ERROR: Winner ID does not match result (player1_win)');
        } else if (game.result === 'player2_win' && game.winner_id.toString() !== game.player2_id.toString()) {
          console.log('ERROR: Winner ID does not match result (player2_win)');
        }
      } else {
        console.log('No winner set');
      }
    }
    
    console.log('\nCheck complete');
  } catch (error) {
    console.error('Error checking games:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Run the check
checkGames();
