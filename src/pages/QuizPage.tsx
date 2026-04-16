import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { allWords } from '../data/wordList';
import { Colors } from '../theme/colors';
import type { StarterWord } from '../data/wordList';
import type { WordEntry } from '../store/useStore';

interface Question {
  word: StarterWord;
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

function buildQuestions(words: StarterWord[], count: number): Question[] {
  const pool = shuffle(words).slice(0, count);
  return pool.map((word) => {
    const wrongMeanings = shuffle(
      words.filter((w) => w.word !== word.word).map((w) => w.meaning)
    ).slice(0, 3);
    const options = shuffle([word.meaning, ...wrongMeanings]);
    return { word, options, correctIndex: options.indexOf(word.meaning) };
  });
}

export default function QuizPage() {
  const { recordStudy, addWord, words: storeWords } = useStore();
  const TOTAL = 10;
  const questions = useMemo(() => buildQuestions(allWords, TOTAL), []);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const wrongRef = useRef<StarterWord[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const q = questions[idx];
  const progress = (idx / questions.length) * 100;

  const handleAnswer = useCallback((optIdx: number) => {
    if (selected !== null) return;
    const correct = optIdx === q.correctIndex;
    setSelected(optIdx);
    setIsCorrect(correct);
    if (correct) setScore((s) => s + 1);
    else wrongRef.current.push(q.word);

    recordStudy(correct);

    // Update word entry in store
    const existing = storeWords.find((w) => w.word === q.word.word);
    const entry: WordEntry = existing
      ? {
          ...existing,
          timesCorrect: existing.timesCorrect + (correct ? 1 : 0),
          timesWrong: existing.timesWrong + (correct ? 0 : 1),
          mastery: correct ? Math.min(5, existing.mastery + 1) : Math.max(0, existing.mastery - 1),
          nextReview: Date.now() + (correct ? 86400000 : 3600000),
          lastWrongDate: correct ? existing.lastWrongDate : Date.now(),
        }
      : {
          word: q.word.word, phonetic: q.word.phonetic,
          meaning: q.word.meaning, partOfSpeech: q.word.partOfSpeech,
          example: q.word.example, exams: q.word.exams,
          mastery: correct ? 1 : 0,
          nextReview: Date.now() + (correct ? 86400000 : 3600000),
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
    setIdx(0); setScore(0); setSelected(null);
    setIsCorrect(null); setFinished(false); wrongRef.current = [];
  };

  // ---- 結果畫面 ----
  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={s.container}>
        <div style={s.resultBox}>
          <div style={s.emoji}>{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}</div>
          <h2 style={s.resultTitle}>測驗完成！</h2>
          <div style={s.scoreCard}>
            <p style={s.scoreLabel}>得分</p>
            <p style={s.scoreValue}>{score} / {questions.length}</p>
            <div style={s.pctTrack}>
              <div style={{ ...s.pctFill, width: `${pct}%` }} />
            </div>
            <p style={s.pctText}>{pct}%</p>
          </div>
          {wrongRef.current.length > 0 && (
            <div style={s.wrongList}>
              <p style={s.wrongTitle}>答錯的單字：</p>
              {wrongRef.current.map((w) => (
                <div key={w.word} style={s.wrongItem}>
                  <span style={s.wrongWord}>{w.word}</span>
                  <span style={s.wrongMeaning}>{w.meaning}</span>
                </div>
              ))}
            </div>
          )}
          <div style={s.resultBtns}>
            <button style={s.btnOutline} onClick={restart}>再測一次</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- 測驗畫面 ----
  return (
    <div style={s.container}>
      <div style={s.header}>
        <span style={s.headerTitle}>✏️ 小測驗</span>
        <span style={s.counter}>{idx + 1} / {questions.length}</span>
        <span style={s.scoreDisplay}>✦ {score}</span>
      </div>
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${progress}%` }} />
      </div>

      <div style={s.wordSection}>
        <p style={s.wordText}>{q.word.word}</p>
        <p style={s.phonetic}>{q.word.phonetic}</p>
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
            <button
              key={i}
              style={{ ...s.optBtn, backgroundColor: bg, color }}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p style={{ ...s.feedback, color: isCorrect ? Colors.success : Colors.danger }}>
          {isCorrect ? '正確！' : `答案：${q.word.meaning}`}
        </p>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: 520, margin: '0 auto' },
  header: {
    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem',
  },
  headerTitle: { flex: 1, fontWeight: 700, color: Colors.text, fontSize: '1.05rem' },
  counter: { color: Colors.textSecondary, fontSize: '0.9rem', fontWeight: 600 },
  scoreDisplay: { color: Colors.accent, fontWeight: 700 },
  progressTrack: {
    height: 5, backgroundColor: Colors.surface, borderRadius: 3,
    overflow: 'hidden', marginBottom: '1.5rem',
  },
  progressFill: {
    height: '100%', backgroundColor: Colors.primary,
    borderRadius: 3, transition: 'width 0.3s ease',
  },
  wordSection: { textAlign: 'center', marginBottom: '2rem' },
  wordText: { fontSize: '2.2rem', fontWeight: 800, color: Colors.text, margin: '0 0 0.4rem' },
  phonetic: { color: Colors.textMuted, fontStyle: 'italic', margin: 0, fontSize: '1rem' },
  options: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' },
  optBtn: {
    padding: '1rem 1.25rem', border: 'none', borderRadius: 12,
    fontWeight: 600, fontSize: '1rem', cursor: 'pointer', textAlign: 'center',
    transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  feedback: { textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' },
  resultBox: {
    backgroundColor: Colors.card, borderRadius: 16, padding: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  emoji: { fontSize: '3.5rem', textAlign: 'center', marginBottom: '0.5rem' },
  resultTitle: { textAlign: 'center', color: Colors.text, margin: '0 0 1.25rem' },
  scoreCard: {
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: '1.5rem', textAlign: 'center', marginBottom: '1.25rem',
  },
  scoreLabel: { color: Colors.textSecondary, margin: '0 0 0.25rem', fontSize: '0.9rem' },
  scoreValue: { fontSize: '2.5rem', fontWeight: 800, color: Colors.text, margin: '0 0 0.75rem' },
  pctTrack: {
    height: 6, backgroundColor: Colors.surfaceLight, borderRadius: 3,
    overflow: 'hidden', margin: '0 auto 0.5rem', maxWidth: 200,
  },
  pctFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  pctText: { color: Colors.textSecondary, fontSize: '0.9rem', margin: 0 },
  wrongList: {
    backgroundColor: Colors.dangerBg, borderRadius: 10,
    padding: '1rem', marginBottom: '1.25rem',
  },
  wrongTitle: { color: Colors.danger, fontWeight: 600, margin: '0 0 0.75rem', fontSize: '0.9rem' },
  wrongItem: {
    display: 'flex', justifyContent: 'space-between',
    padding: '0.3rem 0', borderBottom: `1px solid rgba(0,0,0,0.05)`,
  },
  wrongWord: { fontWeight: 700, color: Colors.text },
  wrongMeaning: { color: Colors.textSecondary, fontSize: '0.9rem' },
  resultBtns: { display: 'flex', gap: '0.75rem', justifyContent: 'center' },
  btnOutline: {
    padding: '0.7rem 1.75rem', backgroundColor: 'transparent',
    border: `2px solid ${Colors.primary}`, color: Colors.primary,
    borderRadius: 10, fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
  },
};
