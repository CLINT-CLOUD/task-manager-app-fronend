import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // ✅ Corrected import
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role || '');
        setLoggedIn(true);
      } catch (err) {
        console.error('Invalid token:', err);
        localStorage.removeItem('token');
        setLoggedIn(false);
      }
    }
  }, []);

  const handleLogin = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role || '');
        setLoggedIn(true);
      } catch (err) {
        console.error('Error decoding token after login:', err);
        setLoggedIn(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
    setUserRole('');
  };

  return (
    <div className="App">
      {!loggedIn ? (
        <Login onLogin={handleLogin} />
      ) : userRole === 'admin' ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
