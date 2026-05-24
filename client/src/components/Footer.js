// client/src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer style={styles.footer}>
    <div style={styles.container}>
      <div style={styles.grid}>
        <div>
          <h4 style={styles.brand}>⚡ Rezona</h4>
          <p style={styles.desc}>
            AI-powered resume optimization platform. Get higher ATS scores, tailored resumes, and land more interviews.
          </p>
        </div>
        <div>
          <h5 style={styles.heading}>Product</h5>
          <Link to="/dashboard" style={styles.link}>Dashboard</Link>
          <Link to="/cover-letter" style={styles.link}>Cover Letter</Link>
          <Link to="/pricing" style={styles.link}>Pricing</Link>
        </div>
        <div>
          <h5 style={styles.heading}>Account</h5>
          <Link to="/login" style={styles.link}>Login</Link>
          <Link to="/register" style={styles.link}>Sign Up</Link>
          <Link to="/profile" style={styles.link}>Settings</Link>
        </div>
        <div>
          <h5 style={styles.heading}>Support</h5>
          <a href="mailto:support@rezona.app" style={styles.link}>Contact Us</a>
          <span style={styles.link}>Terms of Service</span>
          <span style={styles.link}>Privacy Policy</span>
        </div>
      </div>
      <div style={styles.bottom}>
        <span>© {new Date().getFullYear()} Rezona. All rights reserved.</span>
        <span style={{ color: '#4b5563' }}>Built with ❤️ for job seekers</span>
      </div>
    </div>
  </footer>
);

const styles = {
  footer: { background: '#0f0f1a', borderTop: '1px solid #1e1e2e', padding: '48px 20px 24px', color: '#94a3b8' },
  container: { maxWidth: 1100, margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, marginBottom: 32 },
  brand: { fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 },
  desc: { fontSize: 13, lineHeight: 1.6, color: '#64748b' },
  heading: { fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' },
  link: { display: 'block', fontSize: 13, color: '#94a3b8', textDecoration: 'none', marginBottom: 8, cursor: 'pointer' },
  bottom: { borderTop: '1px solid #1e1e2e', paddingTop: 20, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' },
};

export default Footer;
