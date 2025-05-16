import Game from './models/game.js';
import SignupSchema from './models/loginSignup.js';
import { maxAreaOfIsland } from './utils/maxAreaOfIsland.js';

// Store waiting players and active games
const waitingPlayers = new Map();
const activeGames = new Map();

// Colors for players
const COLORS = ['rgb(255, 69, 58)', 'rgb(0, 122, 255)']; // Red, Blue

// Initialize Socket.IO game logic
export const initializeGameLogic = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Handle player looking for a match
        socket.on('find_match', async (data) => {
            try {
                const { userId } = data;

                // Get user details
                const user = await SignupSchema.findById(userId);
                if (!user) {
                    socket.emit('error', { message: 'User not found' });
                    return;
                }

                // Add player to waiting list
                waitingPlayers.set(userId, {
                    socketId: socket.id,
                    user
                });

                console.log(`Player ${user.PlayerName} is looking for a match`);

                // Check if we can match with another player
                matchPlayers(io);
            } catch (error) {
                console.error('Error in find_match:', error);
                socket.emit('error', { message: 'Server error' });
            }
        });

        // Handle player cancelling matchmaking
        socket.on('cancel_match', () => {
            // Find and remove the player from waiting list
            for (const [userId, data] of waitingPlayers.entries()) {
                if (data.socketId === socket.id) {
                    waitingPlayers.delete(userId);
                    console.log(`Player ${data.user.PlayerName} cancelled matchmaking`);
                    break;
                }
            }
        });

        // Handle player joining a game
        socket.on('join_game', async (data) => {
            try {
                const { gameId, userId } = data;

                // Check if game exists
                const game = await Game.findById(gameId);
                if (!game) {
                    socket.emit('error', { message: 'Game not found' });
                    return;
                }

                // Join the game room
                socket.join(gameId);

                // If both players have joined, start the game
                const gameRoom = io.sockets.adapter.rooms.get(gameId);
                if (gameRoom && gameRoom.size === 2) {
                    startGame(io, gameId);
                }
            } catch (error) {
                console.error('Error in join_game:', error);
                socket.emit('error', { message: 'Server error' });
            }
        });

        // Handle player making a move
        socket.on('make_move', async (data) => {
            try {
                const { gameId, userId, cellIndex } = data;

                // Get the game
                const game = await Game.findById(gameId);
                if (!game || game.status !== 'active') {
                    socket.emit('error', { message: 'Invalid game' });
                    return;
                }

                // Check if it's the player's turn
                if (game.current_turn.toString() !== userId) {
                    socket.emit('error', { message: 'Not your turn' });
                    return;
                }

                // Check if the cell is already filled
                if (game.final_grid[cellIndex] !== null) {
                    socket.emit('error', { message: 'Cell already filled' });
                    return;
                }

                // Update the grid
                const updatedGrid = [...game.final_grid];
                updatedGrid[cellIndex] = userId;

                // Determine next player's turn
                const nextTurn = game.current_turn.toString() === game.player1_id.toString()
                    ? game.player2_id
                    : game.player1_id;

                // Update the game
                game.final_grid = updatedGrid;
                game.current_turn = nextTurn;
                await game.save();

                // Emit the move to all players in the game
                io.to(gameId).emit('move_made', {
                    grid: updatedGrid,
                    nextTurn: nextTurn.toString()
                });

                // Check if the game is over
                checkGameEnd(io, game);
            } catch (error) {
                console.error('Error in make_move:', error);
                socket.emit('error', { message: 'Server error' });
            }
        });

        // Handle player forfeiting
        socket.on('forfeit_game', async (data) => {
            try {
                const { gameId, userId } = data;

                // Get the game
                const game = await Game.findById(gameId);
                if (!game || game.status !== 'active') {
                    socket.emit('error', { message: 'Invalid game' });
                    return;
                }

                // Determine winner
                const isPlayer1 = game.player1_id.toString() === userId;
                const winnerId = isPlayer1 ? game.player2_id : game.player1_id;
                const result = isPlayer1 ? 'player2_win' : 'player1_win';

                console.log(`Forfeit: User ${userId} (isPlayer1: ${isPlayer1}) forfeited. Winner: ${winnerId}`);

                // Update game status
                game.status = 'forfeited';
                game.result = result;
                game.winner_id = winnerId;
                await game.save();

                console.log(`Game ${gameId} forfeited by ${isPlayer1 ? 'player1' : 'player2'}. Winner: ${winnerId}`);

                // Update player stats
                await updatePlayerStats(game);

                // Get updated player data
                const player1 = await SignupSchema.findById(game.player1_id);
                const player2 = await SignupSchema.findById(game.player2_id);

                // Convert the 1D grid to a 2D grid for player1 and player2
                const grid1 = Array(5).fill().map(() => Array(5).fill(0));
                const grid2 = Array(5).fill().map(() => Array(5).fill(0));

                // Fill the grids based on player ownership
                for (let i = 0; i < 25; i++) {
                    const row = Math.floor(i / 5);
                    const col = i % 5;

                    if (game.final_grid[i] && game.final_grid[i].toString() === game.player1_id.toString()) {
                        grid1[row][col] = 1;
                    } else if (game.final_grid[i] && game.final_grid[i].toString() === game.player2_id.toString()) {
                        grid2[row][col] = 1;
                    }
                }

                // Calculate the max area for each player using maxAreaOfIsland
                const player1MaxArea = maxAreaOfIsland(JSON.parse(JSON.stringify(grid1)));
                const player2MaxArea = maxAreaOfIsland(JSON.parse(JSON.stringify(grid2)));

                console.log(`Forfeit - Player 1 max area: ${player1MaxArea}, Player 2 max area: ${player2MaxArea}`);

                // Emit game end to all players with their respective results
                io.to(gameId).emit('game_end', {
                    finalGrid: game.final_grid,
                    player1Result: isPlayer1 ? 'lost' : 'won', // If player1 forfeited, they lost; otherwise, they won
                    player2Result: !isPlayer1 ? 'lost' : 'won', // If player2 forfeited, they lost; otherwise, they won
                    player1Id: game.player1_id.toString(),
                    player2Id: game.player2_id.toString(),
                    player1Coins: player1.coins,
                    player2Coins: player2.coins,
                    player1MaxArea: player1MaxArea,
                    player2MaxArea: player2MaxArea,
                    message: 'Game forfeited'
                });

                // Remove game from active games
                activeGames.delete(gameId);
            } catch (error) {
                console.error('Error in forfeit_game:', error);
                socket.emit('error', { message: 'Server error' });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);

            // Remove from waiting players
            for (const [userId, data] of waitingPlayers.entries()) {
                if (data.socketId === socket.id) {
                    waitingPlayers.delete(userId);
                    console.log(`Player ${data.user.PlayerName} removed from waiting list`);
                    break;
                }
            }

            // Handle disconnection from active games
            handleDisconnection(socket.id);
        });
    });
};

// Match waiting players
const matchPlayers = async (io) => {
    if (waitingPlayers.size < 2) return;

    // Get two players from the waiting list
    const players = Array.from(waitingPlayers.entries());
    const player1 = players[0];
    const player2 = players[1];

    // Remove them from waiting list
    waitingPlayers.delete(player1[0]);
    waitingPlayers.delete(player2[0]);

    // Randomly assign colors
    const randomIndex = Math.floor(Math.random() * 2);
    const player1Color = COLORS[randomIndex];
    const player2Color = COLORS[1 - randomIndex];

    // Randomly choose who goes first
    const firstTurn = Math.random() < 0.5 ? player1[0] : player2[0];

    try {
        // Create a new game
        const game = await Game.create({
            player1_id: player1[0],
            player2_id: player2[0],
            player1_color: player1Color,
            player2_color: player2Color,
            current_turn: firstTurn
        });

        // Add game to active games
        activeGames.set(game._id.toString(), {
            player1: player1[1],
            player2: player2[1],
            game
        });

        // Notify both players
        io.to(player1[1].socketId).emit('match_found', {
            gameId: game._id.toString(),
            opponent: {
                _id: player2[0],
                PlayerName: player2[1].user.PlayerName,
                profilePictureUrl: player2[1].user.profilePictureUrl
            }
        });

        io.to(player2[1].socketId).emit('match_found', {
            gameId: game._id.toString(),
            opponent: {
                _id: player1[0],
                PlayerName: player1[1].user.PlayerName,
                profilePictureUrl: player1[1].user.profilePictureUrl
            }
        });

        console.log(`Match created between ${player1[1].user.PlayerName} and ${player2[1].user.PlayerName}`);
    } catch (error) {
        console.error('Error creating match:', error);

        // Put players back in waiting list
        waitingPlayers.set(player1[0], player1[1]);
        waitingPlayers.set(player2[0], player2[1]);

        // Notify players of error
        io.to(player1[1].socketId).emit('error', { message: 'Failed to create match' });
        io.to(player2[1].socketId).emit('error', { message: 'Failed to create match' });
    }
};

// Start a game
const startGame = async (io, gameId) => {
    try {
        const game = await Game.findById(gameId);
        if (!game) return;

        // Get player details
        const player1 = await SignupSchema.findById(game.player1_id);
        const player2 = await SignupSchema.findById(game.player2_id);

        // Get the game data
        const gameData = activeGames.get(gameId);
        if (!gameData) return;

        // Emit game start to player 1
        io.to(gameData.player1.socketId).emit('start_game', {
            firstTurn: game.current_turn.toString(),
            myColor: game.player1_color,
            opponentColor: game.player2_color,
            opponent: {
                _id: player2._id,
                PlayerName: player2.PlayerName,
                profilePictureUrl: player2.profilePictureUrl
            }
        });

        // Emit game start to player 2
        io.to(gameData.player2.socketId).emit('start_game', {
            firstTurn: game.current_turn.toString(),
            myColor: game.player2_color,
            opponentColor: game.player1_color,
            opponent: {
                _id: player1._id,
                PlayerName: player1.PlayerName,
                profilePictureUrl: player1.profilePictureUrl
            }
        });

        console.log(`Game ${gameId} started with colors - Player1: ${game.player1_color}, Player2: ${game.player2_color}`);
    } catch (error) {
        console.error('Error starting game:', error);
    }
};

// Check if the game is over
const checkGameEnd = async (io, game) => {
    // Count filled cells
    const filledCells = game.final_grid.filter(cell => cell !== null).length;

    // If all cells are filled, game is over
    if (filledCells === 25) {
        // Convert the 1D grid to a 2D grid for player1 and player2
        const grid1 = Array(5).fill().map(() => Array(5).fill(0));
        const grid2 = Array(5).fill().map(() => Array(5).fill(0));

        // Fill the grids based on player ownership
        for (let i = 0; i < 25; i++) {
            const row = Math.floor(i / 5);
            const col = i % 5;

            if (game.final_grid[i] && game.final_grid[i].toString() === game.player1_id.toString()) {
                grid1[row][col] = 1;
            } else if (game.final_grid[i] && game.final_grid[i].toString() === game.player2_id.toString()) {
                grid2[row][col] = 1;
            }
        }

        // Calculate the max area for each player using maxAreaOfIsland
        const player1MaxArea = maxAreaOfIsland(JSON.parse(JSON.stringify(grid1)));
        const player2MaxArea = maxAreaOfIsland(JSON.parse(JSON.stringify(grid2)));

        console.log(`Player 1 max area: ${player1MaxArea}, Player 2 max area: ${player2MaxArea}`);

        // Determine winner based on max area
        let result, winnerId;
        if (player1MaxArea > player2MaxArea) {
            result = 'player1_win';
            winnerId = game.player1_id;
        } else if (player2MaxArea > player1MaxArea) {
            result = 'player2_win';
            winnerId = game.player2_id;
        } else {
            result = 'draw';
            winnerId = null;
        }

        // Update game status
        game.status = 'completed';
        game.result = result;
        game.winner_id = winnerId;
        await game.save();

        // Update player stats
        await updatePlayerStats(game);

        // Get updated player data
        const player1 = await SignupSchema.findById(game.player1_id);
        const player2 = await SignupSchema.findById(game.player2_id);

        // Emit game end to both players with their respective results
        // For player 1
        io.to(game._id.toString()).emit('game_end', {
            finalGrid: game.final_grid,
            player1Result: result === 'player1_win' ? 'won' : result === 'player2_win' ? 'lost' : 'draw',
            player2Result: result === 'player2_win' ? 'won' : result === 'player1_win' ? 'lost' : 'draw',
            player1Id: game.player1_id.toString(),
            player2Id: game.player2_id.toString(),
            player1Coins: player1.coins,
            player2Coins: player2.coins,
            player1MaxArea: player1MaxArea,
            player2MaxArea: player2MaxArea
        });

        // Remove game from active games
        activeGames.delete(game._id.toString());

        console.log(`Game ${game._id} ended with result: ${result}`);
    }
};

// Update player stats after game ends
const updatePlayerStats = async (game) => {
    try {
        const player1 = await SignupSchema.findById(game.player1_id);
        const player2 = await SignupSchema.findById(game.player2_id);

        if (!player1 || !player2) return;

        // Update stats based on result
        if (game.result === 'player1_win') {
            // Player 1 wins
            player1.wins += 1;
            player1.coins += 200; // Increased to 200 coins for winner
            player2.losses += 1;
            player2.coins = Math.max(0, player2.coins - 200); // Increased to 200 coins penalty
        } else if (game.result === 'player2_win') {
            // Player 2 wins
            player2.wins += 1;
            player2.coins += 200; // Increased to 200 coins for winner
            player1.losses += 1;
            player1.coins = Math.max(0, player1.coins - 200); // Increased to 200 coins penalty
        } else {
            // Draw
            player1.draws += 1;
            player2.draws += 1;
            player1.coins += 50;
            player2.coins += 50;
        }

        // Save updated stats
        await player1.save();
        await player2.save();

        console.log(`Updated player stats: Player1 coins=${player1.coins}, Player2 coins=${player2.coins}`);
    } catch (error) {
        console.error('Error updating player stats:', error);
    }
};

// Handle player disconnection from active games
const handleDisconnection = async (socketId) => {
    // Check all active games
    for (const [gameId, gameData] of activeGames.entries()) {
        const { player1, player2, game } = gameData;

        // Check if the disconnected socket is one of the players
        if (player1.socketId === socketId || player2.socketId === socketId) {
            try {
                // Determine the forfeiting player
                const forfeitingPlayerId = player1.socketId === socketId
                    ? game.player1_id
                    : game.player2_id;

                // Determine winner
                const winnerId = forfeitingPlayerId.toString() === game.player1_id.toString()
                    ? game.player2_id
                    : game.player1_id;

                const result = forfeitingPlayerId.toString() === game.player1_id.toString()
                    ? 'player2_win'
                    : 'player1_win';

                // Update game status
                game.status = 'forfeited';
                game.result = result;
                game.winner_id = winnerId;
                await game.save();

                // Update player stats
                await updatePlayerStats(game);

                // Get updated player data
                const player1 = await SignupSchema.findById(game.player1_id);
                const player2 = await SignupSchema.findById(game.player2_id);

                // Convert the 1D grid to a 2D grid for player1 and player2
                const grid1 = Array(5).fill().map(() => Array(5).fill(0));
                const grid2 = Array(5).fill().map(() => Array(5).fill(0));

                // Fill the grids based on player ownership
                for (let i = 0; i < 25; i++) {
                    const row = Math.floor(i / 5);
                    const col = i % 5;

                    if (game.final_grid[i] && game.final_grid[i].toString() === game.player1_id.toString()) {
                        grid1[row][col] = 1;
                    } else if (game.final_grid[i] && game.final_grid[i].toString() === game.player2_id.toString()) {
                        grid2[row][col] = 1;
                    }
                }

                // Calculate the max area for each player using maxAreaOfIsland
                const player1MaxArea = maxAreaOfIsland(JSON.parse(JSON.stringify(grid1)));
                const player2MaxArea = maxAreaOfIsland(JSON.parse(JSON.stringify(grid2)));

                console.log(`Disconnect - Player 1 max area: ${player1MaxArea}, Player 2 max area: ${player2MaxArea}`);

                // Emit game end to remaining player
                const io = require('./server.js').io;
                io.to(gameId).emit('game_end', {
                    finalGrid: game.final_grid,
                    player1Result: forfeitingPlayerId.toString() === game.player1_id.toString() ? 'lost' : 'won',
                    player2Result: forfeitingPlayerId.toString() === game.player2_id.toString() ? 'lost' : 'won',
                    player1Id: game.player1_id.toString(),
                    player2Id: game.player2_id.toString(),
                    player1Coins: player1.coins,
                    player2Coins: player2.coins,
                    player1MaxArea: player1MaxArea,
                    player2MaxArea: player2MaxArea,
                    message: 'Opponent disconnected'
                });

                // Remove game from active games
                activeGames.delete(gameId);

                console.log(`Game ${gameId} ended due to player disconnection`);
            } catch (error) {
                console.error('Error handling disconnection:', error);
            }

            break;
        }
    }
};
