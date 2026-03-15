import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      const response = await axios.post('http://localhost:8000/token', formData);
      onLogin({
        id: response.data.id,
        name: response.data.name,
        role: response.data.role,
        token: response.data.access_token
      });
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <h1 style={styles.logoText}>PerformAI</h1>
          <p style={styles.tagline}>Continuous Performance Management</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f5f5f0', fontFamily: 'sans-serif'
  },
  card: {
    background: '#fff', borderRadius: 12, padding: '2.5rem',
    width: '100%', maxWidth: 400, border: '1px solid #e5e5e0'
  },
  logo: { textAlign: 'center', marginBottom: '2rem' },
  logoText: { fontSize: 28, fontWeight: 600, color: '#1a1a1a', margin: 0 },
  tagline: { fontSize: 14, color: '#888', marginTop: 6 },
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box',
    outline: 'none'
  },
  error: {
    background: '#fff0f0', color: '#c0392b', padding: '10px 12px',
    borderRadius: 8, fontSize: 13, marginBottom: '1rem'
  },
  button: {
    width: '100%', padding: '11px', background: '#1a1a1a', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500,
    cursor: 'pointer'
  }
};

export default Login;
