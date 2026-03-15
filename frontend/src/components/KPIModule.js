import React, { useEffect, useState } from 'react';
import axios from 'axios';

function KPIModule({ user }) {
  const [kpis, setKpis] = useState([]);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [message, setMessage] = useState('');

  const kpiLibrary = {
    'Software Engineer': ['Velocity', 'Code Coverage', 'Bug-to-Feature Ratio'],
    'Systems Engineer': ['System Uptime (99.9%)', 'Security Patch Compliance', 'MTTR'],
    'HR / Finance': ['Recruitment TAT', 'Payroll Accuracy', 'Employee Engagement Score'],
  };

  useEffect(() => {
    fetchKPIs();
    if (user.role === 'manager' || user.role === 'hr_admin') {
      axios.get('http://localhost:8000/users', {
        headers: { Authorization: `Bearer ${user.token}` }
      }).then(res => setUsers(res.data.filter(u => u.role === 'employee'))).catch(() => {});
    }
  }, [user]);

  const fetchKPIs = () => {
    const empId = user.role === 'employee' ? user.id : selectedEmployee;
    if (!empId) return;
    axios.get(`http://localhost:8000/kpis/${empId}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    }).then(res => setKpis(res.data)).catch(() => {});
  };

  const handleSubmit = async () => {
    if (!title || !selectedEmployee) { setMessage('Please fill in all fields.'); return; }
    try {
      await axios.post('http://localhost:8000/kpis', {
        title, description, employee_id: parseInt(selectedEmployee)
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      setMessage('KPI assigned successfully!');
      setTitle(''); setDescription(''); fetchKPIs();
    } catch {
      setMessage('Failed to assign KPI. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>KPI Management</h2>

      {(user.role === 'manager' || user.role === 'hr_admin') && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Assign a new KPI</h3>
          <div style={styles.field}>
            <label style={styles.label}>Employee</label>
            <select style={styles.input} value={selectedEmployee}
              onChange={e => { setSelectedEmployee(e.target.value); }}>
              <option value="">Select employee...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.department}</option>)}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>KPI title</label>
            <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Code Coverage" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Description (optional)</label>
            <textarea style={styles.textarea} value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the KPI target and measurement criteria..." />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>KPI library — click to use</label>
            <div style={styles.libraryGrid}>
              {Object.entries(kpiLibrary).map(([role, items]) => (
                <div key={role} style={styles.libraryCard}>
                  <div style={styles.libraryRole}>{role}</div>
                  {items.map(item => (
                    <div key={item} style={styles.libraryItem} onClick={() => setTitle(item)}>
                      {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {message && <div style={styles.message}>{message}</div>}
          <button style={styles.button} onClick={handleSubmit}>Assign KPI</button>
        </div>
      )}

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          {user.role === 'employee' ? 'My KPIs' : 'Assigned KPIs'}
        </h3>
        {user.role !== 'employee' && (
          <div style={styles.field}>
            <select style={styles.input} value={selectedEmployee}
              onChange={e => { setSelectedEmployee(e.target.value);
                axios.get(`http://localhost:8000/kpis/${e.target.value}`, {
                  headers: { Authorization: `Bearer ${user.token}` }
                }).then(res => setKpis(res.data)).catch(() => {}); }}>
              <option value="">Select employee to view KPIs...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        )}
        {kpis.length === 0 ? (
          <div style={styles.empty}>No KPIs found.</div>
        ) : (
          <div style={styles.kpiList}>
            {kpis.map((kpi, i) => (
              <div key={kpi.id} style={styles.kpiItem}>
                <div style={styles.kpiNum}>KPI {i + 1}</div>
                <div style={styles.kpiTitle}>{kpi.title}</div>
                {kpi.description && <div style={styles.kpiDesc}>{kpi.description}</div>}
              </div>
            ))}
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
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', minHeight: 80, resize: 'vertical' },
  libraryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 },
  libraryCard: { background: '#f9f9f9', borderRadius: 8, padding: '1rem' },
  libraryRole: { fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase' },
  libraryItem: { fontSize: 13, color: '#1a1a1a', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 4, background: '#fff', border: '1px solid #eee' },
  message: { fontSize: 13, color: '#27ae60', marginBottom: '1rem', padding: '8px 12px', background: '#f0fff4', borderRadius: 6 },
  button: { padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  empty: { fontSize: 14, color: '#aaa', padding: '1rem', background: '#f9f9f9', borderRadius: 8 },
  kpiList: { display: 'flex', flexDirection: 'column', gap: 10 },
  kpiItem: { background: '#f9f9f9', borderRadius: 8, padding: '1rem' },
  kpiNum: { fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 },
  kpiTitle: { fontSize: 15, fontWeight: 500, color: '#1a1a1a' },
  kpiDesc: { fontSize: 13, color: '#666', marginTop: 4 },
};

export default KPIModule;