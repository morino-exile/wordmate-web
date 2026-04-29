import { useState } from 'react';
import { supabase } from '../supabase';
import { Colors } from '../theme/colors';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('帳號或密碼錯誤');
    setLoading(false);
  }

  return (
    <div style={styles.root}>
      <form style={styles.card} onSubmit={handleLogin}>
        <h1 style={styles.title}>個人 OS</h1>
        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="密碼"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.btn} type="submit" disabled={loading}>
          {loading ? '登入中…' : '登入'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.card,
    padding: '2.5rem 2rem',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: 360,
    boxShadow: '0 2px 16px rgba(92,61,46,0.08)',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: Colors.text,
    textAlign: 'center',
    fontWeight: 700,
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: 8,
    border: `1px solid ${Colors.surfaceLight}`,
    fontSize: '1rem',
    color: Colors.text,
    backgroundColor: Colors.surface,
    outline: 'none',
  },
  btn: {
    padding: '0.75rem',
    borderRadius: 8,
    border: 'none',
    backgroundColor: Colors.primary,
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
  error: {
    margin: 0,
    color: Colors.danger,
    fontSize: '0.875rem',
    textAlign: 'center',
  },
};
