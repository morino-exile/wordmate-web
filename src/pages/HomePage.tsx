import { useState, useMemo, useRef, useEffect } from 'react';

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { characters } from '../data/characters';
import { Colors } from '../theme/colors';
import { useDaily } from '../hooks/useDaily';

// ── helpers ────────────────────────────────────────────────────────
function getRandLine(lines: string[]) {
  return lines[Math.floor(Math.random() * lines.length)] ?? '';
}

// ── sub-components ─────────────────────────────────────────────────

function StatCard({ num, label }: { num: string | number; label: string }) {
  return (
    <div style={sc.statCard}>
      <div style={sc.statNum}>{num}</div>
      <div style={sc.statLabel}>{label}</div>
    </div>
  );
}

function HabitBar({ label, value, max, unit, color, quickAmounts, onAdd, sliderMax, sliderStep }: {
  label: string; value: number; max: number; unit: string;
  color: string; quickAmounts: number[]; onAdd: (v: number) => void;
  sliderMax?: number; sliderStep?: number;
}) {
  const [sliderVal, setSliderVal] = useState(quickAmounts[0] ?? 1);
  const pct = Math.min((value / max) * 100, 100);
  const sMax = sliderMax ?? max;
  const sStep = sliderStep ?? 1;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{label}</span>
        <span style={{ fontSize: '0.78rem', color: Colors.textMuted }}>{value} / {max} {unit}</span>
      </div>
      <div style={sc.barBg}>
        <div style={{ ...sc.barFill, width: `${pct}%`, background: color }} />
      </div>
      {/* 快速按鈕 */}
      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' as const }}>
        {quickAmounts.map(a => (
          <QuickBtn key={a} onClick={() => onAdd(a)}>+{a}{unit}</QuickBtn>
        ))}
      </div>
      {/* 滑桿 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
        <input
          type="range" min={sStep} max={sMax} step={sStep}
          value={sliderVal}
          onChange={e => setSliderVal(Number(e.target.value))}
          style={{ flex: 1, accentColor: color, cursor: 'pointer' }}
        />
        <span style={{ fontSize: '0.8rem', color: Colors.textSecondary, minWidth: 40, textAlign: 'right' }}>
          {sliderVal}{unit}
        </span>
        <QuickBtn onClick={() => onAdd(sliderVal)}>+加入</QuickBtn>
      </div>
    </div>
  );
}

// ── 睡眠記錄（睡覺時間 + 起床時間）────────────────────────────────
function SleepTracker({ value, onAdd }: { value: number; onAdd: (v: number) => void }) {
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');

  function calcHours(bed: string, wake: string) {
    const [bh, bm] = bed.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);
    let mins = (wh * 60 + wm) - (bh! * 60 + bm!);
    if (mins <= 0) mins += 24 * 60; // 跨夜
    return Math.round(mins / 60 * 10) / 10;
  }

  const hours = calcHours(bedtime, wakeTime);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>睡眠</span>
        <span style={{ fontSize: '0.78rem', color: Colors.textMuted }}>
          {value > 0 ? `已記錄 ${value} hr` : '未記錄'}
        </span>
      </div>
      <div style={sc.barBg}>
        <div style={{ ...sc.barFill, width: `${Math.min(value / 8 * 100, 100)}%`, background: '#B8A5D4' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.78rem', color: Colors.textMuted }}>睡覺</span>
          <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)}
            style={sc.timeInput} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.78rem', color: Colors.textMuted }}>起床</span>
          <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
            style={sc.timeInput} />
        </div>
        <span style={{ fontSize: '0.8rem', color: Colors.textSecondary }}>= {hours} hr</span>
        <QuickBtn onClick={() => onAdd(hours)}>記錄</QuickBtn>
      </div>
    </div>
  );
}

function QuickBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  const handle = () => {
    setPressed(true);
    onClick();
    setTimeout(() => setPressed(false), 700);
  };
  return (
    <button onClick={handle} style={{ ...sc.quickBtn, ...(pressed ? sc.quickBtnPressed : {}) }}>
      {pressed ? '✓' : children}
    </button>
  );
}

// ── main ──────────────────────────────────────────────────────────

export default function HomePage() {
  const isMobile = useIsMobile();
  const { todayStudied, streak, selectedCharacterId, characterStates, getWordsForReview } = useStore();
  const { tasks, habits, loading, addTask, toggleTask, deleteTask, logHabit, today } = useDaily();
  const [newTask, setNewTask] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const character = characters.find(c => c.id === selectedCharacterId) ?? characters[0]!;
  const charState = characterStates[character.id];
  const greetingRef = useRef<string>('');
  useEffect(() => {
    if (charState && !greetingRef.current) {
      greetingRef.current = getRandLine(character.lines.greeting);
    }
  }, [charState, character]);
  const greeting = greetingRef.current || (charState ? getRandLine(character.lines.greeting) : '…');

  const reviewWords = useMemo(() => getWordsForReview(1), []);
  const reviewWord = reviewWords[0];

  const doneCount = tasks.filter(t => t.completed).length;

  // date display
  const dateLabel = (() => {
    const d = new Date(today + 'T12:00:00+08:00');
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日 週${weekday}`;
  })();

  async function handleAddTask() {
    const val = newTask.trim();
    if (!val) return;
    setNewTask('');
    await addTask(val);
    inputRef.current?.focus();
  }

  return (
    <div>
      {/* Date */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <h1 style={sc.dateH1}>{dateLabel}</h1>
        {streak > 0 && (
          <span style={sc.streakBadge}>🔥 連續 {streak} 天</span>
        )}
      </div>

      {/* 江途一句話 */}
      <div style={sc.jiantuBar}>
        <span style={sc.jiantuTag}>{character.name}</span>
        <p style={{ fontSize: '0.9rem' }}>{greeting}</p>
      </div>

      {/* Stats */}
      <div style={{ ...sc.statsRow, gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)' }}>
        <StatCard num={todayStudied} label="今日學字" />
        <StatCard num={`${doneCount}/${tasks.length}`} label="任務完成" />
        <StatCard num={habits.water} label="喝水 ml" />
        <StatCard num={`$${habits.spending}`} label="今日消費" />
      </div>

      {/* Tasks + Habits */}
      <div style={{ ...sc.grid2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>

        {/* 任務卡 */}
        <div style={sc.card}>
          <div style={sc.tape} />
          <div style={sc.cardTitle}>📋 今日任務</div>
          {loading ? (
            <p style={{ color: Colors.textMuted, fontSize: '0.85rem' }}>載入中…</p>
          ) : tasks.length === 0 ? (
            <p style={{ color: Colors.textMuted, fontSize: '0.85rem' }}>今天還沒有任務</p>
          ) : tasks.map(task => (
            <div key={task.id} style={sc.taskItem}>
              <div
                style={{ ...sc.taskCb, ...(task.completed ? sc.taskCbDone : {}) }}
                onClick={() => toggleTask(task.id, !task.completed)}
              >
                {task.completed && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ ...sc.taskText, ...(task.completed ? sc.taskTextDone : {}) }}>
                {task.content}
              </span>
              <button style={sc.taskDel} onClick={() => deleteTask(task.id)}>✕</button>
            </div>
          ))}
          <div style={sc.taskAdd}>
            <input
              ref={inputRef}
              style={sc.taskInput}
              placeholder="新增任務…"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            />
            <button style={sc.btnAdd} onClick={handleAddTask}>+</button>
          </div>
        </div>

        {/* 習慣卡 */}
        <div style={sc.card}>
          <div style={sc.cardTitle}>💧 今日習慣</div>
          <HabitBar label="喝水" value={habits.water} max={2000} unit="ml"
            color="#6A9EC0" quickAmounts={[200, 500]} sliderMax={2000} sliderStep={50}
            onAdd={v => logHabit('water', v)} />
          <HabitBar label="運動" value={habits.exercise} max={60} unit="分"
            color="#7DB88E" quickAmounts={[15, 30]} sliderMax={120} sliderStep={5}
            onAdd={v => logHabit('exercise', v)} />
          <HabitBar label="消費" value={habits.spending} max={500} unit="元"
            color="#E8B66A" quickAmounts={[50, 100]} sliderMax={1000} sliderStep={10}
            onAdd={v => logHabit('spending', v)} />
          <SleepTracker value={habits.sleep} onAdd={v => logHabit('sleep', v)} />
        </div>

      </div>

      {/* 單字快速複習 */}
      {reviewWord ? (
        <VocabCard word={reviewWord} />
      ) : (
        <div style={{ ...sc.card, textAlign: 'center', padding: '1.5rem', color: Colors.textMuted }}>
          今日單字全部複習完畢 🎉
        </div>
      )}

      {/* 快捷連結 */}
      <div style={sc.shortcuts}>
        <Link to="/dictionary" style={sc.shortcut}>📖 字典</Link>
        <Link to="/quiz" style={sc.shortcut}>🧪 測驗</Link>
        <Link to="/stats" style={sc.shortcut}>📊 統計</Link>
        <Link to="/todo" style={sc.shortcut}>📝 待辦</Link>
      </div>
    </div>
  );
}

// ── VocabCard ──────────────────────────────────────────────────────
function VocabCard({ word }: { word: { word: string; phonetic?: string; meaning: string } }) {
  const [shown, setShown] = useState(false);
  const { recordStudy } = useStore();
  return (
    <div style={{ ...sc.card, marginBottom: '1rem', transform: 'rotate(0.3deg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={sc.cardTitle}>⚡ 快速複習</div>
        <span style={sc.vocabBadge}>點擊翻面</span>
      </div>
      <div style={{ ...sc.vocabWord, cursor: shown ? 'default' : 'pointer' }} onClick={() => !shown && setShown(true)}>
        {word.word}
      </div>
      {word.phonetic && <div style={sc.vocabPhonetic}>{word.phonetic}</div>}
      {!shown && (
        <div style={{ textAlign: 'center', color: Colors.textMuted, fontSize: '0.85rem', marginBottom: '1.25rem', cursor: 'pointer' }}
          onClick={() => setShown(true)}>
          點擊單字翻面
        </div>
      )}
      {shown && (
        <>
          <div style={sc.vocabMeaning}>{word.meaning}</div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button style={sc.btnWrong} onClick={() => { recordStudy(false); setShown(false); }}>✕ 不熟</button>
            <button style={sc.btnRight} onClick={() => { recordStudy(true); setShown(false); }}>✓ 記得</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── styles ─────────────────────────────────────────────────────────
const sc: Record<string, React.CSSProperties> = {
  dateH1: { fontFamily: Colors.fontHeading, fontSize: '1.8rem', fontWeight: 700 },
  streakBadge: {
    fontSize: '0.85rem', color: Colors.textSecondary,
    border: `2px dashed ${Colors.surfaceLight}`, padding: '0.2rem 0.6rem',
    borderRadius: Colors.wobbly,
  },
  jiantuBar: {
    background: Colors.cardLight,
    border: `2px solid ${Colors.border}`,
    borderRadius: '3px 15px 3px 15px / 15px 3px 15px 3px',
    boxShadow: Colors.shadow,
    padding: '0.75rem 1rem',
    marginBottom: '1.25rem',
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    transform: 'rotate(-0.5deg)',
  },
  jiantuTag: {
    fontFamily: Colors.fontHeading, fontSize: '0.75rem',
    background: Colors.text, color: Colors.background,
    padding: '0.15rem 0.5rem', borderRadius: 4, whiteSpace: 'nowrap',
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
    gap: '0.75rem', marginBottom: '1.25rem',
  },
  statCard: {
    background: Colors.card, border: `2px solid ${Colors.border}`,
    borderRadius: Colors.wobbly,
    boxShadow: Colors.shadowSm,
    padding: '0.75rem 0.5rem', textAlign: 'center',
  },
  statNum: { fontFamily: Colors.fontHeading, fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: '0.72rem', color: Colors.textMuted, marginTop: '0.2rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
  card: {
    background: Colors.card, border: `2px solid ${Colors.border}`,
    borderRadius: Colors.wobblyAlt,
    boxShadow: Colors.shadow,
    padding: '1.25rem', position: 'relative',
    marginBottom: '1rem',
  },
  tape: {
    position: 'absolute', top: -10, left: '50%',
    transform: 'translateX(-50%) rotate(-2deg)',
    width: 60, height: 20,
    background: 'rgba(200,200,200,0.5)',
    border: '1px solid rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontFamily: Colors.fontHeading, fontSize: '1rem', fontWeight: 700,
    marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
  },
  taskItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem 0', borderBottom: `1px dashed ${Colors.surfaceLight}` },
  taskCb: {
    width: 20, height: 20, border: `2px solid ${Colors.border}`,
    borderRadius: '255px 5px 225px 5px / 5px 225px 5px 255px',
    flexShrink: 0, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'white',
  },
  taskCbDone: { background: Colors.text },
  taskText: { flex: 1, fontSize: '0.9rem' },
  taskDel: {
    background: 'none', border: 'none', color: Colors.textMuted,
    fontSize: '0.75rem', cursor: 'pointer', padding: '0 0.2rem', lineHeight: 1,
    flexShrink: 0,
  },
  taskTextDone: { color: Colors.textMuted, textDecoration: 'line-through' },
  taskAdd: { display: 'flex', gap: '0.5rem', marginTop: '0.85rem' },
  taskInput: {
    flex: 1, padding: '0.45rem 0.75rem',
    border: `2px solid ${Colors.border}`,
    borderRadius: Colors.wobbly,
    background: Colors.background,
    fontFamily: Colors.fontBody, fontSize: '0.875rem', color: Colors.text, outline: 'none',
  },
  btnAdd: {
    padding: '0.45rem 1rem', border: `2px solid ${Colors.border}`,
    borderRadius: Colors.wobbly,
    background: Colors.text, color: Colors.background,
    fontFamily: Colors.fontBody, fontSize: '0.875rem', cursor: 'pointer',
    boxShadow: Colors.shadowSm,
  },
  barBg: { height: 10, background: Colors.surfaceLight, border: `1.5px solid ${Colors.border}`, borderRadius: 255, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 255, transition: 'width 0.4s' },
  quickBtn: {
    padding: '0.2rem 0.6rem', border: `1.5px solid ${Colors.border}`,
    borderRadius: '255px 5px 225px 5px / 5px 225px 5px 255px',
    background: Colors.background, fontFamily: Colors.fontBody, fontSize: '0.75rem',
    cursor: 'pointer', boxShadow: Colors.shadowSm, color: Colors.text,
  },
  quickBtnPressed: { background: Colors.text, color: Colors.background, boxShadow: 'none' },
  vocabBadge: {
    fontSize: '0.75rem', background: Colors.cardLight,
    border: `1.5px solid ${Colors.border}`, borderRadius: 4,
    padding: '0.15rem 0.5rem', transform: 'rotate(-1deg)',
    display: 'inline-block', boxShadow: Colors.shadowSm,
  },
  vocabWord: { fontFamily: Colors.fontHeading, fontSize: '2.2rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.2rem' },
  vocabPhonetic: { textAlign: 'center', fontSize: '0.875rem', color: Colors.textMuted, marginBottom: '0.75rem' },
  vocabMeaning: {
    textAlign: 'center', fontSize: '1.05rem',
    background: Colors.background, border: `1.5px dashed ${Colors.surfaceLight}`,
    borderRadius: 8, padding: '0.5rem', marginBottom: '1.25rem', cursor: 'pointer',
  },
  btnWrong: {
    padding: '0.5rem 1.5rem', border: `2px solid ${Colors.danger}`,
    borderRadius: Colors.wobbly,
    background: 'white', color: Colors.danger,
    fontFamily: Colors.fontBody, fontSize: '0.9rem', cursor: 'pointer',
    boxShadow: `3px 3px 0 ${Colors.danger}`, fontWeight: 700,
  },
  btnRight: {
    padding: '0.5rem 1.5rem', border: `2px solid ${Colors.success}`,
    borderRadius: Colors.wobbly,
    background: Colors.success, color: 'white',
    fontFamily: Colors.fontBody, fontSize: '0.9rem', cursor: 'pointer',
    boxShadow: `3px 3px 0 #1a4a22`, fontWeight: 700,
  },
  timeInput: {
    padding: '0.25rem 0.5rem',
    border: `2px solid ${Colors.border}`,
    borderRadius: 8,
    background: Colors.background,
    fontFamily: Colors.fontBody,
    fontSize: '0.85rem',
    color: Colors.text,
    outline: 'none',
    cursor: 'pointer',
  },
  shortcuts: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' },
  shortcut: {
    padding: '0.5rem 1rem', border: `2px solid ${Colors.border}`,
    borderRadius: Colors.wobbly,
    background: Colors.card, color: Colors.text,
    textDecoration: 'none', fontFamily: Colors.fontBody, fontSize: '0.875rem',
    boxShadow: Colors.shadowSm,
  },
};
