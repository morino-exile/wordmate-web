import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../theme/colors';

export default function SettingsPage() {
  const { apiKey, setApiKey } = useStore();
  const { user, login, logout } = useAuth();
  const [inputKey, setInputKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setApiKey(inputKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>設定</h2>

      {/* Google 帳號 */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>帳號</h3>
        {user ? (
          <div style={styles.userRow}>
            <img src={user.photoURL ?? ''} alt="avatar" style={styles.avatar} />
            <div>
              <div style={styles.userName}>{user.displayName}</div>
              <div style={styles.userEmail}>{user.email}</div>
            </div>
            <button onClick={logout} style={styles.btnOutline}>登出</button>
          </div>
        ) : (
          <button onClick={login} style={styles.btnPrimary}>
            使用 Google 登入
          </button>
        )}
      </section>

      {/* API Key */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>API 金鑰</h3>
        <p style={styles.hint}>
          金鑰只存在你的瀏覽器，不會上傳到任何伺服器。
        </p>
        <input
          type="password"
          placeholder="sk-ant-..."
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleSave} style={styles.btnPrimary}>
          {saved ? '已儲存 ✓' : '儲存'}
        </button>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', maxWidth: 480, margin: '0 auto' },
  heading: { color: Colors.text, marginBottom: '1.5rem' },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: '1.25rem',
    marginBottom: '1rem',
  },
  sectionTitle: { color: Colors.text, marginTop: 0, marginBottom: '0.75rem' },
  hint: { color: Colors.textMuted, fontSize: '0.85rem', marginBottom: '0.75rem' },
  userRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: { width: 40, height: 40, borderRadius: '50%' },
  userName: { fontWeight: 600, color: Colors.text },
  userEmail: { fontSize: '0.85rem', color: Colors.textSecondary },
  input: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    borderRadius: 8,
    border: `1px solid ${Colors.surfaceLight}`,
    backgroundColor: Colors.background,
    color: Colors.text,
    fontSize: '0.95rem',
    marginBottom: '0.75rem',
    boxSizing: 'border-box',
  },
  btnPrimary: {
    padding: '0.6rem 1.25rem',
    backgroundColor: Colors.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  btnOutline: {
    marginLeft: 'auto',
    padding: '0.4rem 1rem',
    backgroundColor: 'transparent',
    color: Colors.primary,
    border: `1px solid ${Colors.primary}`,
    borderRadius: 8,
    cursor: 'pointer',
  },
};
