import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="navbar">
      <Link to="/home" className="nav-logo">🎨 ColorGrid</Link>
      <div className="nav-right">
        <span className="coins">💰 <span id="coinBalance">{user?.coins || 0}</span></span>
        <div className="profile-dropdown">
          <img
            src={user?.profilePictureUrl || "https://th.bing.com/th/id/OIP.eMLmzmhAqRMxUZad3zXE5QHaHa?rs=1&pid=ImgDetMain"}
            alt="Profile"
            className="profile-pic"
          />
          <span className="username">{user?.PlayerName || 'User'}</span>
          <div className="dropdown-menu">
            <Link to="/edit-profile">Edit Profile</Link>
            <Link to="/" onClick={handleLogout}>Logout</Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
