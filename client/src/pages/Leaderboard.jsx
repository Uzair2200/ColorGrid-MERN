import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import '../../public/css/leaderboard.css';

function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch leaderboard data
  useEffect(() => {
    if (!user) return;

    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/leaderboard');

        if (response.ok) {
          const data = await response.json();
          setPlayers(data);
          setFilteredPlayers(data);
        } else {
          setError('Failed to load leaderboard');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPlayers(players);
    } else {
      const filtered = players.filter(player =>
        player.PlayerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlayers(filtered);
    }
  }, [searchTerm, players]);

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Navbar />
      <main className="board-container">
        <h1 className="board-title">Leaderboard</h1>

        <input
          type="text"
          className="search-box"
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {loading ? (
          <p>Loading leaderboard...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : filteredPlayers.length === 0 ? (
          <p>No players found</p>
        ) : (
          <table className="board-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>W/L/D</th>
                <th>Coins</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map(player => (
                <tr key={player._id}>
                  <td>{player.PlayerName}</td>
                  <td>{player.wins}/{player.losses}/{player.draws}</td>
                  <td>{player.coins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}

export default Leaderboard;
