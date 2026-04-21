import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { characters } from '../data/characters';
import { Colors } from '../theme/colors';
import { playWord } from '../services/audioService';

const TOTAL = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SpellingPage() {
  const { words, selectedCharacterId, characterStates, addAffection, addStamina, recordStudy } = useStore();
  const navigate = useNavigate();
  const character = characters.find((c) => c.id === selectedCharacterId) ?? characters[0];

  const [round, setRound] = useState(0);
  const pool = useMemo(
    () => shuffle(words.filter((w) => w.mastery < 5)).slice(0, TOTAL),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round],
  );

  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [encourageLine, setEncourageLine] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef(0);

  const q = pool[idx];

  useEffect(() => {
    if (!submitted && inputRef.current) inputRef.current.focus();
  }, [idx, submitted]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (pool.length < 4) {
    return (
      <div style={st.container}>
        <div style={st.emptyBox}>
          <span style={{ fontSize: '2rem' }}>📚</span>
          <p style={{ color: Colors.text, fontWeight: 600, margin: '0.5rem 0' }}>單字不足</p>
          <p style={{ color: Colors.textMuted, fontSize: '0.9rem', marginBottom: '1rem' }}>
            請先加入更多單字再來挑戰
          </p>
          <button style={st.btnPrimary} onClick={() => navigate('/dictionary')}>去新增單字</button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (submitted || !q) return;
    const correct = input.trim().toLowerCase() === q.word.toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);

    if (correct) {
      playWord(q.word);
      scoreRef.current += 1;
      setScore(scoreRef.current);
      recordStudy(true);
      addAffection(selectedCharacterId, 1);
    } else {
      recordStudy(false);
    }

    timerRef.current = setTimeout(() => {
      if (idx + 1 >= pool.length) {
        addStamina(selectedCharacterId, 2);
        const lines = character.lines.encourageStudy;
        setEncourageLine(lines[Math.floor(Math.random() * lines.length)] ?? '做得好！');
        setFinished(true);
      } else {
        setIdx((i) => i + 1);
        setInput('');
        setSubmitted(false);
        setIsCorrect(false);
        setShowHint(false);
      }
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const restart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    scoreRef.current = 0;
    setRound((r) => r + 1);
    setIdx(0);
    setInput('');
    setSubmitted(false);
    setIsCorrect(false);
    setShowHint(false);
    setScore(0);
    setFinished(false);
    setEncourageLine('');
  };

  if (finished) {
    const pct = Math.round((scoreRef.current / pool.length) * 100);
    return (
      <div style={st.container}>
        <div style={st.resultBox}>
          <div style={st.resultEmoji}>{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}</div>
          <h2 style={st.resultTitle}>拼字完成！</h2>
          <div style={st.scoreCard}>
            <p style={st.scoreLabel}>得分</p>
            <p style={st.scoreValue}>{scoreRef.current} / {pool.length}</p>
            <div style={st.pctTrack}>
              <div style={{ ...st.pctFill, width: `${pct}%` }} />
            </div>
            <p style={st.pctText}>{pct}%</p>
          </div>
          <div style={st.rewardRow}>
            <span style={st.rewardBadge}>❤️ +{scoreRef.current} 好感度</span>
            <span style={st.rewardBadge}>⚡ +2 體力</span>
          </div>
          {encourageLine ? (
            <div style={{ ...st.charCard, borderColor: character.themeColor }}>
              <span style={{ fontSize: '1.2rem' }}>{character.emoji}</span>
              <p style={st.charLine}>「{encourageLine}」</p>
            </div>
          ) : null}
          <div style={st.resultBtns}>
            <button style={st.btnOutline} onClick={() => navigate('/')}>回首頁</button>
            <button style={st.btnPrimary} onClick={restart}>再來一輪</button>
          </div>
        </div>
      </div>
    );
  }

  const progress = (idx / pool.length) * 100;

  return (
    <div style={st.container}>
      <div style={st.header}>
        <button style={st.backBtn} onClick={() => navigate('/')}>← 返回</button>
        <span style={st.modeTag}>🔤 拼字挑戰</span>
        <span style={st.counter}>{idx + 1} / {pool.length}</span>
      </div>
      <div style={st.progressTrack}>
        <div style={{ ...st.progressFill, width: `${progress}%` }} />
      </div>

      <div style={st.card}>
        <div style={st.clueLabel}>請拼出這個英文單字：</div>
        {q.partOfSpeech && <span style={st.posBadge}>{q.partOfSpeech}</span>}
        <p style={st.meaning}>{q.meaning}</p>
        {q.example && <p style={st.example}>「{q.example}」</p>}
        {q.phonetic && (
          <button style={st.hintBtn} onClick={() => setShowHint((h) => !h)}>
            {showHint ? q.phonetic : '💡 顯示音標提示'}
          </button>
        )}
      </div>

      <div style={st.inputArea}>
        <input
          ref={inputRef}
          style={{
            ...st.input,
            ...(submitted ? (isCorrect ? st.inputCorrect : st.inputWrong) : {}),
          }}
          value={input}
          onChange={(e) => { if (!submitted) setInput(e.target.value); }}
          onKeyDown={handleKeyDown}
          placeholder="輸入英文單字..."
          disabled={submitted}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {!submitted && (
          <button
            style={{ ...st.submitBtn, opacity: input.trim() ? 1 : 0.5 }}
            onClick={handleSubmit}
            disabled={!input.trim()}
          >
            確認
          </button>
        )}
      </div>

      {submitted && (
        <div style={{ ...st.feedback, color: isCorrect ? Colors.success : Colors.danger }}>
          {isCorrect ? `✓ 正確！🔊` : `✕ 正確答案：${q.word}`}
        </div>
      )}
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: 520, margin: '0 auto' },

  emptyBox: {
    textAlign: 'center', padding: '3rem 1rem',
    backgroundColor: Colors.card, borderRadius: 14,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },

  header: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' },
  backBtn: {
    background: 'none', border: 'none', color: Colors.textSecondary,
    cursor: 'pointer', fontSize: '0.9rem', padding: '0.25rem 0.5rem',
  },
  modeTag: {
    fontSize: '0.8rem', fontWeight: 600, color: Colors.textSecondary,
    backgroundColor: Colors.surfaceLight, padding: '0.2rem 0.6rem', borderRadius: 8,
    marginLeft: 'auto',
  },
  counter: { fontSize: '0.85rem', color: Colors.textMuted },

  progressTrack: {
    height: 4, backgroundColor: Colors.surfaceLight, borderRadius: 2,
    marginBottom: '1.25rem', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: Colors.primary, borderRadius: 2, transition: 'width 0.3s',
  },

  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: '1.25rem 1.1rem',
    marginBottom: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  },
  clueLabel: { fontSize: '0.75rem', color: Colors.textMuted, marginBottom: '0.5rem' },
  posBadge: {
    fontSize: '0.7rem', backgroundColor: Colors.surfaceLight, color: Colors.textSecondary,
    padding: '0.15rem 0.5rem', borderRadius: 6, display: 'inline-block', marginBottom: '0.5rem',
  },
  meaning: { fontSize: '1.3rem', fontWeight: 700, color: Colors.text, margin: '0 0 0.5rem', lineHeight: 1.4 },
  example: {
    fontSize: '0.85rem', color: Colors.textSecondary, fontStyle: 'italic',
    margin: '0 0 0.75rem', lineHeight: 1.5,
  },
  hintBtn: {
    background: 'none', border: `1px dashed ${Colors.surfaceLight}`,
    color: Colors.textMuted, fontSize: '0.8rem', cursor: 'pointer',
    borderRadius: 8, padding: '0.3rem 0.7rem',
  },

  inputArea: { display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' },
  input: {
    flex: 1, padding: '0.85rem 1rem', fontSize: '1.1rem',
    border: `2px solid ${Colors.surfaceLight}`, borderRadius: 12,
    backgroundColor: Colors.card, color: Colors.text,
    outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit',
  },
  inputCorrect: { borderColor: Colors.success, backgroundColor: Colors.successBg },
  inputWrong: { borderColor: Colors.danger, backgroundColor: Colors.dangerBg },
  submitBtn: {
    padding: '0 1.25rem', backgroundColor: Colors.primary, color: '#fff',
    border: 'none', borderRadius: 12, fontWeight: 600, fontSize: '0.95rem',
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  feedback: { fontSize: '0.95rem', fontWeight: 600, textAlign: 'center', padding: '0.5rem' },

  resultBox: {
    backgroundColor: Colors.card, borderRadius: 16, padding: '2rem 1.5rem',
    textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
  },
  resultEmoji: { fontSize: '3rem' },
  resultTitle: { margin: 0, color: Colors.text, fontSize: '1.4rem', fontWeight: 700 },
  scoreCard: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: 12,
    padding: '1rem', textAlign: 'center',
  },
  scoreLabel: { fontSize: '0.8rem', color: Colors.textMuted, margin: '0 0 0.25rem' },
  scoreValue: { fontSize: '2rem', fontWeight: 800, color: Colors.accent, margin: '0 0 0.5rem' },
  pctTrack: {
    height: 6, backgroundColor: Colors.surfaceLight, borderRadius: 3,
    overflow: 'hidden', marginBottom: '0.4rem',
  },
  pctFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3, transition: 'width 0.5s' },
  pctText: { fontSize: '0.85rem', color: Colors.textSecondary, margin: 0 },

  rewardRow: { display: 'flex', gap: '0.75rem' },
  rewardBadge: {
    fontSize: '0.85rem', fontWeight: 600, backgroundColor: Colors.surfaceLight,
    color: Colors.textSecondary, padding: '0.35rem 0.8rem', borderRadius: 20,
  },

  charCard: {
    width: '100%', border: '2px solid', borderRadius: 12, padding: '0.85rem 1rem',
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem', textAlign: 'left',
  },
  charLine: { fontSize: '0.9rem', color: Colors.textSecondary, margin: 0, fontStyle: 'italic', lineHeight: 1.6 },

  resultBtns: { display: 'flex', gap: '0.75rem', width: '100%' },
  btnPrimary: {
    flex: 1, padding: '0.75rem', backgroundColor: Colors.primary, color: '#fff',
    border: 'none', borderRadius: 12, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
  },
  btnOutline: {
    flex: 1, padding: '0.75rem', backgroundColor: 'transparent', color: Colors.primary,
    border: `2px solid ${Colors.primary}`, borderRadius: 12,
    fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
  },
};
