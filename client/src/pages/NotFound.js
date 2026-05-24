// client/src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 40 }}>
    <div style={{ fontSize: 80, marginBottom: 16 }}>🔍</div>
    <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 8 }}>404</h1>
    <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 24 }}>
      The page you're looking for doesn't exist or has been moved.
    </p>
    <div style={{ display: 'flex', gap: 12 }}>
      <Link to="/" style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
        Go Home
      </Link>
      <Link to="/dashboard" style={{ padding: '12px 24px', background: '#1e1e2e', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, border: '1px solid #374151' }}>
        Dashboard
      </Link>
    </div>
  </div>
);

export default NotFound;
