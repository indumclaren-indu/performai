import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard({ user }) {
  const [summary, setSummary] = useState(null);
  const [pulse, setPulse] = useState([]);

  useEffect(() => {
    if (user.role === 'hr_admin' || user.role === 'finance') {
      axios.get('http://localhost:8000/dashboard/summary', {
        headers: { Authorization: `Bearer ${user.token}` }
      }).then(res => setSummary(res.data)).catch(() => {});
    }
    if (user.role === 'employee' || user.role === 'manager') {
      axios.get(`http://localhost:8000/pulse/${user.id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      }).then(res => setPulse(res.data)).catch(() => {});
    }
  }, [user]);

  const pulseLabel = { on_track: '🟢 On Track', needs_attention: '🟡 Needs Attention', at_risk: '🔴 At Risk' };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Welcome back, {user.name}</h2>
      <p style={styles.sub}>Role: {user.role.replace('_', ' ').toUpperCase()}</p>

      {(user.role === 'hr_admin' || user.role === 'finance') && summary && (
        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardVal}>{summary.total_employees}</div>
            <div style={styles.cardLabel}>Total employees</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardVal}>{summary.total_kpis}</div>
            <div style={styles.cardLabel}>Active KPIs</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardVal}>{summary.total_appraisals}</div>
            <div style={styles.cardLabel}>Appraisals completed</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardVal} style={{color: summary.at_risk_count > 0 ? '#e74c3c' : '#27ae60'}}>
              {summary.at_risk_count}
            </div>
            <div style={styles.cardLabel}>At risk employees</div>
          </div>
        </div>
      )}

      {(user.role === 'employee' || user.role === 'manager') && (
        <div>
          <h3 style={styles.sectionTitle}>Monthly pulse history</h3>
          {pulse.length === 0 ? (
            <div style={styles.empty}>No pulse records yet. Your manager will add these monthly.</div>
          ) : (
            <div style={styles.pulseList}>
              {pulse.map(p => (
                <div key={p.id} style={styles.pulseItem}>
                  <div style={styles.pulseMonth}>Month {p.month}/{p.year}</div>
                  <div style={styles.pulseStatus}>{pulseLabel[p.status]}</div>
                  {p.comments && <div style={styles.pulseComment}>{p.comments}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={styles.quickLinks}>
        <h3 style={styles.sectionTitle}>Quick actions</h3>
        <div style={styles.linkGrid}>
          {user.role === 'employee' && (
            <>
              <a href="/achievements" style={styles.quickBtn}>Log achievement</a>
              <a href="/appraisal" style={styles.quickBtn}>View appraisal</a>
              <a href="/kpis" style={styles.quickBtn}>View my KPIs</a>
            </>
          )}
          {user.role === 'manager' && (
            <>
              <a href="/kpis" style={styles.quickBtn}>Manage KPIs</a>
              <a href="/appraisal" style={styles.quickBtn}>Submit appraisal</a>
            </>
          )}
          {user.role === 'hr_admin' && (
            <>
              <a href="/admin" style={styles.quickBtn}>Manage employees</a>
              <a href="/appraisal" style={styles.quickBtn}>View appraisals</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' },
  heading: { fontSize: 24, fontWeight: 600, color: '#1a1a1a', margin: 0 },
  sub: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: '2rem' },
  card: { background: '#f5f5f0', borderRadius: 10, padding: '1.25rem', textAlign: 'center' },
  cardVal: { fontSize: 32, fontWeight: 600, color: '#1a1a1a' },
  cardLabel: { fontSize: 13, color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: '1rem' },
  empty: { fontSize: 14, color: '#aaa', padding: '1rem', background: '#f9f9f9', borderRadius: 8 },
  pulseList: { display: 'flex', flexDirection: 'column', gap: 10 },
  pulseItem: { background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: '1rem' },
  pulseMonth: { fontSize: 13, color: '#888', marginBottom: 4 },
  pulseStatus: { fontSize: 15, fontWeight: 500 },
  pulseComment: { fontSize: 13, color: '#555', marginTop: 6 },
  quickLinks: { marginTop: '2rem' },
  linkGrid: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  quickBtn: {
    padding: '10px 20px', background: '#1a1a1a', color: '#fff',
    borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500
  }
};

export default Dashboard;