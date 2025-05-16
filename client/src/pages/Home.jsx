import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import '../../public/css/home.css';

function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Navbar />
      <main className="home-container">
        <h1 className="home-title">Main Dashboard</h1>
        <div className="home-buttons">
          <Link to="/newgame/waiting" className="btn btn-primary">Play</Link>
          <Link to="/leaderboard" className="btn btn-secondary">Leaderboard</Link>
          <Link to="/history" className="btn btn-secondary">History</Link>
        </div>
      </main>
    </>
  );
}

export default Home;
