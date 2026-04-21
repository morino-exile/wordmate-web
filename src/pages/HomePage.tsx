import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { allWords } from '../data/wordList';
import { characters } from '../data/characters';
import { Colors } from '../theme/colors';
import type { WordEntry } from '../store/useStore';


function getRandomLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)] ?? '';
}

// 隨機打亂並取前 N 個
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomePage() {
  const { todayStudied, streak, words: storeWords, selectedCharacterId,
    characterStates, selectCharacter, addWord, recordStudy, getWordsForReview } = useStore();

  const reviewCount = useMemo(() => getWordsForReview(50).length, [storeWords]);

  // 每日推薦：完全未加入的單字，用日期做固定洗牌
  const dailyRecs = useMemo(() => {
    const unseen = allWords.filter((sw) => !storeWords.find((w) => w.word === sw.word));
    if (unseen.length === 0) return [];
    const today = new Date().toISOString().slice(0, 10);
    let seed = today.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const arr = [...unseen];
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 5);
  }, [storeWords]);

  const [recsAdded, setRecsAdded] = useState(false);
  const addAllRecs = () => {
    dailyRecs.forEach((sw) => {
      addWord({
        word: sw.word, phonetic: sw.phonetic, meaning: sw.meaning,
        partOfSpeech: sw.partOfSpeech, example: sw.example, exams: sw.exams,
        mastery: 0, nextReview: Date.now(), timesCorrect: 0, timesWrong: 0,
      });
    });
    setRecsAdded(true);
  };

  const character = characters.find((c) => c.id === selectedCharacterId) ?? characters[0];
  const charState = characterStates[character.id];
  const affection = charState?.affection ?? 0;
  const stamina = charState?.stamina ?? 50;

  // 用 useMemo + character.id 為依賴，切換角色時立刻更新台詞
  const greeting = useMemo(() => getRandomLine(character.lines.greeting), [character.id]);

  // 快速單字卡
  const availableWords = useMemo(
    () => shuffle(allWords.filter((sw) => !storeWords.find((w) => w.word === sw.word && w.mastery >= 3))),
    []
  );
  const [flashIdx, setFlashIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const flashWord = availableWords[flashIdx % Math.max(1, availableWords.length)];

  const nextFlash = (knew: boolean) => {
    if (flashWord) {
      const existing = storeWords.find((w) => w.word === flashWord.word);
      const entry: WordEntry = existing
        ? {
            ...existing,
            mastery: knew ? Math.min(5, existing.mastery + 1) : 0,
            timesCorrect: existing.timesCorrect + (knew ? 1 : 0),
            timesWrong: existing.timesWrong + (knew ? 0 : 1),
            nextReview: Date.now() + (knew ? 4 * 3600000 : 600000),
            lastWrongDate: knew ? existing.lastWrongDate : Date.now(),
          }
        : {
            word: flashWord.word, phonetic: flashWord.phonetic,
            meaning: flashWord.meaning, partOfSpeech: flashWord.partOfSpeech,
            example: flashWord.example, exams: flashWord.exams,
            mastery: knew ? 1 : 0,
            nextReview: Date.now() + (knew ? 4 * 3600000 : 600000),
            timesCorrect: knew ? 1 : 0, timesWrong: knew ? 0 : 1,
            lastWrongDate: knew ? undefined : Date.now(),
          };
      addWord(entry);
      recordStudy(knew);
    }
    setFlipped(false);
    setFlashIdx((i) => i + 1);
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <span style={s.appTitle}>WordMate</span>
        <Link to="/settings" style={s.settingsBtn} title="設定">⚙️</Link>
      </div>

      {/* 統計卡 */}
      <div style={s.card}>
        <div style={s.widgetLabel}>📊 今日概覽</div>
        <div style={s.statsRow}>
          <div style={s.statItem}>
            <span style={s.statNum}>{todayStudied}</span>
            <span style={s.statLabel}>已學單字</span>
          </div>
          <div style={s.statDivider} />
          <div style={s.statItem}>
            <span style={s.statNum}>{streak}</span>
            <span style={s.statLabel}>連續天數 🔥</span>
          </div>
          <div style={s.statDivider} />
          <div style={{ ...s.statItem, gap: '0.4rem', alignItems: 'stretch' }}>
            <MiniBar label="❤️" value={affection} color={Colors.primary} />
            <MiniBar label="⚡" value={stamina} color={Colors.accent} />
          </div>
        </div>
      </div>

      {/* 角色打招呼 */}
      <div style={{ ...s.card, borderLeft: `4px solid ${character.themeColor}` }}>
        <div style={s.charRow}>
          <div style={{ ...s.charEmoji, backgroundColor: character.themeColor + '33' }}>
            {character.emoji}
          </div>
          <div>
            <div style={s.charName}>{character.name}</div>
            <div style={s.charNameEn}>{character.nameEn}</div>
          </div>
          {/* 角色切換 */}
          <select
            style={s.charSelect}
            value={selectedCharacterId}
            onChange={(e) => selectCharacter(e.target.value)}
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <p style={s.greeting}>「{greeting}」</p>
      </div>

      {/* 每日推薦 */}
      {dailyRecs.length > 0 && (
        <div style={s.card}>
          <div style={s.widgetLabel}>✨ 今日推薦學習
            <span style={s.badge}>{dailyRecs.length} 個新單字</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {dailyRecs.map((w) => (
              <div key={w.word} style={s.recRow}>
                <span style={s.recWord}>{w.word}</span>
                <span style={s.recMeaning}>{w.meaning}</span>
              </div>
            ))}
          </div>
          <button
            style={{ ...s.recBtn, backgroundColor: recsAdded ? Colors.successBg : Colors.primary, color: recsAdded ? Colors.success : '#fff' }}
            onClick={addAllRecs}
            disabled={recsAdded}
          >
            {recsAdded ? '✓ 已加入單字庫' : '全部加入單字庫'}
          </button>
        </div>
      )}

      {/* 快速單字卡 */}
      <div style={s.card}>
        <div style={s.widgetLabel}>📖 快速單字卡
          <span style={s.badge}>今日 {todayStudied} 字</span>
        </div>

        {flashWord ? (
          <>
            <div
              style={{ ...s.flashCard, backgroundColor: flipped ? Colors.surface : Colors.card }}
              onClick={() => setFlipped((f) => !f)}
            >
              {!flipped ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={s.flashWord}>{flashWord.word}</p>
                  <p style={s.flashPhonetic}>{flashWord.phonetic}</p>
                  <p style={s.flashHint}>點擊翻面</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={s.flashMeaning}>{flashWord.meaning}</p>
                  {flashWord.example && (
                    <p style={s.flashExample}>「{flashWord.example}」</p>
                  )}
                </div>
              )}
            </div>

            {flipped && (
              <div style={s.flashBtns}>
                <button style={{ ...s.flashBtn, backgroundColor: Colors.dangerBg, color: Colors.danger }}
                  onClick={() => nextFlash(false)}>✕ 不認識</button>
                <button style={{ ...s.flashBtn, backgroundColor: Colors.successBg, color: Colors.success }}
                  onClick={() => nextFlash(true)}>✓ 認識</button>
              </div>
            )}
          </>
        ) : (
          <div style={s.flashDone}>
            <span style={{ fontSize: '2rem' }}>✅</span>
            <span style={{ color: Colors.text, fontWeight: 600 }}>全部學完了！</span>
          </div>
        )}
      </div>

      {/* 快捷按鈕 */}
      <div style={s.quickGrid}>
        <QuickBtn to="/dictionary" icon="🔍" label="新增單字" color={Colors.accent} />
        <QuickBtn to="/flashcard" icon="🃏" label="單字卡" color={Colors.secondary} />
        <QuickBtn to="/quiz" icon="✏️" label="測驗" color={Colors.primary} />
        <QuickBtn to="/weak-review" icon="🔴" label="弱點複習" color={Colors.danger} />
        <QuickBtn
          to="/quiz/play?mode=review"
          icon="📅"
          label={reviewCount > 0 ? `今日複習 (${reviewCount})` : '今日已完成 ✓'}
          color={reviewCount > 0 ? Colors.accent : Colors.textMuted}
          dim={reviewCount === 0}
        />
        <QuickBtn to="/spelling" icon="🔤" label="拼字挑戰" color={Colors.secondary} />
      </div>
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <span style={{ fontSize: '0.75rem' }}>{label}</span>
      <div style={{ flex: 1, height: 5, backgroundColor: Colors.surfaceLight, borderRadius: 3, overflow: 'hidden', minWidth: 50 }}>
        <div style={{ height: '100%', width: `${value}%`, backgroundColor: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: Colors.textMuted, minWidth: 20 }}>{value}</span>
    </div>
  );
}

function QuickBtn({ to, icon, label, color, dim }: { to: string; icon: string; label: string; color: string; dim?: boolean }) {
  return (
    <Link to={to} style={{ ...s.quickBtn, textDecoration: 'none', opacity: dim ? 0.55 : 1 }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <span style={{ ...s.quickLabel, color }}>{label}</span>
    </Link>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '1rem', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' },

  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0' },
  appTitle: { fontSize: '1.5rem', fontWeight: 700, color: Colors.accent, letterSpacing: 2 },
  settingsBtn: { fontSize: '1.3rem', textDecoration: 'none', opacity: 0.7 },

  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: '1rem 1.1rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  },
  widgetLabel: {
    fontSize: '0.8rem', fontWeight: 600, color: Colors.textSecondary,
    marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
  badge: {
    fontSize: '0.75rem', color: Colors.textMuted, backgroundColor: Colors.surfaceLight,
    padding: '0.15rem 0.5rem', borderRadius: 10,
  },

  statsRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.1rem' },
  statNum: { fontSize: '1.8rem', fontWeight: 700, color: Colors.accent },
  statLabel: { fontSize: '0.75rem', color: Colors.textMuted },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.surfaceLight },

  charRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' },
  charEmoji: { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' },
  charName: { fontWeight: 600, color: Colors.text, fontSize: '1rem' },
  charNameEn: { fontSize: '0.75rem', color: Colors.textMuted },
  charSelect: {
    marginLeft: 'auto', fontSize: '0.8rem', color: Colors.textSecondary,
    backgroundColor: Colors.surface, border: `1px solid ${Colors.surfaceLight}`,
    borderRadius: 8, padding: '0.25rem 0.5rem', cursor: 'pointer',
  },
  greeting: { fontSize: '0.9rem', color: Colors.textSecondary, lineHeight: 1.6, margin: 0, fontStyle: 'italic' },

  flashCard: {
    borderRadius: 12, padding: '1.5rem 1rem', minHeight: 110,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', marginBottom: '0.75rem',
    border: `1px solid ${Colors.surfaceLight}`, userSelect: 'none',
    transition: 'background 0.2s',
  },
  flashWord: { fontSize: '1.8rem', fontWeight: 800, color: Colors.text, margin: '0 0 0.25rem' },
  flashPhonetic: { fontSize: '0.9rem', color: Colors.textMuted, fontStyle: 'italic', margin: '0 0 0.5rem' },
  flashHint: { fontSize: '0.75rem', color: Colors.textMuted, margin: 0 },
  flashMeaning: { fontSize: '1.2rem', fontWeight: 700, color: Colors.accent, margin: '0 0 0.5rem' },
  flashExample: { fontSize: '0.85rem', color: Colors.textSecondary, fontStyle: 'italic', margin: 0, lineHeight: 1.5 },
  flashBtns: { display: 'flex', gap: '0.75rem' },
  flashBtn: {
    flex: 1, padding: '0.75rem', border: 'none', borderRadius: 10,
    fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
  },
  flashDone: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.5rem', padding: '1.25rem 0',
  },

  recRow: { display: 'flex', alignItems: 'baseline', gap: '0.5rem' },
  recWord: { fontWeight: 700, color: Colors.text, fontSize: '0.9rem', minWidth: 80 },
  recMeaning: { fontSize: '0.8rem', color: Colors.textSecondary },
  recBtn: { width: '100%', padding: '0.6rem', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' },

  quickGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  quickBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.4rem', padding: '1rem', backgroundColor: Colors.card,
    borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  quickLabel: { fontSize: '0.85rem', fontWeight: 600 },
};
