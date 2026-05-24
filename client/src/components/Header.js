import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/" className="logo" onClick={closeMenu}>
          <span className="logo-icon">⚡</span>
          Rezona
        </Link>

        {/* Hamburger button — mobile only */}
        <button 
          className="nav-hamburger" 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`}>
          {user ? (
            <>
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''} onClick={closeMenu}>
                Dashboard
              </Link>
              <Link to="/cover-letter" className={location.pathname === '/cover-letter' ? 'active' : ''} onClick={closeMenu}>
                Cover Letter
              </Link>
              <Link to="/pricing" className={location.pathname === '/pricing' ? 'active' : ''} onClick={closeMenu}>
                Pricing
              </Link>
              <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''} onClick={closeMenu}>
                👤 {user.name || 'Profile'}
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/pricing" className={location.pathname === '/pricing' ? 'active' : ''} onClick={closeMenu}>
                Pricing
              </Link>
              <Link to="/login" className={location.pathname === '/login' ? 'active' : ''} onClick={closeMenu}>
                Login
              </Link>
              <Link to="/register" className="btn-register" onClick={closeMenu}>
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
