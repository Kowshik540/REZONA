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
              <Link to="/cover-letter" className={location.pathname === '/cover-letter' ? 'active' : ''}>
                Cover Letter
              </Link>
              <Link to="/pricing" className={location.pathname === '/pricing' ? 'active' : ''}>
                Pricing
              </Link>
              <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
                👤 {user.name || 'Profile'}
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/pricing" className={location.pathname === '/pricing' ? 'active' : ''}>
                Pricing
              </Link>
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
