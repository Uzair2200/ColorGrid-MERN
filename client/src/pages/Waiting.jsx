import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import '../../public/css/waiting.css';

function Waiting() {
  const { user, loading } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(true);
  const [opponent, setOpponent] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Emit find_match event when component mounts
    socket.emit('find_match', { userId: user._id });

    // Listen for match found event
    socket.on('match_found', (data) => {
      setOpponent(data.opponent);
      setIsSearching(false);

      // Automatically navigate to game after a short delay
      setTimeout(() => {
        navigate(`/newgame/${data.gameId}`);
      }, 3000);
    });

    // Clean up on unmount
    return () => {
      socket.off('match_found');
      if (isSearching) {
        socket.emit('cancel_match');
      }
    };
  }, [socket, user, navigate, isSearching]);

  const handleCancel = () => {
    if (socket) {
      socket.emit('cancel_match');
    }
    navigate('/home');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Navbar />
      <main className="waiting-container">
        {isSearching ? (
          <>
            <h1 className="waiting-title">Finding Opponent...</h1>
            <p className="waiting-subtitle">Please wait while we match you with another player.</p>
            <button onClick={handleCancel} className="btn btn-secondary">Cancel</button>
          </>
        ) : (
          <>
            <h1 className="waiting-title">Match Found!</h1>
            <div className="opponent-info">
              <img
                src={opponent?.profilePictureUrl || "https://th.bing.com/th/id/OIP.eMLmzmhAqRMxUZad3zXE5QHaHa?rs=1&pid=ImgDetMain"}
                alt="Opponent"
              />
              <p className="opponent-name">{opponent?.PlayerName || 'Opponent'}</p>
            </div>
            <p className="waiting-subtitle">Game is about to start...</p>
          </>
        )}
      </main>
    </>
  );
}

export default Waiting;
