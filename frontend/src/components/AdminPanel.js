import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AdminPanel({ user }) {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [department, setDepartment] = useState('');
  const [message, setMessage] = useState('');

  const roles = ['employee', 'manager', 'hr_admin', 'finance'];
  const departments = ['Engineering', 'Product', 'Design', 'Sales', 'HR', 'Finance', 'Operations'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    axios.get('http://localhost:8000/users', {
      headers: { Authorization: `Bearer ${user.token}` }
    }).then(res => setUsers(res.data)).catch(() => {});
  };

  const handleSubmit = async () => {
    if (!name || !email || !password) { setMessage('Please fill in all required fields.'); return; }
    try {
      await axios.post('http://localhost:8000/users', {
        name, email, password, role, department
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      setMessage(`${name} added successfully!`);
      setName(''); setEmail(''); setPassword(''); setDepartment('');
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to add user.');
    }
  };

  const roleColors = {
    employee: '#e8f4fd',
    manager: '#fef9e7',
    hr_admin: '#eafaf1',
    finance: '#fdf2f8'
  };

  const roleTextColors = {
    employee: '#1a5276',
    manager: '#7d6608',
    hr_admin: '#1e8449',
    finance: '#76448a'
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>HR Admin Panel</h2>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Add new employee</h3>
        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>Full name *</label>
            <input style={styles.input} value={name}
              onChange={e => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email address *</label>
            <input style={styles.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="priya@company.com" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password *</label>
            <input style={styles.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Set initial password" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Department</label>
            <select style={styles.input} value={department}
              onChange={e => setDepartment(e.target.value)}>
              <option value="">Select department...</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <select style={styles.input} value={role} onChange={e => setRole(e.target.value)}>
              {roles.map(r => <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        {message && (
          <div style={{ ...styles.message, background: message.includes('successfully') ? '#f0fff4' : '#fff0f0',
            color: message.includes('successfully') ? '#27ae60' : '#c0392b' }}>
            {message}
          </div>
        )}
        <button style={styles.button} onClick={handleSubmit}>Add employee</button>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>All employees ({users.length})</h3>
        {users.length === 0 ? (
          <div style={styles.empty}>No employees added yet.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Department', 'Role'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.avatar}>
                        {u.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span style={styles.userName}>{u.name}</span>
                    </td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>{u.department || '—'}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.roleBadge,
                        background: roleColors[u.role], color: roleTextColors[u.role] }}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' },
  heading: { fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: '1.5rem' },
  card: { background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: '1.25rem', marginTop: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 },
  field: { marginBottom: '0.5rem' },
  label: { display: 'block', fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' },
  message: { fontSize: 13, padding: '8px 12px', borderRadius: 6, marginBottom: '1rem', marginTop: '0.5rem' },
  button: { padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: '1rem' },
  empty: { fontSize: 14, color: '#aaa', padding: '1rem', background: '#f9f9f9', borderRadius: 8 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #eee', fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '12px', color: '#333', verticalAlign: 'middle', display: 'revert' },
  avatar: { width: 30, height: 30, borderRadius: '50%', background: '#f0f0f0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#555', marginRight: 10, verticalAlign: 'middle' },
  userName: { verticalAlign: 'middle' },
  roleBadge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
};

export default AdminPanel;