import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import './index.css';

// Import pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Waiting from './pages/Waiting';
import Game from './pages/Game';
import History from './pages/History';
import HistoryDetail from './pages/HistoryDetail';
import Leaderboard from './pages/Leaderboard';
import EditProfile from './pages/EditProfile';

// Import context
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/home" element={<Home />} />
            <Route path="/newgame/waiting" element={<Waiting />} />
            <Route path="/newgame/:gameId" element={<Game />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:gameId" element={<HistoryDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/edit-profile" element={<EditProfile />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
