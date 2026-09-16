import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not log in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <p className="eyebrow">Welcome to tabbook</p>
      <h2>Good to see you.</h2>
      <p className="lede">Log in to book a table or manage your restaurant.</p>
      <form onSubmit={handleSubmit}>
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
        {error && <p className="error-text">{error}</p>}
        <button className="primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="switch">
        New to tabbook? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
