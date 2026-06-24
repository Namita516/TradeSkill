import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Match from './pages/Match';
import LoginSignup from './pages/LoginSignup';
import Chatbox from './pages/Chatbox';
import Workspace from './pages/Workspace';
import Landing from './pages/Landing';

const ProtectedRoute = ({ children }) => {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  return currentUser ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/match" element={<ProtectedRoute><Match /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chatbox /></ProtectedRoute>} />
          <Route path="/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
