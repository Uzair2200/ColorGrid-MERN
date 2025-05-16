import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../../public/css/signup.css';

function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userData = {
        player: username,
        password,
        profilePictureUrl: profilePic || undefined
      };

      const response = await fetch('http://localhost:8000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        login(data);
        navigate('/home');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Signup failed');
      }
    } catch (error) {
      setError('Error connecting to server');
    }
  };

  return (
    <main className="auth-container">
      <h1 className="auth-title">Sign Up</h1>
      {error && <p className="auth-error">{error}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label htmlFor="profilePic">Profile Picture URL (optional)</label>
        <input
          id="profilePic"
          type="url"
          value={profilePic}
          onChange={(e) => setProfilePic(e.target.value)}
        />

        <button type="submit" className="btn btn-primary">Create Account</button>
      </form>
      <p className="auth-footer">
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </main>
  );
}

export default Signup;
