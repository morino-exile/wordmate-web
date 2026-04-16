import { type ReactNode } from 'react';
import { Colors } from '../theme/colors';

const NAV_ITEMS = [
  { label: '首頁', href: '/' },
  { label: '字典', href: '/dictionary' },
  { label: '單字卡', href: '/flashcard' },
  { label: '測驗', href: '/quiz' },
  { label: '弱點', href: '/weak-review' },
  { label: '設定', href: '/settings' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const current = window.location.pathname;

  return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{
              ...styles.navItem,
              ...(current === item.href ? styles.navItemActive : {}),
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    backgroundColor: Colors.background,
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    display: 'flex',
    gap: '0.25rem',
    padding: '0.75rem 1rem',
    backgroundColor: Colors.card,
    borderBottom: `1px solid ${Colors.surfaceLight}`,
    flexWrap: 'wrap',
  },
  navItem: {
    padding: '0.4rem 0.85rem',
    borderRadius: 8,
    color: Colors.textSecondary,
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  navItemActive: {
    backgroundColor: Colors.primary,
    color: '#fff',
  },
  main: {
    flex: 1,
  },
};
