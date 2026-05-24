// client/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPwForm, setShowPwForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/profile');
      setProfile(data.profile);
      setForm({ name: data.profile.name, email: data.profile.email });
    } catch (err) {
      setError('Could not load profile');
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const { data } = await api.put('/profile', form);
      setProfile(prev => ({ ...prev, name: data.user.name, email: data.user.email }));
      setMessage('Profile updated successfully');
      setEditing(false);
      // Update local storage
      const stored = JSON.parse(localStorage.getItem('rezona_user') || '{}');
      localStorage.setItem('rezona_user', JSON.stringify({ ...stored, ...data.user }));
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (pwForm.newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (pwForm.newPassword !== pwForm.confirm) return setError('Passwords do not match');
    try {
      await api.put('/profile/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setMessage('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setShowPwForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Password change failed');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/profile');
      logout();
      navigate('/');
    } catch (err) {
      setError('Account deletion failed');
    }
  };

  if (loading) return <div style={s.page}><p style={{ color: '#94a3b8' }}>Loading profile...</p></div>;

  const planColors = { free: '#6b7280', starter: '#6366f1', pro: '#f59e0b', growth: '#10b981', elite: '#ec4899', exclusive: '#8b5cf6', admin: '#ef4444' };
  const planLabels = { free: 'Free', starter: 'Starter', pro: 'Pro Developer', growth: 'Growth', elite: 'Elite', exclusive: 'Exclusive', admin: 'Admin' };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.title}>Account Settings</h1>

        {message && <div style={s.success}>{message}</div>}
        {error && <div style={s.error}>{error}</div>}

        {/* Profile Card */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Profile Information</h3>
            {!editing && <button style={s.editBtn} onClick={() => setEditing(true)}>Edit</button>}
          </div>
          {editing ? (
            <form onSubmit={handleUpdate}>
              <div style={s.field}>
                <label style={s.label}>Name</label>
                <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Email</label>
                <input style={s.input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" style={s.saveBtn}>Save Changes</button>
                <button type="button" style={s.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div>
              <p style={s.infoRow}><span style={s.infoLabel}>Name:</span> {profile?.name}</p>
              <p style={s.infoRow}><span style={s.infoLabel}>Email:</span> {profile?.email}</p>
              <p style={s.infoRow}><span style={s.infoLabel}>Member since:</span> {new Date(profile?.createdAt).toLocaleDateString()}</p>
              <p style={s.infoRow}><span style={s.infoLabel}>Resumes uploaded:</span> {profile?.resumeCount || 0}</p>
            </div>
          )}
        </div>

        {/* Subscription Card */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Subscription</h3>
            <span style={{ ...s.planBadge, background: planColors[profile?.plan] || '#6b7280' }}>
              {planLabels[profile?.plan] || 'Free'}
            </span>
          </div>
          <div>
            <p style={s.infoRow}>
              <span style={s.infoLabel}>Status:</span>{' '}
              {profile?.subscription?.status === 'active' ? '✅ Active' : '⚪ Inactive'}
            </p>
            {profile?.subscription?.currentPeriodEnd && (
              <p style={s.infoRow}>
                <span style={s.infoLabel}>Renews:</span>{' '}
                {new Date(profile.subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            <p style={s.infoRow}>
              <span style={s.infoLabel}>Scans used:</span>{' '}
              {profile?.usage?.scansThisMonth || 0} this month
            </p>
            <p style={s.infoRow}>
              <span style={s.infoLabel}>Tailors used:</span>{' '}
              {profile?.usage?.tailorsThisMonth || 0} this month
            </p>
          </div>
          {profile?.plan === 'free' && (
            <Link to="/pricing" style={s.upgradeBtn}>Upgrade Plan →</Link>
          )}
        </div>

        {/* Password Card */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Security</h3>
          </div>
          {showPwForm ? (
            <form onSubmit={handlePasswordChange}>
              <div style={s.field}>
                <label style={s.label}>Current Password</label>
                <input style={s.input} type="password" value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>New Password</label>
                <input style={s.input} type="password" value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Confirm New Password</label>
                <input style={s.input} type="password" value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" style={s.saveBtn}>Update Password</button>
                <button type="button" style={s.cancelBtn} onClick={() => setShowPwForm(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button style={s.editBtn} onClick={() => setShowPwForm(true)}>Change Password</button>
          )}
        </div>

        {/* Danger Zone */}
        <div style={{ ...s.card, borderColor: '#7f1d1d' }}>
          <h3 style={{ ...s.cardTitle, color: '#ef4444' }}>Danger Zone</h3>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          {showDeleteConfirm ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button style={s.deleteBtn} onClick={handleDeleteAccount}>Yes, Delete My Account</button>
              <button style={s.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          ) : (
            <button style={{ ...s.editBtn, color: '#ef4444', borderColor: '#7f1d1d' }}
              onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
          )}
        </div>
      </div>
    </div>
  );
};

const s = {
  page: { minHeight: '100vh', background: '#0a0a1a', padding: '40px 20px', color: '#fff' },
  container: { maxWidth: 640, margin: '0 auto' },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 24 },
  card: { background: '#1e1e2e', borderRadius: 12, padding: 24, marginBottom: 20, border: '1px solid #2d2d3d' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#fff' },
  editBtn: { padding: '6px 14px', background: 'transparent', border: '1px solid #4b5563', borderRadius: 6, color: '#94a3b8', fontSize: 13, cursor: 'pointer' },
  saveBtn: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { padding: '10px 20px', background: 'transparent', color: '#94a3b8', border: '1px solid #4b5563', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  deleteBtn: { padding: '10px 20px', background: '#7f1d1d', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  upgradeBtn: { display: 'inline-block', marginTop: 12, padding: '10px 20px', background: '#6366f1', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 },
  field: { marginBottom: 12 },
  label: { display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4, fontWeight: 600 },
  input: { width: '100%', padding: '10px 14px', background: '#0f0f1a', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' },
  infoRow: { fontSize: 14, color: '#cbd5e1', marginBottom: 8 },
  infoLabel: { color: '#94a3b8', fontWeight: 600, marginRight: 8 },
  planBadge: { padding: '4px 12px', borderRadius: 20, color: '#fff', fontSize: 11, fontWeight: 700 },
  success: { background: '#064e3b', color: '#6ee7b7', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  error: { background: '#7f1d1d', color: '#fca5a5', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
};

export default Profile;
