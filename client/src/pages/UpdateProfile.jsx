import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import '../public/css/update-profile.css';

function UpdateProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      // Initialize form with current user data
      setUsername(user.PlayerName || '');
      setProfilePic(user.profilePictureUrl || '');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Create an object with only the fields that are being updated
    const updateData = {};
    if (username && username !== user.PlayerName) updateData.PlayerName = username;
    if (password) updateData.password = password;
    if (profilePic !== user.profilePictureUrl) updateData.profilePictureUrl = profilePic;
    
    // Only proceed if there are changes
    if (Object.keys(updateData).length === 0) {
      setError('No changes to update');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setSuccess('Profile updated successfully');
        setPassword(''); // Clear password field after successful update
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Navbar />
      <main className="profile-container">
        <h1 className="profile-title">Update Your Profile</h1>
        
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        
        <form className="profile-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input 
            id="username" 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          
          <label htmlFor="password">New Password (leave blank to keep current)</label>
          <input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <label htmlFor="profilePic">Profile Picture URL</label>
          <input 
            id="profilePic" 
            type="url" 
            value={profilePic}
            onChange={(e) => setProfilePic(e.target.value)}
          />
          
          <div className="form-buttons">
            <button type="submit" className="btn btn-primary">Save Changes</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/home')}>
              Cancel
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

export default UpdateProfile;
