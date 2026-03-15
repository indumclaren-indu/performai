import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Appraisal({ user }) {
  const [appraisals, setAppraisals] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selfSummary, setSelfSummary] = useState('');
  const [managerRating, setManagerRating] = useState(3);
  const [nextStep, setNextStep] = useState('');
  const [message, setMessage] = useState('');

  const nextSteps = [
    'Performance Incentive',
    'Salary Increment',
    'Promotion',
    'Retention / PIP'
  ];

  useEffect(() => {
    if (user.role === 'employee') {
      fetchAppraisals(user.id);
    }
    if (user.role === 'manager' || user.role === 'hr_admin') {
      axios.get('http://localhost:8000/users', {
        headers: { Authorization: `Bearer ${user.token}` }
      }).then(res => setUsers(res.data.filter(u => u.role === 'employee'))).catch(() => {});
    }
  }, [user]);

  const fetchAppraisals = (empId) => {
    axios.get(`http://localhost:8000/appraisals/${empId}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    }).then(res => setAppraisals(res.data)).catch(() => {});
  };

  const handleSelfSubmit = async () => {
    if (!selfSummary) { setMessage('Please write your self-appraisal summary.'); return; }
    try {
      await axios.post('http://localhost:8000/appraisals', {
        employee_id: user.id,
        cycle_year: new Date().getFullYear(),
        self_summary: selfSummary
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      setMessage('Self-appraisal submitted successfully!');
      setSelfSummary('');
      fetchAppraisals(user.id);
    } catch {
      setMessage('Failed to submit. Please try again.');
    }
  };

  const handleManagerSubmit = async () => {
    if (!selectedEmployee || !nextStep) { setMessage('Please fill in all fields.'); return; }
    try {
      await axios.post('http://localhost:8000/appraisals', {
        employee_id: parseInt(selectedEmployee),
        cycle_year: new Date().getFullYear(),
        manager_rating: parseInt(managerRating),
        next_step: nextStep
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      setMessage('Appraisal recommendation submitted successfully!');
      setNextStep(''); setSelectedEmployee('');
    } catch {
      setMessage('Failed to submit. Please try again.');
    }
  };

  const ratingLabels = { 1: 'Needs improvement', 2: 'Below expectations',
    3: 'Meets expectations', 4: 'Exceeds expectations', 5: 'Outstanding' };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Annual Appraisal</h2>

      {user.role === 'employee' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Submit self-appraisal</h3>
          <p style={styles.hint}>Review your achievements over the past year and write a summary of your contributions, growth, and goals.</p>
          <div style={styles.field}>
            <label style={styles.label}>Your self-appraisal summary</label>
            <textarea style={styles.textarea} value={selfSummary}
              onChange={e => setSelfSummary(e.target.value)}
              placeholder="Reflect on your KPI achievements, key contributions, challenges overcome, and goals for the next cycle..." />
          </div>
          {message && <div style={styles.message}>{message}</div>}
          <button style={styles.button} onClick={handleSelfSubmit}>Submit self-appraisal</button>
        </div>
      )}

      {(user.role === 'manager' || user.role === 'hr_admin') && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Submit manager recommendation</h3>
          <div style={styles.field}>
            <label style={styles.label}>Employee</label>
            <select style={styles.input} value={selectedEmployee}
              onChange={e => { setSelectedEmployee(e.target.value); fetchAppraisals(e.target.value); }}>
              <option value="">Select employee...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.department}</option>)}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Overall rating — {ratingLabels[managerRating]}</label>
            <input type="range" min="1" max="5" value={managerRating}
              onChange={e => setManagerRating(e.target.value)} style={{ width: '100%' }} />
            <div style={styles.ratingRow}>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{ ...styles.ratingDot, background: n <= managerRating ? '#1a1a1a' : '#ddd' }} />
              ))}
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Recommended next step</label>
            <div style={styles.nextStepGrid}>
              {nextSteps.map(ns => (
                <div key={ns} style={{ ...styles.nextStepBtn, background: nextStep === ns ? '#1a1a1a' : '#f9f9f9',
                  color: nextStep === ns ? '#fff' : '#1a1a1a', border: `1px solid ${nextStep === ns ? '#1a1a1a' : '#eee'}` }}
                  onClick={() => setNextStep(ns)}>
                  {ns}
                </div>
              ))}
            </div>
          </div>
          {message && <div style={styles.message}>{message}</div>}
          <button style={styles.button} onClick={handleManagerSubmit}>Submit recommendation</button>
        </div>
      )}

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Appraisal history</h3>
        {appraisals.length === 0 ? (
          <div style={styles.empty}>No appraisals found yet.</div>
        ) : (
          <div style={styles.list}>
            {appraisals.map(a => (
              <div key={a.id} style={styles.item}>
                <div style={styles.itemMeta}>Cycle year: {a.cycle_year}</div>
                {a.self_summary && <div style={styles.itemSection}><strong>Self-appraisal:</strong> {a.self_summary}</div>}
                {a.manager_rating && <div style={styles.itemSection}><strong>Manager rating:</strong> {ratingLabels[a.manager_rating]}</div>}
                {a.next_step && <div style={styles.nextStepTag}>{a.next_step}</div>}
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
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: '1rem', marginTop: 0 },
  hint: { fontSize: 13, color: '#888', marginBottom: '1.25rem', lineHeight: 1.6 },
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', minHeight: 120, resize: 'vertical' },
  ratingRow: { display: 'flex', gap: 8, marginTop: 8 },
  ratingDot: { width: 12, height: 12, borderRadius: '50%', display: 'inline-block' },
  nextStepGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 },
  nextStepBtn: { padding: '12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'center' },
  message: { fontSize: 13, color: '#27ae60', marginBottom: '1rem', padding: '8px 12px', background: '#f0fff4', borderRadius: 6 },
  button: { padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  empty: { fontSize: 14, color: '#aaa', padding: '1rem', background: '#f9f9f9', borderRadius: 8 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  item: { background: '#f9f9f9', borderRadius: 8, padding: '1rem' },
  itemMeta: { fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 },
  itemSection: { fontSize: 14, color: '#333', marginBottom: 6, lineHeight: 1.6 },
  nextStepTag: { display: 'inline-block', padding: '4px 12px', background: '#1a1a1a', color: '#fff', borderRadius: 20, fontSize: 12, marginTop: 4 },
};

export default Appraisal;