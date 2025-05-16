import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import '../../public/css/history.css';

function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch user's game history
  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/games/history/${user._id}`);

        if (response.ok) {
          const data = await response.json();
          // Sort games by date (most recent first)
          const sortedGames = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
          setGames(sortedGames);
        } else {
          setError('Failed to load game history');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Navbar />
      <main className="history-container">
        <h1 className="history-title">Your Game History</h1>

        {loading ? (
          <p>Loading history...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : games.length === 0 ? (
          <p>You haven't played any games yet.</p>
        ) : (
          <ul className="history-list">
            {games.map(game => (
              <li key={game._id} className={`history-item ${game.result.toLowerCase()}`}>
                <Link to={`/history/${game._id}`}>
                  <div className="game-id">Game #{game._id.substring(0, 6)}</div>
                  <div className="game-result">
                    <span className={`result-badge ${game.result.toLowerCase()}`}>
                      {game.result === 'Won' ? '✓ Won' : game.result === 'Lost' ? '✗ Lost' : '⟳ Draw'}
                    </span>
                    <span className="opponent-name">
                      {game.result === 'Won' ? 'against ' : game.result === 'Lost' ? 'to ' : 'with '}
                      <strong>{game.opponent}</strong>
                    </span>
                    {game.status === 'forfeited' && (
                      <span className="forfeit-tag">
                        {game.result === 'Lost' ? '(You forfeited)' : '(Opponent forfeited)'}
                      </span>
                    )}
                  </div>
                  <div className="game-date">{new Date(game.date).toLocaleDateString()}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

export default History;
