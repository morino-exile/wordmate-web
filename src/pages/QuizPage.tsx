import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore, calcNextReview, updateMastery } from '../store/useStore';
import { allWords } from '../data/wordList';
import { Colors } from '../theme/colors';
import type { StarterWord } from '../data/wordList';
import type { WordEntry } from '../store/useStore';

interface Question {
  word: StarterWord | WordEntry;
  meaning: string;
  options: string[];
  correctIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(pool: { word: string; meaning: string }[], allMeanings: string[], count: number): Question[] {
  const selected = shuffle(pool).slice(0, count);
  return selected.map((item) => {
    const wrong = shuffle(allMeanings.filter((m) => m !== item.meaning)).slice(0, 3);
    const options = shuffle([item.meaning, ...wrong]);
    return {
      word: item as any,
      meaning: item.meaning,
      options,
      correctIndex: options.indexOf(item.meaning),
    };
  });
}

export default function QuizPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { recordStudy, addWord, words: storeWords, getWeakWords, getWordsForReview } = useStore();

  const mode = searchParams.get('mode') ?? 'all';
  const value = searchParams.get('value') ?? '';

  // 依模式篩選出題單字池
  const { pool, allMeanings, modeLabel } = useMemo(() => {
    let pool: { word: string; meaning: string; exams?: any[]; inventory?: string }[] = [];
    let label = '全部混合';

    if (mode === 'weak') {
      pool = getWeakWords(50).map((w) => ({ word: w.word, meaning: w.meaning }));
      label = '弱點複習';
    } else if (mode === 'review') {
      pool = getWordsForReview(50).map((w) => ({ word: w.word, meaning: w.meaning }));
      label = '今日複習';
    } else if (mode === 'cefr') {
      // 先從已匯入的 storeWords 篩，再補 allWords
      const fromStore = storeWords.filter((w) => w.exams.includes(value as any));
      const fromBuiltin = allWords.filter((w) => w.exams.includes(value as any) && !fromStore.find((s) => s.word === w.word));
      pool = [...fromStore, ...fromBuiltin];
      label = `CEFR ${value}`;
    } else if (mode === 'inventory') {
      pool = storeWords.filter((w) => w.inventory === value);
      label = value.replace(/_/g, ' ');
    } else {
      // all: 合併 storeWords + allWords
      const allSet = new Map<string, { word: string; meaning: string }>();
      for (const w of allWords) allSet.set(w.word, { word: w.word, meaning: w.meaning });
      for (const w of storeWords) allSet.set(w.word, { word: w.word, meaning: w.meaning });
      pool = Array.from(allSet.values());
    }

    const allMeanings = pool.map((w) => w.meaning).filter(Boolean);
    return { pool, allMeanings, modeLabel: label };
  }, [mode, value, storeWords]);

  const TOTAL = Math.min(10, pool.length);

  // ⚠️ 用 useState 凍結題目：避免 addWord 觸發 storeWords 更新時重算題組（連答 bug）
  const [questions, setQuestions] = useState<Question[]>(() =>
    pool.length >= 4 ? buildQuestions(pool, allMeanings, TOTAL) : []
  );

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const wrongRef = useRef<{ word: string; meaning: string }[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // 題目不夠
  if (pool.length < 4) {
    return (
      <div style={s.container}>
        <div style={s.emptyBox}>
          <span style={{ fontSize: '2.5rem' }}>📭</span>
          <h3 style={{ color: Colors.text, margin: '0.5rem 0' }}>單字不足</h3>
          <p style={{ color: Colors.textMuted, fontSize: '0.9rem' }}>
            「{modeLabel}」裡的單字不夠 4 個，無法出題
          </p>
          <button style={s.backBtn} onClick={() => navigate('/quiz')}>← 返回選擇</button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const progress = (idx / questions.length) * 100;

  const handleAnswer = useCallback((optIdx: number) => {
    if (selected !== null) return;
    const correct = optIdx === q.correctIndex;
    setSelected(optIdx);
    setIsCorrect(correct);
    if (correct) setScore((s) => s + 1);
    else wrongRef.current.push({ word: String((q.word as any).word), meaning: q.meaning });

    recordStudy(correct);

    // 更新 SRS（對齊設計文件：-2 懲罰、精確間隔）
    const wordStr = String((q.word as any).word);
    const existing = storeWords.find((w) => w.word === wordStr);
    const newMastery = updateMastery(existing?.mastery ?? 0, correct);
    const entry: WordEntry = existing
      ? { ...existing, mastery: newMastery, nextReview: calcNextReview(newMastery), timesCorrect: existing.timesCorrect + (correct ? 1 : 0), timesWrong: existing.timesWrong + (correct ? 0 : 1), lastWrongDate: correct ? existing.lastWrongDate : Date.now() }
      : {
          word: wordStr,
          phonetic: (q.word as any).phonetic ?? '',
          meaning: q.meaning,
          partOfSpeech: (q.word as any).partOfSpeech ?? '',
          example: (q.word as any).example ?? '',
          exams: (q.word as any).exams ?? [],
          inventory: (q.word as any).inventory,
          mastery: newMastery,
          nextReview: calcNextReview(newMastery),
          timesCorrect: correct ? 1 : 0,
          timesWrong: correct ? 0 : 1,
          lastWrongDate: correct ? undefined : Date.now(),
        };
    addWord(entry);

    timerRef.current = setTimeout(() => {
      if (idx + 1 >= questions.length) setFinished(true);
      else { setIdx((i) => i + 1); setSelected(null); setIsCorrect(null); }
    }, 1200);
  }, [selected, q, idx, questions.length, recordStudy, addWord, storeWords]);

  const restart = () => {
    setQuestions(buildQuestions(pool, allMeanings, TOTAL)); // 重新隨機出題
    setIdx(0); setScore(0); setSelected(null); setIsCorrect(null); setFinished(false);
    wrongRef.current = [];
  };

  // ── 結果畫面 ──
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={s.container}>
        <div style={s.resultBox}>
          <div style={s.emoji}>{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}</div>
          <h2 style={s.resultTitle}>測驗完成！</h2>
          <p style={s.modeTag}>{modeLabel}</p>
          <div style={s.scoreCard}>
            <p style={s.scoreLabel}>得分</p>
            <p style={s.scoreValue}>{score} / {questions.length}</p>
            <div style={s.pctTrack}><div style={{ ...s.pctFill, width: `${pct}%` }} /></div>
            <p style={s.pctText}>{pct}%</p>
          </div>
          {wrongRef.current.length > 0 && (
            <div style={s.wrongList}>
              <p style={s.wrongTitle}>答錯的單字：</p>
              {wrongRef.current.map((w, i) => (
                <div key={i} style={s.wrongItem}>
                  <span style={s.wrongWord}>{w.word}</span>
                  <span style={s.wrongMeaning}>{w.meaning}</span>
                </div>
              ))}
            </div>
          )}
          <div style={s.resultBtns}>
            <button style={s.btnOutline} onClick={() => navigate('/quiz')}>選擇模式</button>
            <button style={s.btnPrimary} onClick={restart}>再測一次</button>
          </div>
        </div>
      </div>
    );
  }

  // ── 測驗畫面 ──
  return (
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.backLink} onClick={() => navigate('/quiz')}>← 換模式</button>
        <span style={s.modeTagSmall}>{modeLabel}</span>
        <span style={s.counter}>{idx + 1}/{questions.length}</span>
        <span style={s.scoreDisplay}>✦ {score}</span>
      </div>
      <div style={s.progressTrack}><div style={{ ...s.progressFill, width: `${progress}%` }} /></div>

      <div style={s.wordSection}>
        <p style={s.wordText}>{String((q.word as any).word)}</p>
        <p style={s.phonetic}>{(q.word as any).phonetic ?? ''}</p>
      </div>

      <div style={s.options}>
        {q.options.map((opt, i) => {
          let bg = Colors.card;
          let color = Colors.text;
          if (selected !== null) {
            if (i === q.correctIndex) { bg = Colors.success; color = '#fff'; }
            else if (i === selected && !isCorrect) { bg = Colors.danger; color = '#fff'; }
          }
          return (
            <button key={i} style={{ ...s.optBtn, backgroundColor: bg, color }} onClick={() => handleAnswer(i)} disabled={selected !== null}>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <p style={{ ...s.feedback, color: isCorrect ? Colors.success : Colors.danger }}>
          {isCorrect ? '正確！' : `答案：${q.meaning}`}
        </p>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: 520, margin: '0 auto' },
  emptyBox: { textAlign: 'center', padding: '3rem 1rem', backgroundColor: Colors.card, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  backBtn: { marginTop: '0.5rem', padding: '0.6rem 1.2rem', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  header: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' },
  backLink: { background: 'none', border: 'none', color: Colors.primary, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, padding: 0 },
  modeTagSmall: { flex: 1, fontSize: '0.78rem', color: Colors.textMuted, backgroundColor: Colors.surface, padding: '0.15rem 0.5rem', borderRadius: 8 },
  counter: { color: Colors.textSecondary, fontSize: '0.9rem', fontWeight: 600 },
  scoreDisplay: { color: Colors.accent, fontWeight: 700 },
  progressTrack: { height: 5, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden', marginBottom: '1.5rem' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3, transition: 'width 0.3s ease' },
  wordSection: { textAlign: 'center', marginBottom: '2rem' },
  wordText: { fontSize: '2.2rem', fontWeight: 800, color: Colors.text, margin: '0 0 0.4rem' },
  phonetic: { color: Colors.textMuted, fontStyle: 'italic', margin: 0, fontSize: '1rem' },
  options: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' },
  optBtn: { padding: '1rem 1.25rem', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  feedback: { textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' },
  resultBox: { backgroundColor: Colors.card, borderRadius: 16, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  emoji: { fontSize: '3.5rem', textAlign: 'center', marginBottom: '0.5rem' },
  resultTitle: { textAlign: 'center', color: Colors.text, margin: '0 0 0.25rem' },
  modeTag: { textAlign: 'center', fontSize: '0.82rem', color: Colors.textMuted, margin: '0 0 1rem' },
  scoreCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: '1.25rem', textAlign: 'center', marginBottom: '1rem' },
  scoreLabel: { color: Colors.textSecondary, margin: '0 0 0.25rem', fontSize: '0.9rem' },
  scoreValue: { fontSize: '2.5rem', fontWeight: 800, color: Colors.text, margin: '0 0 0.75rem' },
  pctTrack: { height: 6, backgroundColor: Colors.surfaceLight, borderRadius: 3, overflow: 'hidden', margin: '0 auto 0.5rem', maxWidth: 200 },
  pctFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  pctText: { color: Colors.textSecondary, fontSize: '0.9rem', margin: 0 },
  wrongList: { backgroundColor: Colors.dangerBg, borderRadius: 10, padding: '0.85rem', marginBottom: '1rem' },
  wrongTitle: { color: Colors.danger, fontWeight: 600, margin: '0 0 0.6rem', fontSize: '0.85rem' },
  wrongItem: { display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: `1px solid rgba(0,0,0,0.05)` },
  wrongWord: { fontWeight: 700, color: Colors.text, fontSize: '0.9rem' },
  wrongMeaning: { color: Colors.textSecondary, fontSize: '0.85rem' },
  resultBtns: { display: 'flex', gap: '0.75rem' },
  btnOutline: { flex: 1, padding: '0.7rem', backgroundColor: 'transparent', border: `2px solid ${Colors.primary}`, color: Colors.primary, borderRadius: 10, fontWeight: 600, cursor: 'pointer' },
  btnPrimary: { flex: 1, padding: '0.7rem', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' },
};
