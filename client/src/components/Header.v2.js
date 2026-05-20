// client/src/components/Header.js
// PRODUCTION GRADE — Enterprise navigation header with accessibility

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.v2.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="header" role="banner">
      <nav className="nav" role="navigation" aria-label="Main navigation">
        {/* Logo / Home Link */}
        <Link
          to="/"
          className="logo"
          aria-label="Rezona - Resume ATS Checker"
        >
          <span className="logo-icon" aria-hidden="true">
            ⚡
          </span>
          <span>Rezona</span>
        </Link>

        {/* Navigation Links */}
        <div className="nav-links">
          {user ? (
            /* Authenticated User Navigation */
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${
                  location.pathname === '/dashboard' ? 'active' : ''
                }`}
                aria-current={
                  location.pathname === '/dashboard' ? 'page' : undefined
                }
              >
                Dashboard
              </Link>

              <span className="nav-user" role="status" aria-live="polite">
                👋 {user.name || user.email}
              </span>

              <button
                onClick={handleLogout}
                className="btn-logout"
                title="Sign out of your account"
              >
                Logout
              </button>
            </>
          ) : (
            /* Unauthenticated User Navigation */
            <>
              <Link
                to="/login"
                className={`nav-link ${
                  location.pathname === '/login' ? 'active' : ''
                }`}
                aria-current={location.pathname === '/login' ? 'page' : undefined}
              >
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