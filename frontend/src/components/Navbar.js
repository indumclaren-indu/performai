import React from 'react';

function Navbar({ user, onLogout }) {
  const roleLabels = {
    employee: 'Employee',
    manager: 'Manager',
    hr_admin: 'HR Admin',
    finance: 'Finance & Leadership'
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>PerformAI</div>
      <div style={styles.links}>
        <a href="/" style={styles.link}>Dashboard</a>
        {(user.role === 'employee' || user.role === 'manager') && (
          <a href="/kpis" style={styles.link}>KPIs</a>
        )}
        {user.role === 'employee' && (
          <a href="/achievements" style={styles.link}>Achievements</a>
        )}
        {(user.role === 'employee' || user.role === 'manager') && (
          <a href="/appraisal" style={styles.link}>Appraisal</a>
        )}
        {user.role === 'hr_admin' && (
          <a href="/admin" style={styles.link}>Admin</a>
        )}
      </div>
      <div style={styles.userInfo}>
        <span style={styles.userName}>{user.name}</span>
        <span style={styles.userRole}>{roleLabels[user.role]}</span>
        <button style={styles.logout} onClick={onLogout}>Sign out</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: 56, background: '#1a1a1a',
    color: '#fff', fontFamily: 'sans-serif', position: 'sticky', top: 0, zIndex: 100
  },
  brand: { fontSize: 18, fontWeight: 600, color: '#fff' },
  links: { display: 'flex', gap: '1.5rem' },
  link: { color: '#ccc', textDecoration: 'none', fontSize: 14, fontWeight: 500 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userName: { fontSize: 14, fontWeight: 500 },
  userRole: {
    fontSize: 11, background: '#333', padding: '3px 10px',
    borderRadius: 20, color: '#aaa'
  },
  logout: {
    background: 'none', border: '1px solid #555', color: '#ccc',
    padding: '5px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer'
  }
};

export default Navbar;