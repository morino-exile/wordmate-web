import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Colors } from '../theme/colors';

interface Article {
  id: string;
  source: string;
  title: string;
  url: string;
  published_at: string | null;
}

const SOURCE_COLORS: Record<string, string> = {
  'Anthropic': '#c8553d',
  'OpenAI': '#10a37f',
  'Google DeepMind': '#4285f4',
  'Hugging Face': '#ff9d00',
  'The Verge AI': '#ff3c3c',
  'MIT Tech Review AI': '#a00',
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('全部');

  useEffect(() => {
    supabase
      .from('news_articles')
      .select('id, source, title, url, published_at')
      .order('published_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        setArticles(data ?? []);
        setLoading(false);
      });
  }, []);

  const sources = ['全部', ...Array.from(new Set(articles.map(a => a.source)))];
  const filtered = filter === '全部' ? articles : articles.filter(a => a.source === filter);

  function formatDate(iso: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>📰 AI 新聞</h1>

      <div style={s.filterRow}>
        {sources.map(src => (
          <button
            key={src}
            style={{ ...s.filterBtn, ...(filter === src ? s.filterActive : {}) }}
            onClick={() => setFilter(src)}
          >
            {src}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: Colors.textMuted, textAlign: 'center', marginTop: '2rem' }}>載入中…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: Colors.textMuted, textAlign: 'center', marginTop: '2rem' }}>沒有文章</p>
      ) : (
        <div style={s.list}>
          {filtered.map(article => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              style={s.card}
            >
              <div style={s.cardTop}>
                <span style={{
                  ...s.sourceBadge,
                  background: SOURCE_COLORS[article.source] ?? Colors.textSecondary,
                }}>
                  {article.source}
                </span>
                <span style={s.date}>{formatDate(article.published_at)}</span>
              </div>
              <p style={s.articleTitle}>{article.title}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '1rem', maxWidth: 700, margin: '0 auto' },
  title: {
    fontFamily: Colors.fontHeading, fontSize: '1.6rem', fontWeight: 700,
    marginBottom: '1rem',
  },
  filterRow: {
    display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem',
  },
  filterBtn: {
    padding: '0.25rem 0.75rem',
    border: `2px solid ${Colors.border}`,
    borderRadius: Colors.wobbly,
    background: Colors.background,
    color: Colors.text,
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontFamily: Colors.fontBody,
  },
  filterActive: {
    background: Colors.text,
    color: Colors.background,
  },
  list: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  card: {
    display: 'block',
    padding: '0.9rem 1rem',
    background: Colors.card,
    border: `2px solid ${Colors.border}`,
    borderRadius: Colors.wobblyAlt,
    boxShadow: Colors.shadowSm,
    textDecoration: 'none',
    color: Colors.text,
    transition: 'box-shadow 0.1s',
  },
  cardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '0.4rem',
  },
  sourceBadge: {
    fontSize: '0.7rem', color: '#fff', padding: '0.15rem 0.55rem',
    borderRadius: 4, fontWeight: 700,
  },
  date: { fontSize: '0.75rem', color: Colors.textMuted },
  articleTitle: {
    margin: 0, fontSize: '0.9rem', lineHeight: 1.5,
    fontFamily: Colors.fontBody,
  },
};
