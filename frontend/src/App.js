import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import KPIModule from './components/KPIModule';
import AchievementLog from './components/AchievementLog';
import Appraisal from './components/Appraisal';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('performai_user') || 'null'));

  const handleLogin = (userData) => {
    localStorage.setItem('performai_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('performai_user');
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/kpis" element={<KPIModule user={user} />} />
          <Route path="/achievements" element={<AchievementLog user={user} />} />
          <Route path="/appraisal" element={<Appraisal user={user} />} />
          {(user.role === 'hr_admin') && <Route path="/admin" element={<AdminPanel user={user} />} />}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;