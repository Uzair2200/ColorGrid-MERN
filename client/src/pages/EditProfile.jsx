import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import '../styles/EditProfile.css';

function EditProfile() {
  const { user, updateUser } = useAuth();
  const [playerName, setPlayerName] = useState('');
  const [password, setPassword] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setPlayerName(user.PlayerName || '');
    setProfilePictureUrl(user.profilePictureUrl || '');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setMessage('Player name cannot be empty');
      setMessageType('error');
      return;
    }

    // Check if any changes were made
    const nameChanged = playerName.trim() !== user.PlayerName;
    const passwordChanged = password.trim() !== '';
    const profilePicChanged = profilePictureUrl !== user.profilePictureUrl;

    if (!nameChanged && !passwordChanged && !profilePicChanged) {
      setMessage('No changes to save');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Create update data object with only the fields that changed
      const updateData = {};
      if (nameChanged) updateData.PlayerName = playerName.trim();
      if (passwordChanged) updateData.password = password.trim();
      if (profilePicChanged) updateData.profilePictureUrl = profilePictureUrl;

      const response = await fetch(`http://localhost:8000/api/users/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the user in context (don't include password in the context)
        updateUser({
          ...(nameChanged && { PlayerName: playerName.trim() }),
          ...(profilePicChanged && { profilePictureUrl: profilePictureUrl })
        });

        setMessage('Profile updated successfully!');
        setMessageType('success');
        setPassword(''); // Clear password field after successful update

        // Navigate back to home after a short delay
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      } else {
        setMessage(data.error || 'Failed to update profile');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('An error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect in AuthContext
  }

  return (
    <>
      <Navbar />
      <main className="edit-profile-container">
        <h1>Edit Profile</h1>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="form-group">
            <label htmlFor="playerName">Player Name</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your player name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password (leave blank to keep current)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profilePictureUrl">Profile Picture URL</label>
            <input
              type="url"
              id="profilePictureUrl"
              value={profilePictureUrl}
              onChange={(e) => setProfilePictureUrl(e.target.value)}
              placeholder="Enter profile picture URL"
            />
            {profilePictureUrl && (
              <div className="profile-preview">
                <img
                  src={profilePictureUrl}
                  alt="Profile Preview"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://th.bing.com/th/id/OIP.eMLmzmhAqRMxUZad3zXE5QHaHa?rs=1&pid=ImgDetMain";
                  }}
                />
              </div>
            )}
          </div>

          {message && <p className={messageType === 'success' ? 'success-message' : 'error-message'}>{message}</p>}

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/home')} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

export default EditProfile;
