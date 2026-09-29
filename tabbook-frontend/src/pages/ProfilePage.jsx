import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateStoredUser } = useAuth();

  const [details, setDetails] = useState({ name: '', email: '' });
  const [detailsStatus, setDetailsStatus] = useState({ type: null, message: '' });
  const [savingDetails, setSavingDetails] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState({ type: null, message: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    getProfile().then((p) => setDetails({ name: p.name, email: p.email }));
  }, []);

  async function handleDetailsSubmit(e) {
    e.preventDefault();
    setDetailsStatus({ type: null, message: '' });
    setSavingDetails(true);
    try {
      const updated = await updateProfile({ name: details.name, email: details.email });
      updateStoredUser(updated);
      setDetailsStatus({ type: 'success', message: 'Details updated.' });
    } catch (err) {
      setDetailsStatus({ type: 'error', message: err.response?.data?.error || 'Could not update details' });
    } finally {
      setSavingDetails(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordStatus({ type: null, message: '' });

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordStatus({ type: 'error', message: "New passwords don't match" });
      return;
    }

    setSavingPassword(true);
    try {
      await updateProfile({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStatus({ type: 'success', message: 'Password changed.' });
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.response?.data?.error || 'Could not change password' });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <main className="content" style={{ maxWidth: 560 }}>
      <p className="eyebrow">Your account</p>
      <h1 style={{ fontSize: 40 }}>Profile</h1>

      <div className="panel" style={{ marginBottom: 24 }}>
        <h3>Details</h3>
        <form onSubmit={handleDetailsSubmit}>
          <input
            className="field"
            placeholder="Name"
            required
            value={details.name}
            onChange={(e) => setDetails({ ...details, name: e.target.value })}
          />
          <input
            className="field"
            type="email"
            placeholder="Email"
            required
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
          />
          <p style={{ color: '#6f7872', fontSize: 13, margin: '4px 0 14px' }}>
            Role: {user?.role === 'OWNER' ? 'Restaurant owner' : 'Diner'}
          </p>
          {detailsStatus.message && (
            <p className={detailsStatus.type === 'success' ? 'switch' : 'error-text'}>
              {detailsStatus.message}
            </p>
          )}
          <button className="primary" disabled={savingDetails}>
            {savingDetails ? 'Saving…' : 'Save details'}
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>Change password</h3>
        <form onSubmit={handlePasswordSubmit}>
          <input
            className="field"
            type="password"
            placeholder="Current password"
            required
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
          />
          <input
            className="field"
            type="password"
            placeholder="New password"
            required
            minLength={6}
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
          />
          <input
            className="field"
            type="password"
            placeholder="Confirm new password"
            required
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
          />
          {passwordStatus.message && (
            <p className={passwordStatus.type === 'success' ? 'switch' : 'error-text'}>
              {passwordStatus.message}
            </p>
          )}
          <button className="primary" disabled={savingPassword}>
            {savingPassword ? 'Updating…' : 'Change password'}
          </button>
        </form>
      </div>
    </main>
  );
}
