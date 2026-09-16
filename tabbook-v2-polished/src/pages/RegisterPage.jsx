import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <p className="eyebrow">Join tabbook</p>
      <h2>Make room for good food.</h2>
      <p className="lede">Book tables as a diner, or list your restaurant as an owner.</p>
      <form onSubmit={handleSubmit}>
        <input
          className="field"
          placeholder="Full name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="field"
          type="email"
          placeholder="Email address"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="field"
          type="password"
          placeholder="Password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="role-toggle">
          {['CUSTOMER', 'OWNER'].map((role) => (
            <button
              type="button"
              key={role}
              className={form.role === role ? 'selected' : ''}
              onClick={() => setForm({ ...form, role })}
            >
              {role === 'CUSTOMER' ? 'Diner' : 'Restaurant owner'}
            </button>
          ))}
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
