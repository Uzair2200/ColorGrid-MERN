import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import '../../public/css/history-detail.css';
import '../styles/HistoryDetail.css';

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

function HistoryDetail() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch game details
  useEffect(() => {
    if (!user) return;

    const fetchGameDetails = async () => {
      try {
        // Pass userId as a query parameter to get the correct perspective
        const response = await fetch(`http://localhost:8000/api/games/${gameId}?userId=${user._id}`);

        if (response.ok) {
          const data = await response.json();
          setGame(data);
        } else {
          setError('Failed to load game details');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [user, gameId]);

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Navbar />
      <main className="snapshot-container">
        {loading ? (
          <p>Loading game details...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : game ? (
          <div className="game-snapshot">
            <div className="snapshot-header">
              <h1 className="snapshot-title">
                Game #{gameId.substring(0, 6)}
              </h1>
              <div className={`result-banner ${game.result}`}>
                {game.result === 'won' ? '🏆 Victory!' :
                 game.result === 'lost' ? '❌ Defeat' : '🤝 Draw'}
                {game.status === 'forfeited' ? ' (Forfeit)' : ''}
              </div>
            </div>

            <div className="match-details">
              <div className="player-info">
                <div className="player you">
                  <div className="player-color" style={{ backgroundColor: game.myColor }}></div>
                  <div className="player-name">You ({getColorName(game.myColor)})</div>
                </div>
                <div className="vs">VS</div>
                <div className="player opponent">
                  <div className="player-color" style={{ backgroundColor: game.opponentColor }}></div>
                  <div className="player-name">{game.opponent} ({getColorName(game.opponentColor)})</div>
                </div>
              </div>

              {game.status === 'forfeited' && (
                <div className="forfeit-banner">
                  {game.result === 'lost' ? 'You forfeited this match' : 'Opponent forfeited this match'}
                </div>
              )}

              <div className="match-date">
                Played on {new Date(game.date).toLocaleDateString()} at {new Date(game.date).toLocaleTimeString()}
              </div>
            </div>

            <div className="grid-container">
              <h2 className="grid-title">Final Board State</h2>
              <div className="grid">
                {game.finalGrid.map((cell, index) => (
                  <div
                    key={index}
                    className={`cell ${cell === user._id ? 'your-cell' : cell ? 'opponent-cell' : 'empty-cell'}`}
                    style={{
                      backgroundColor: cell === user._id
                        ? game.myColor
                        : cell
                          ? game.opponentColor
                          : 'transparent'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="action-buttons">
              <Link to="/history" className="btn btn-secondary">Back to History</Link>
              <Link to="/newgame/waiting" className="btn btn-primary">Play Again</Link>
            </div>
          </div>
        ) : (
          <p>Game not found</p>
        )}
      </main>
    </>
  );
}

export default HistoryDetail;
