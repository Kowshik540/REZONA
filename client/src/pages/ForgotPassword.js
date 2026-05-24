// client/src/pages/ForgotPassword.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email');
    setLoading(true);
    setError('');
    try {
      await api.post('/profile/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🔑</span>
          <h1>Reset Password</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h3 style={{ marginBottom: 8 }}>Check Your Email</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
              If an account exists with {email}, you'll receive a password reset link shortly.
            </p>
            <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
              ← Back to Login
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="error-msg">⚠️ {error}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email" id="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                />
              </div>
              <button type="submit" className="btn-primary full-width" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p className="auth-footer">
              Remember your password? <Link to="/login">Login →</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
