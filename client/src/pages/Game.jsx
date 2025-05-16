import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import '../../public/css/gameplay.css';
import '../styles/Game.css';

// Helper function to convert RGB to color name
const getColorName = (rgbColor) => {
  if (!rgbColor) return '';

  // Check if it's red (rgb(255, 69, 58) or similar)
  if (rgbColor.includes('255') && rgbColor.includes('69') && rgbColor.includes('58')) {
    return 'Red';
  }
  // Check if it's blue (rgb(0, 122, 255) or similar)
  else if (rgbColor.includes('0') && rgbColor.includes('122') && rgbColor.includes('255')) {
    return 'Blue';
  }

  return rgbColor; // Return original if not recognized
};

function Game() {
  const { gameId } = useParams();
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [grid, setGrid] = useState(Array(25).fill(null));
  const [currentTurn, setCurrentTurn] = useState(null);
  const [myColor, setMyColor] = useState(null);
  const [opponentColor, setOpponentColor] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [gameStatus, setGameStatus] = useState('active'); // active, ended
  const [result, setResult] = useState(null); // won, lost, draw
  const [statusMessage, setStatusMessage] = useState('');
  const [player1MaxArea, setPlayer1MaxArea] = useState(0);
  const [player2MaxArea, setPlayer2MaxArea] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !user) return;

    // Join the game room
    socket.emit('join_game', { gameId, userId: user._id });

    // Listen for game start event
    socket.on('start_game', (data) => {
      setOpponent(data.opponent);
      setCurrentTurn(data.firstTurn);
      setMyColor(data.myColor);
      setOpponentColor(data.opponentColor);

      if (data.firstTurn === user._id) {
        setStatusMessage('Your turn');
      } else {
        setStatusMessage('Opponent\'s turn');
      }
    });

    // Listen for move made event
    socket.on('move_made', (data) => {
      setGrid(data.grid);
      setCurrentTurn(data.nextTurn);

      if (data.nextTurn === user._id) {
        setStatusMessage('Your turn');
      } else {
        setStatusMessage('Opponent\'s turn');
      }
    });

    // Listen for game end event
    socket.on('game_end', (data) => {
      setGrid(data.finalGrid);
      setGameStatus('ended');

      // Determine the result for this player
      const isPlayer1 = user._id === data.player1Id;
      const myResult = isPlayer1 ? data.player1Result : data.player2Result;
      setResult(myResult);

      // Update user coins
      const myCoins = isPlayer1 ? data.player1Coins : data.player2Coins;
      updateUser({ coins: myCoins });

      // Store territory information if available
      if (data.player1MaxArea !== undefined && data.player2MaxArea !== undefined) {
        setPlayer1MaxArea(data.player1MaxArea);
        setPlayer2MaxArea(data.player2MaxArea);
      }

      // Set status message with territory information
      if (myResult === 'won') {
        const myArea = isPlayer1 ? data.player1MaxArea : data.player2MaxArea;
        const opponentArea = isPlayer1 ? data.player2MaxArea : data.player1MaxArea;
        setStatusMessage(`🎉 You Won (+200 coins) 🎉 Your territory: ${myArea}, Opponent's territory: ${opponentArea}`);
      } else if (myResult === 'lost') {
        const myArea = isPlayer1 ? data.player1MaxArea : data.player2MaxArea;
        const opponentArea = isPlayer1 ? data.player2MaxArea : data.player1MaxArea;
        // Check if player has coins to lose
        const hasCoins = (isPlayer1 ? data.player1Coins : data.player2Coins) > 0;
        setStatusMessage(`😔 You ${hasCoins ? 'Lost (-200 coins)' : 'Lost'} 😔 Your territory: ${myArea}, Opponent's territory: ${opponentArea}`);
      } else {
        setStatusMessage(`🤝 Game ended in a draw! 🤝 Both territories: ${data.player1MaxArea}`);
      }

      // If there's a message (e.g., opponent disconnected), add it to the status
      if (data.message) {
        setStatusMessage(prev => `${prev} (${data.message})`);
      }
    });

    // Clean up on unmount
    return () => {
      socket.off('start_game');
      socket.off('move_made');
      socket.off('game_end');
    };
  }, [socket, user, gameId, updateUser]);

  const handleCellClick = (index) => {
    // Only allow clicks if it's the user's turn and the cell is empty
    if (currentTurn === user._id && grid[index] === null && gameStatus === 'active') {
      // Emit move to server
      socket.emit('make_move', { gameId, userId: user._id, cellIndex: index });
    }
  };

  const handleForfeit = () => {
    if (gameStatus === 'active') {
      socket.emit('forfeit_game', { gameId, userId: user._id });
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Navbar />
      <main className={`game-container ${gameStatus === 'ended' ? 'game-ended' : ''}`}>
        <div className="player-colors-banner">
          <div className="player-color-info">
            <div className="color-box" style={{ backgroundColor: myColor }}></div>
            <div className="color-text">You: {getColorName(myColor)}</div>
          </div>
          <div className="vs-divider">VS</div>
          <div className="player-color-info">
            <div className="color-box" style={{ backgroundColor: opponentColor }}></div>
            <div className="color-text">{opponent?.PlayerName || 'Opponent'}: {getColorName(opponentColor)}</div>
          </div>
        </div>

        <div className="game-info">

          <div className="status-area">
            <p>
              {statusMessage}
              {gameStatus === 'ended' && (
                <span className={`result-badge ${result === 'won' ? 'won' : result === 'lost' ? 'lost' : 'draw'}`}>
                  {result === 'won' ? 'Won' : result === 'lost' ? 'Lost' : 'Draw'}
                </span>
              )}
            </p>
            {gameStatus === 'active' ? (
              <button onClick={handleForfeit} className="btn btn-secondary">Forfeit</button>
            ) : (
              <Link to="/newgame/waiting" className="btn btn-primary">Play Again</Link>
            )}
          </div>
        </div>

        <div className="grid">
          {grid.map((cell, index) => (
            <div
              key={index}
              className="cell"
              style={{
                backgroundColor: cell === user._id
                  ? myColor
                  : cell
                    ? opponentColor
                    : 'transparent',
                cursor: currentTurn === user._id && !cell && gameStatus === 'active'
                  ? 'pointer'
                  : 'default'
              }}
              onClick={() => handleCellClick(index)}
            />
          ))}
        </div>
      </main>
    </>
  );
}

export default Game;
