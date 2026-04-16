import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { allWords } from '../data/wordList';
import { Colors } from '../theme/colors';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardPage() {
  const { recordStudy } = useStore();
  const cards = useMemo(() => shuffle(allWords).slice(0, 20), []);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [knownCount, setKnownCount] = useState(0);

  const card = cards[idx];
  const progress = ((idx) / cards.length) * 100;

  const handleKnow = () => {
    recordStudy(true);
    setKnownCount((n) => n + 1);
    next();
  };

  const handleUnknown = () => {
    recordStudy(false);
    next();
  };

  const next = () => {
    setFlipped(false);
    setTimeout(() => {
      if (idx + 1 >= cards.length) setDone(true);
      else setIdx((i) => i + 1);
    }, 150);
  };

  const restart = () => {
    setIdx(0);
    setFlipped(false);
    setDone(false);
    setKnownCount(0);
  };

  if (done) {
    const pct = Math.round((knownCount / cards.length) * 100);
    return (
      <div style={s.container}>
        <div style={s.resultBox}>
          <div style={s.emoji}>{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}</div>
          <h2 style={s.resultTitle}>完成！</h2>
          <p style={s.resultScore}>認識 {knownCount} / {cards.length} 個單字（{pct}%）</p>
          <button style={s.restartBtn} onClick={restart}>再來一輪</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <span style={s.counter}>{idx + 1} / {cards.length}</span>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
      </div>

      {/* 單字卡 */}
      <div style={s.cardWrap} onClick={() => setFlipped((f) => !f)}>
        <div style={{ ...s.card, ...(flipped ? s.cardFlipped : {}) }}>
          {!flipped ? (
            <div style={s.cardFront}>
              <p style={s.cardWord}>{card.word}</p>
              <p style={s.cardPhonetic}>{card.phonetic}</p>
              <p style={s.tapHint}>點擊翻牌</p>
            </div>
          ) : (
            <div style={s.cardBack}>
              <p style={s.posTag}>{card.partOfSpeech}</p>
              <p style={s.cardMeaning}>{card.meaning}</p>
              {card.example && (
                <p style={s.cardExample}>💬 {card.example}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {flipped && (
        <div style={s.btnRow}>
          <button style={{ ...s.actionBtn, backgroundColor: Colors.danger }} onClick={handleUnknown}>
            ✕ 不認識
          </button>
          <button style={{ ...s.actionBtn, backgroundColor: Colors.success }} onClick={handleKnow}>
            ✓ 認識
          </button>
        </div>
      )}

      {!flipped && (
        <p style={s.hintText}>點擊單字卡查看意思</p>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: 520, margin: '0 auto' },
  header: { marginBottom: '1.25rem' },
  counter: { fontSize: '0.9rem', color: Colors.textMuted, fontWeight: 600 },
  progressTrack: {
    height: 6, backgroundColor: Colors.surface,
    borderRadius: 3, overflow: 'hidden', marginTop: '0.5rem',
  },
  progressFill: {
    height: '100%', backgroundColor: Colors.primary,
    borderRadius: 3, transition: 'width 0.3s ease',
  },
  cardWrap: { cursor: 'pointer', userSelect: 'none', marginBottom: '1.5rem' },
  card: {
    backgroundColor: Colors.card, borderRadius: 16,
    padding: '2.5rem 2rem', minHeight: 220,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    transition: 'transform 0.15s ease',
  },
  cardFlipped: { backgroundColor: Colors.surface },
  cardFront: { textAlign: 'center', width: '100%' },
  cardBack: { textAlign: 'center', width: '100%' },
  cardWord: { fontSize: '2.2rem', fontWeight: 800, color: Colors.text, margin: '0 0 0.5rem' },
  cardPhonetic: { fontSize: '1rem', color: Colors.textMuted, fontStyle: 'italic', margin: '0 0 1rem' },
  tapHint: { fontSize: '0.8rem', color: Colors.textMuted, margin: 0 },
  posTag: {
    display: 'inline-block', fontSize: '0.8rem', color: Colors.primary,
    backgroundColor: Colors.primaryLight, padding: '0.2rem 0.6rem',
    borderRadius: 8, fontStyle: 'italic', marginBottom: '0.75rem',
  },
  cardMeaning: { fontSize: '1.3rem', fontWeight: 700, color: Colors.text, margin: '0 0 0.75rem' },
  cardExample: { fontSize: '0.9rem', color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 1.6, margin: 0 },
  btnRow: { display: 'flex', gap: '1rem' },
  actionBtn: {
    flex: 1, padding: '0.9rem', border: 'none',
    borderRadius: 12, color: '#fff', fontWeight: 700,
    fontSize: '1rem', cursor: 'pointer',
  },
  hintText: { textAlign: 'center', color: Colors.textMuted, fontSize: '0.85rem' },
  resultBox: {
    textAlign: 'center', padding: '3rem 2rem',
    backgroundColor: Colors.card, borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  emoji: { fontSize: '4rem', marginBottom: '0.5rem' },
  resultTitle: { color: Colors.text, margin: '0 0 0.5rem' },
  resultScore: { color: Colors.textSecondary, marginBottom: '1.5rem' },
  restartBtn: {
    padding: '0.75rem 2rem', backgroundColor: Colors.primary,
    color: '#fff', border: 'none', borderRadius: 10,
    fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
  },
};
