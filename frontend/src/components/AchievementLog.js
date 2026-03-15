import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AchievementLog({ user }) {
  const [achievements, setAchievements] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [selectedKpi, setSelectedKpi] = useState('');
  const [description, setDescription] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState('');

  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

  useEffect(() => {
    axios.get(`http://localhost:8000/kpis/${user.id}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    }).then(res => setKpis(res.data)).catch(() => {});

    axios.get(`http://localhost:8000/achievements/${user.id}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    }).then(res => setAchievements(res.data)).catch(() => {});
  }, [user]);

  const handleSubmit = async () => {
    if (!selectedKpi || !description) { setMessage('Please fill in all fields.'); return; }
    try {
      await axios.post('http://localhost:8000/achievements', {
        kpi_id: parseInt(selectedKpi),
        description, month: parseInt(month), year: parseInt(year)
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      setMessage('Achievement logged successfully!');
      setDescription(''); setSelectedKpi('');
      const res = await axios.get(`http://localhost:8000/achievements/${user.id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAchievements(res.data);
    } catch {
      setMessage('Failed to log achievement. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Achievement Log</h2>
      <p style={styles.sub}>Record your wins and progress against your KPIs every month.</p>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Log a new achievement</h3>
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Month</label>
            <select style={styles.input} value={month} onChange={e => setMonth(e.target.value)}>
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Year</label>
            <select style={styles.input} value={year} onChange={e => setYear(e.target.value)}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>KPI this relates to</label>
          <select style={styles.input} value={selectedKpi} onChange={e => setSelectedKpi(e.target.value)}>
            <option value="">Select a KPI...</option>
            {kpis.map(k => <option key={k.id} value={k.id}>{k.title}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>What did you achieve?</label>
          <textarea style={styles.textarea} value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe your achievement with specific examples and results..." />
        </div>
        {message && <div style={styles.message}>{message}</div>}
        <button style={styles.button} onClick={handleSubmit}>Log achievement</button>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>My achievement history</h3>
        {achievements.length === 0 ? (
          <div style={styles.empty}>No achievements logged yet. Start logging your wins above!</div>
        ) : (
          <div style={styles.list}>
            {achievements.slice().reverse().map(a => (
              <div key={a.id} style={styles.item}>
                <div style={styles.itemMeta}>
                  {months[a.month - 1]} {a.year}
                </div>
                <div style={styles.itemText}>{a.description}</div>
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
  heading: { fontSize: 24, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888', marginBottom: '1.5rem' },
  card: { background: '#fff', border: '1px solid #eee', borderRadius: 10, padding: '1.5rem', marginBottom: '1.5rem' },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: '1.25rem', marginTop: 0 },
  row: { display: 'flex', gap: 16 },
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', minHeight: 100, resize: 'vertical' },
  message: { fontSize: 13, color: '#27ae60', marginBottom: '1rem', padding: '8px 12px', background: '#f0fff4', borderRadius: 6 },
  button: { padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  empty: { fontSize: 14, color: '#aaa', padding: '1rem', background: '#f9f9f9', borderRadius: 8 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  item: { background: '#f9f9f9', borderRadius: 8, padding: '1rem' },
  itemMeta: { fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 },
  itemText: { fontSize: 14, color: '#333', lineHeight: 1.6 },
};

export default AchievementLog;