import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { allWords } from '../data/wordList';
import { Colors } from '../theme/colors';
import { playWord } from '../services/audioService';
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
      allWords.filter((w) => w.word !== word.word).map((w) => w.meaning)
    ).slice(0, 3);
    const options = shuffle([word.meaning, ...wrongMeanings]);
    return { word, options, correctIndex: options.indexOf(word.meaning) };
  });
}

export default function WeakReviewPage() {
  const { getWeakWords, recordStudy, addWord, words: storeWords } = useStore();

  // 凍結初始弱點清單，避免答題後 store 更新導致題目重新洗牌
  const [weakWords] = useState<StarterWord[]>(() =>
    getWeakWords()
      .map((entry) => allWords.find((sw) => sw.word === entry.word))
      .filter(Boolean) as StarterWord[]
  );

  // ---- 空狀態 ----
  if (weakWords.length === 0) {
    return (
      <div style={s.container}>
        <div style={s.emptyBox}>
          <div style={s.emoji}>✨</div>
          <h2 style={s.emptyTitle}>沒有弱點單字！</h2>
          <p style={s.emptyDesc}>繼續加油，保持好表現</p>
        </div>
      </div>
    );
  }

  return <WeakQuiz words={weakWords} recordStudy={recordStudy} addWord={addWord} storeWords={storeWords} />;
}

function WeakQuiz({
  words, recordStudy, addWord, storeWords,
}: {
  words: StarterWord[];
  recordStudy: (correct: boolean) => void;
  addWord: (w: WordEntry) => void;
  storeWords: WordEntry[];
}) {
  const TOTAL = Math.min(10, words.length);
  const questions = useMemo(() => buildQuestions(words, TOTAL), [words, TOTAL]);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const wrongRef = useRef<StarterWord[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const q = questions[idx];

  const handleAnswer = useCallback((optIdx: number) => {
    if (selected !== null) return;
    const correct = optIdx === q.correctIndex;
    setSelected(optIdx);
    setIsCorrect(correct);
    if (correct) setScore((s) => s + 1);
    else wrongRef.current.push(q.word);

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
          word: q.word.word, phonetic: q.word.phonetic, meaning: q.word.meaning,
          partOfSpeech: q.word.partOfSpeech, example: q.word.example, exams: q.word.exams,
          mastery: correct ? 1 : 0,
          nextReview: Date.now() + (correct ? 86400000 : 3600000),
          timesCorrect: correct ? 1 : 0, timesWrong: correct ? 0 : 1,
          lastWrongDate: correct ? undefined : Date.now(),
        };

    timerRef.current = setTimeout(() => {
      recordStudy(correct);
      addWord(entry);
      if (idx + 1 >= questions.length) setFinished(true);
      else { setIdx((i) => i + 1); setSelected(null); setIsCorrect(null); }
    }, 1200);
  }, [selected, q, idx, questions.length, recordStudy, addWord, storeWords]);

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={s.container}>
        <div style={s.resultBox}>
          <div style={s.emoji}>{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}</div>
          <h2 style={s.resultTitle}>弱點複習完成！</h2>
          <p style={s.score}>{score} / {questions.length}（{pct}%）</p>
          {pct >= 80
            ? <p style={s.praise}>弱點都克服了！太棒了 🌟</p>
            : <p style={s.encourage}>繼續練習，你會越來越強的 💪</p>
          }
        </div>
      </div>
    );
  }

  const progress = (idx / questions.length) * 100;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <span style={s.headerTitle}>🔴 弱點複習</span>
        <span style={s.counter}>{idx + 1} / {questions.length}</span>
      </div>
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${progress}%`, backgroundColor: Colors.danger }} />
      </div>

      <div style={s.wordSection}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <p style={{ ...s.wordText, margin: 0 }}>{q.word.word}</p>
          <button style={s.speakBtn} onClick={() => playWord(q.word.word)} title="發音">🔊</button>
        </div>
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
        <>
          <p style={{ ...s.feedback, color: isCorrect ? Colors.success : Colors.danger }}>
            {isCorrect ? '正確！' : `答案：${q.word.meaning}`}
          </p>
          {q.word.example && (
            <p style={s.example}>{q.word.example}</p>
          )}
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: 520, margin: '0 auto' },
  emptyBox: {
    textAlign: 'center', padding: '4rem 2rem',
    backgroundColor: Colors.card, borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  },
  emoji: { fontSize: '3.5rem', marginBottom: '0.75rem' },
  emptyTitle: { color: Colors.text, margin: '0 0 0.5rem' },
  emptyDesc: { color: Colors.textSecondary },
  header: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' },
  headerTitle: { flex: 1, fontWeight: 700, color: Colors.text, fontSize: '1.05rem' },
  counter: { color: Colors.textSecondary, fontSize: '0.9rem', fontWeight: 600 },
  progressTrack: {
    height: 5, backgroundColor: Colors.surface, borderRadius: 3,
    overflow: 'hidden', marginBottom: '1.5rem',
  },
  progressFill: { height: '100%', borderRadius: 3, transition: 'width 0.3s ease' },
  wordSection: { textAlign: 'center', marginBottom: '2rem' },
  wordText: { fontSize: '2.2rem', fontWeight: 800, color: Colors.text, margin: '0 0 0.4rem' },
  phonetic: { color: Colors.textMuted, fontStyle: 'italic', margin: 0, fontSize: '1rem' },
  options: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' },
  optBtn: {
    padding: '1rem 1.25rem', border: 'none', borderRadius: 12,
    fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
    transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  feedback: { textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' },
  example: { textAlign: 'center', fontStyle: 'italic', color: Colors.textSecondary, fontSize: '0.85rem', margin: '0.4rem 0 0', lineHeight: 1.5 },
  speakBtn: { background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', opacity: 0.7, padding: '0.1rem' },
  resultBox: {
    backgroundColor: Colors.card, borderRadius: 16, padding: '2.5rem 2rem',
    textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  resultTitle: { color: Colors.text, margin: '0 0 0.5rem' },
  score: { fontSize: '1.5rem', fontWeight: 700, color: Colors.text, margin: '0 0 0.75rem' },
  praise: { color: Colors.success, fontWeight: 600 },
  encourage: { color: Colors.textSecondary },
};
