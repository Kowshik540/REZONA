import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/" className="logo">
          <span className="logo-icon">⚡</span>
          Rezona
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
                Dashboard
              </Link>
              <span className="nav-user">👋 {user.name || user.email}</span>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
                Login
              </Link>
              <Link to="/register" className="btn-register">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
