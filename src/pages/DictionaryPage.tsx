import { useState } from 'react';
import { useStore } from '../store/useStore';
import { fetchWordDefinition } from '../data/wordList';
import { Colors } from '../theme/colors';
import type { WordEntry } from '../store/useStore';

export default function DictionaryPage() {
  const { words, addWord } = useStore();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<{
    word: string; phonetic?: string; meaning?: string;
    partOfSpeech?: string; example?: string;
  } | null>(null);

  const isAlreadySaved = result
    ? words.some((w) => w.word.toLowerCase() === result.word.toLowerCase())
    : false;

  const handleSearch = async () => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);
    try {
      const def = await fetchWordDefinition(q);
      if (def) {
        setResult({
          word: q,
          phonetic: def.phonetic || '',
          meaning: def.meaning || '暫無釋義',
          partOfSpeech: def.partOfSpeech || 'unknown',
          example: def.example || '',
        });
      } else {
        setError(`找不到單字「${q}」的釋義`);
      }
    } catch {
      setError('網路錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result || isAlreadySaved || saved) return;
    const entry: WordEntry = {
      word: result.word,
      phonetic: result.phonetic || '',
      meaning: result.meaning || '',
      partOfSpeech: result.partOfSpeech || '',
      example: result.example || '',
      exams: [],
      mastery: 0,
      nextReview: Date.now() + 4 * 60 * 60 * 1000,
      timesCorrect: 0,
      timesWrong: 0,
    };
    addWord(entry);
    setSaved(true);
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>📖 字典查詢</h2>
      <p style={s.hint}>使用免費字典 API 查詢單字並加入你的單字庫</p>

      <div style={s.searchRow}>
        <input
          style={s.input}
          placeholder="輸入英文單字..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          autoCapitalize="none"
          autoCorrect="off"
        />
        <button
          style={{ ...s.btn, opacity: loading || !query.trim() ? 0.5 : 1 }}
          onClick={handleSearch}
          disabled={loading || !query.trim()}
        >
          {loading ? '查詢中…' : '查詢'}
        </button>
      </div>

      {error && (
        <div style={s.errorBox}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {result && !loading && (
        <div style={s.resultCard}>
          <div style={s.cardTop}>
            <span style={s.wordTitle}>{result.word}</span>
            {isAlreadySaved && (
              <span style={s.savedTag}>✓ 已收藏</span>
            )}
          </div>

          {result.phonetic && (
            <p style={s.phonetic}>{result.phonetic}</p>
          )}

          <hr style={s.divider} />

          <div style={s.defRow}>
            <span style={s.posTag}>{result.partOfSpeech}</span>
            <span style={s.meaning}>{result.meaning}</span>
          </div>

          {result.example && (
            <div style={s.exampleBox}>
              <p style={s.example}>💬 {result.example}</p>
            </div>
          )}

          <button
            style={{
              ...s.saveBtn,
              backgroundColor: saved || isAlreadySaved ? Colors.surfaceLight : Colors.primary,
              color: saved || isAlreadySaved ? Colors.textMuted : '#fff',
              cursor: saved || isAlreadySaved ? 'default' : 'pointer',
            }}
            onClick={handleSave}
            disabled={saved || isAlreadySaved}
          >
            {saved ? '✓ 新增成功' : isAlreadySaved ? '已在單字庫中' : '＋ 加入單字庫'}
          </button>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', maxWidth: 560, margin: '0 auto' },
  title: { color: Colors.text, marginBottom: '0.25rem' },
  hint: { color: Colors.textMuted, fontSize: '0.85rem', marginBottom: '1.25rem' },
  searchRow: { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' },
  input: {
    flex: 1, padding: '0.7rem 1rem', borderRadius: 10,
    border: `2px solid ${Colors.surfaceLight}`, backgroundColor: Colors.surface,
    color: Colors.text, fontSize: '1rem', outline: 'none',
  },
  btn: {
    padding: '0.7rem 1.4rem', backgroundColor: Colors.primary,
    color: '#fff', border: 'none', borderRadius: 10,
    fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
  },
  errorBox: {
    padding: '1rem', backgroundColor: Colors.dangerBg,
    borderRadius: 10, color: Colors.danger, marginBottom: '1rem',
  },
  resultCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  wordTitle: { fontSize: '1.8rem', fontWeight: 800, color: Colors.accent, textTransform: 'capitalize' },
  savedTag: {
    fontSize: '0.8rem', color: Colors.success, backgroundColor: Colors.successBg,
    padding: '0.25rem 0.6rem', borderRadius: 20, fontWeight: 600,
  },
  phonetic: { color: Colors.textMuted, fontStyle: 'italic', marginTop: '0.25rem', marginBottom: 0 },
  divider: { border: 'none', borderTop: `1px solid ${Colors.surfaceLight}`, margin: '1rem 0' },
  defRow: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem' },
  posTag: {
    fontSize: '0.8rem', color: Colors.primary, backgroundColor: Colors.primaryLight,
    padding: '0.2rem 0.6rem', borderRadius: 8, fontStyle: 'italic', whiteSpace: 'nowrap',
  },
  meaning: { fontSize: '1.05rem', color: Colors.text, fontWeight: 500, lineHeight: 1.6 },
  exampleBox: {
    backgroundColor: Colors.background, borderRadius: 10,
    padding: '0.75rem 1rem', marginBottom: '1.25rem',
  },
  example: { color: Colors.textSecondary, fontStyle: 'italic', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 },
  saveBtn: {
    width: '100%', padding: '0.85rem',
    border: 'none', borderRadius: 10,
    fontWeight: 600, fontSize: '1rem', transition: 'background 0.2s',
  },
};
