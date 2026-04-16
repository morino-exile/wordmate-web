import { useStore } from '../store/useStore';
import { Colors } from '../theme/colors';

export default function HomePage() {
  const { todayStudied, streak } = useStore();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>WordMate</h1>
        <p style={styles.subtitle}>今日已學 {todayStudied} 個單字 · 連續 {streak} 天</p>
      </div>

      <div style={styles.cardGrid}>
        <NavCard title="📖 字典查詢" href="/dictionary" color={Colors.primary} />
        <NavCard title="🃏 單字卡" href="/flashcard" color={Colors.secondary} />
        <NavCard title="✏️ 測驗" href="/quiz" color={Colors.accent} />
        <NavCard title="🔴 弱點複習" href="/weak-review" color={Colors.danger} />
      </div>
    </div>
  );
}

function NavCard({ title, href, color }: { title: string; href: string; color: string }) {
  return (
    <a href={href} style={{ ...styles.card, borderColor: color, textDecoration: 'none' }}>
      <span style={{ ...styles.cardTitle, color }}>{title}</span>
    </a>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '2rem',
    maxWidth: 600,
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    color: Colors.text,
    margin: 0,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: '0.5rem',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    backgroundColor: Colors.card,
    borderRadius: 12,
    border: '2px solid',
    cursor: 'pointer',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
  },
};
