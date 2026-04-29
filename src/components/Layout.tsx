import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Colors } from '../theme/colors';

const NAV_ITEMS = [
  { label: '首頁', href: '/' },
  { label: '字典', href: '/dictionary' },
  { label: '測驗', href: '/quiz' },
  { label: '弱點', href: '/weak-review' },
  { label: '計畫', href: '/todo' },
  { label: '拼字', href: '/spelling' },
  { label: '統計', href: '/stats' },
  { label: '角色', href: '/character' },
  { label: '設定', href: '/settings' },
  { label: '新聞', href: '/news' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        <span style={styles.logo}>個人 OS ✏️</span>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    display: 'flex',
    gap: '0.35rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: Colors.card,
    borderBottom: `3px solid ${Colors.border}`,
    boxShadow: `0 3px 0 ${Colors.border}`,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  logo: {
    fontFamily: Colors.fontHeading,
    fontWeight: 700,
    fontSize: '1.05rem',
    marginRight: '0.75rem',
    color: Colors.text,
  },
  navItem: {
    padding: '0.3rem 0.85rem',
    borderRadius: Colors.wobbly,
    color: Colors.text,
    textDecoration: 'none',
    fontSize: '0.875rem',
    border: '2px solid transparent',
    transition: 'all 0.1s',
    fontFamily: Colors.fontBody,
  },
  navItemActive: {
    backgroundColor: Colors.text,
    color: Colors.background,
    border: `2px solid ${Colors.text}`,
  },
  main: {
    flex: 1,
    maxWidth: 900,
    margin: '0 auto',
    width: '100%',
    padding: '1.5rem 1rem',
  },
};
