import { useState } from 'react';
import { useStore } from '../store/useStore';
import { characters } from '../data/characters';
import { Colors } from '../theme/colors';
import { useHabitHistory, type HabitDay } from '../hooks/useHabitHistory';
import type { TodoItem } from '../store/useStore';

function getRandomLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)] ?? '';
}
function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }

const WEEKDAYS_LABEL = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAY_OPTIONS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
type FilterType = 'all' | 'pending' | 'done';
type RepeatType = 'none' | 'weekly';

// ---- TodoItem 擴充（存在 store 的 dueDate 用來存截止時間；repeatDays/repeatTime 存在 text 外的欄位暫用 JSON hack）
interface TodoMeta {
  dueDate?: number;      // 截止 timestamp
  dueTime?: string;      // 'HH:MM'
  repeat: RepeatType;
  repeatDays?: number[]; // 0=日 ~ 6=六
  repeatTime?: string;   // 'HH:MM'
}

function parseMeta(todo: TodoItem): TodoMeta {
  try {
    const m = JSON.parse(todo.text.split('\x00')[1] ?? '{}');
    return { repeat: 'none', ...m };
  } catch { return { repeat: 'none' }; }
}
function encodeText(text: string, meta: TodoMeta) {
  return text + '\x00' + JSON.stringify(meta);
}
function displayText(todo: TodoItem) {
  return todo.text.split('\x00')[0];
}

export default function TodoPage() {
  const { todos, addTodo, toggleTodo, deleteTodo, selectedCharacterId, studyHistory } = useStore();
  const character = characters.find((c) => c.id === selectedCharacterId) ?? characters[0];

  // ── 月曆狀態 ──
  const today = new Date();
  const [curYear, setCurYear] = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth());
  const [selDay, setSelDay] = useState<number | null>(today.getDate());

  // ── 表單狀態 ──
  const [input, setInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [repeat, setRepeat] = useState<RepeatType>('none');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [repeatTime, setRepeatTime] = useState('');
  const [showForm, setShowForm] = useState(false);

  // ── 提醒泡泡 ──
  const [reminder, setReminder] = useState('');
  const [showReminder, setShowReminder] = useState(false);

  const [filter, setFilter] = useState<FilterType>('all');

  // ── 月曆計算 ──
  const daysInMonth = getDaysInMonth(curYear, curMonth);
  const firstDay = getFirstDay(curYear, curMonth);
  const calDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const prevMonth = () => {
    if (curMonth === 0) { setCurYear(y => y - 1); setCurMonth(11); } else setCurMonth(m => m - 1);
    setSelDay(null);
  };
  const nextMonth = () => {
    if (curMonth === 11) { setCurYear(y => y + 1); setCurMonth(0); } else setCurMonth(m => m + 1);
    setSelDay(null);
  };

  const getDots = (day: number) => {
    const key = formatDateKey(curYear, curMonth, day);
    const rec = studyHistory[key];
    const hasTodo = todos.some((t) => {
      const meta = parseMeta(t);
      if (meta.dueDate) {
        const d = new Date(meta.dueDate);
        return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate()) === key;
      }
      const d = new Date(t.createdAt);
      return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate()) === key;
    });
    return {
      hasStudy: !!rec && (rec.wordsStudied > 0 || rec.quizzesTaken > 0),
      hasTodo,
    };
  };

  const isToday = (d: number) =>
    curYear === today.getFullYear() && curMonth === today.getMonth() && d === today.getDate();

  const selKey = selDay ? formatDateKey(curYear, curMonth, selDay) : null;
  const todosForDay = selKey ? todos.filter((t) => {
    const meta = parseMeta(t);
    const ts = meta.dueDate ?? t.createdAt;
    const d = new Date(ts);
    return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate()) === selKey;
  }) : [];
  const selStudy = selKey ? studyHistory[selKey] : null;

  // ── 新增 ──
  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    const meta: TodoMeta = {
      repeat,
      dueDate: dueDate ? new Date(dueDate + (dueTime ? `T${dueTime}` : 'T00:00')).getTime() : undefined,
      dueTime: dueTime || undefined,
      repeatDays: repeat === 'weekly' ? repeatDays : undefined,
      repeatTime: repeat === 'weekly' ? repeatTime || undefined : undefined,
    };
    addTodo(encodeText(text, meta), meta.dueDate);
    setInput(''); setDueDate(''); setDueTime('');
    setRepeat('none'); setRepeatDays([]); setRepeatTime('');
    setShowForm(false);

    const line = getRandomLine(character.lines.remindTodo);
    setReminder(line); setShowReminder(true);
    setTimeout(() => setShowReminder(false), 5000);
  };

  const toggleRepeatDay = (d: number) =>
    setRepeatDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  // ── 篩選清單 ──
  const filtered = todos.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const ma = parseMeta(a); const mb = parseMeta(b);
    return (ma.dueDate ?? a.createdAt) - (mb.dueDate ?? b.createdAt);
  });

  const pendingCount = todos.filter((t) => !t.completed).length;
  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <div style={s.page}>

      {/* ── 月曆 ── */}
      <div style={s.card}>
        <div style={s.calHeader}>
          <button style={s.navBtn} onClick={prevMonth}>‹</button>
          <span style={s.calTitle}>{curYear} 年 {curMonth + 1} 月</span>
          <button style={s.navBtn} onClick={nextMonth}>›</button>
          <button style={s.todayBtn} onClick={() => { setCurYear(today.getFullYear()); setCurMonth(today.getMonth()); setSelDay(today.getDate()); }}>今天</button>
        </div>
        <div style={s.weekRow}>{WEEKDAYS_LABEL.map((d) => <span key={d} style={s.weekLabel}>{d}</span>)}</div>
        <div style={s.calGrid}>
          {calDays.map((day, idx) => {
            if (!day) return <div key={`e${idx}`} />;
            const dots = getDots(day);
            const sel = selDay === day;
            const tod = isToday(day);
            return (
              <button key={day} style={{ ...s.dayCell, backgroundColor: sel ? Colors.primary : tod ? Colors.primaryLight + '55' : 'transparent', color: sel ? '#fff' : tod ? Colors.primary : Colors.text, fontWeight: sel || tod ? 700 : 400 }} onClick={() => setSelDay(day)}>
                {day}
                <div style={s.dotsRow}>
                  {dots.hasStudy && <span style={{ ...s.dot, backgroundColor: Colors.success }} />}
                  {dots.hasTodo && <span style={{ ...s.dot, backgroundColor: Colors.accent }} />}
                </div>
              </button>
            );
          })}
        </div>
        <div style={s.legend}>
          <span style={s.legendItem}><span style={{ ...s.dot, backgroundColor: Colors.success }} /> 學習</span>
          <span style={s.legendItem}><span style={{ ...s.dot, backgroundColor: Colors.accent }} /> 計畫</span>
        </div>

        {selDay && (
          <div style={s.dayDetail}>
            <div style={s.dayDetailTitle}>{curMonth + 1}/{selDay} 紀錄</div>
            {selStudy && (selStudy.wordsStudied > 0 || selStudy.quizzesTaken > 0)
              ? <div style={s.studyBadge}>📖 學了 {selStudy.wordsStudied} 個單字・{selStudy.quizzesTaken} 次測驗</div>
              : <div style={s.noRecord}>這天沒有學習紀錄</div>}
            {todosForDay.length > 0
              ? todosForDay.map((t) => (
                <div key={t.id} style={s.dayTodoItem}>
                  <span style={t.completed ? s.doneDot : s.pendingDot} />
                  <span style={{ fontSize: '0.85rem', color: t.completed ? Colors.textMuted : Colors.text, textDecoration: t.completed ? 'line-through' : 'none' }}>{displayText(t)}</span>
                </div>
              ))
              : <div style={s.noRecord}>這天沒有待辦</div>}
          </div>
        )}
      </div>

      {/* ── 角色提醒 ── */}
      {showReminder && (
        <div style={{ ...s.bubble, borderColor: character.themeColor }}>
          <div style={s.bubbleLeft}>
            <span style={{ fontSize: '1.5rem' }}>{character.emoji}</span>
            <span style={s.bubbleName}>{character.name}</span>
          </div>
          <span style={s.bubbleText}>「{reminder}」</span>
          <button style={s.bubbleClose} onClick={() => setShowReminder(false)}>✕</button>
        </div>
      )}

      {/* ── 新增表單 ── */}
      <div style={s.card}>
        <div style={s.widgetLabel}>📋 計畫清單</div>

        {/* 快速輸入列 */}
        <div style={s.inputRow}>
          <input style={s.textInput} placeholder="新增待辦... (Enter 送出)" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          <button style={s.expandBtn} onClick={() => setShowForm((v) => !v)} title="更多設定">
            {showForm ? '▲' : '⚙️'}
          </button>
          <button style={{ ...s.addBtn, opacity: input.trim() ? 1 : 0.45 }} onClick={handleAdd} disabled={!input.trim()}>＋</button>
        </div>

        {/* 展開設定 */}
        {showForm && (
          <div style={s.formBox}>
            <div style={s.formRow}>
              <label style={s.formLabel}>📅 截止日期</label>
              <input type="date" style={s.formInput} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <input type="time" style={{ ...s.formInput, width: 110 }} value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </div>

            <div style={s.formRow}>
              <label style={s.formLabel}>🔁 重複</label>
              <div style={s.repeatBtns}>
                {(['none', 'weekly'] as RepeatType[]).map((r) => (
                  <button key={r} style={{ ...s.repeatBtn, ...(repeat === r ? s.repeatBtnActive : {}) }} onClick={() => setRepeat(r)}>
                    {{ none: '單次', weekly: '每週' }[r]}
                  </button>
                ))}
              </div>
            </div>

            {repeat === 'weekly' && (
              <>
                <div style={s.formRow}>
                  <label style={s.formLabel}>星期</label>
                  <div style={s.dayBtns}>
                    {WEEKDAY_OPTIONS.map((label, i) => (
                      <button key={i} style={{ ...s.dayBtn, ...(repeatDays.includes(i) ? s.dayBtnActive : {}) }} onClick={() => toggleRepeatDay(i)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={s.formRow}>
                  <label style={s.formLabel}>時間</label>
                  <input type="time" style={{ ...s.formInput, width: 110 }} value={repeatTime} onChange={(e) => setRepeatTime(e.target.value)} />
                </div>
              </>
            )}
          </div>
        )}

        {/* 統計 + 篩選 */}
        <div style={s.filterRow}>
          <div style={s.chips}>
            <span style={s.chipPending}>待完成 {pendingCount}</span>
            <span style={s.chipDone}>已完成 {doneCount}</span>
          </div>
          <div style={s.filterBtns}>
            {(['all', 'pending', 'done'] as FilterType[]).map((f) => (
              <button key={f} style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }} onClick={() => setFilter(f)}>
                {{ all: '全部', pending: '待辦', done: '完成' }[f]}
              </button>
            ))}
          </div>
        </div>

        {/* 清單 */}
        {filtered.length === 0
          ? <div style={s.empty}><span style={{ fontSize: '2rem' }}>{filter === 'done' ? '📭' : '✨'}</span><p style={s.emptyText}>{filter === 'done' ? '還沒有完成的項目' : '沒有待辦，很棒！'}</p></div>
          : <div style={s.list}>
            {filtered.map((todo) => {
              const meta = parseMeta(todo);
              const isOverdue = !todo.completed && meta.dueDate && meta.dueDate < Date.now();
              const dueDateStr = meta.dueDate
                ? new Date(meta.dueDate).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: meta.dueTime ? '2-digit' : undefined, minute: meta.dueTime ? '2-digit' : undefined })
                : null;
              const repeatStr = meta.repeat === 'weekly' && meta.repeatDays?.length
                ? `每週 ${meta.repeatDays.map((d) => WEEKDAY_OPTIONS[d]).join('、')}${meta.repeatTime ? ' ' + meta.repeatTime : ''}`
                : null;

              return (
                <div key={todo.id} style={{ ...s.todoItem, opacity: todo.completed ? 0.5 : 1 }}>
                  <button style={{ ...s.checkbox, backgroundColor: todo.completed ? Colors.success : 'transparent', borderColor: todo.completed ? Colors.success : Colors.textMuted }} onClick={() => toggleTodo(todo.id)}>
                    {todo.completed && <span style={{ color: '#fff', fontSize: '0.7rem' }}>✓</span>}
                  </button>
                  <div style={s.todoContent}>
                    <span style={{ ...s.todoText, textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? Colors.textMuted : Colors.text }}>
                      {displayText(todo)}
                    </span>
                    <div style={s.tagsRow}>
                      {dueDateStr && <span style={{ ...s.tag, color: isOverdue ? Colors.danger : Colors.textMuted, backgroundColor: isOverdue ? Colors.dangerBg : Colors.surfaceLight }}>
                        {isOverdue ? '⚠️ ' : '📅 '}{dueDateStr}
                      </span>}
                      {repeatStr && <span style={{ ...s.tag, color: Colors.secondary, backgroundColor: Colors.secondary + '22' }}>🔁 {repeatStr}</span>}
                    </div>
                  </div>
                  <button style={s.deleteBtn} onClick={() => deleteTodo(todo.id)}>✕</button>
                </div>
              );
            })}
          </div>}

        {doneCount > 0 && (
          <button style={s.clearBtn} onClick={() => todos.filter((t) => t.completed).forEach((t) => deleteTodo(t.id))}>
            🗑 清除已完成（{doneCount}）
          </button>
        )}
      </div>

      <HabitCharts />
    </div>
  );
}

// ── 習慣折線圖 ────────────────────────────────────────────────────────

const HABIT_CONFIG = [
  { key: 'water',    label: '喝水',   unit: 'ml',  color: '#6A9EC0', max: 2000 },
  { key: 'exercise', label: '運動',   unit: 'min', color: '#7DB88E', max: 120  },
  { key: 'spending', label: '消費',   unit: '元',  color: '#E8B66A', max: 1000 },
  { key: 'sleep',    label: '睡眠',   unit: 'hr',  color: '#B8A5D4', max: 10   },
] as const;

function Sparkline({ data, color, max }: { data: number[]; color: string; max: number }) {
  const W = 280, H = 50, PAD = 4;
  const n = data.length;
  if (n < 2) return null;
  const xStep = (W - PAD * 2) / (n - 1);
  const yScale = (v: number) => H - PAD - (Math.min(v, max) / max) * (H - PAD * 2);
  const points = data.map((v, i) => `${PAD + i * xStep},${yScale(v)}`).join(' ');
  const areaPoints = `${PAD},${H} ` + points + ` ${PAD + (n - 1) * xStep},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <polygon points={areaPoints} fill={color} opacity={0.15} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {data.map((v, i) => v > 0 && (
        <circle key={i} cx={PAD + i * xStep} cy={yScale(v)} r={3} fill={color} />
      ))}
    </svg>
  );
}

function HabitCharts() {
  const history = useHabitHistory(14);

  return (
    <div style={s.card}>
      <div style={s.widgetLabel}>📈 習慣趨勢（最近 14 天）</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {HABIT_CONFIG.map(cfg => {
          const data = history.map(d => d[cfg.key as keyof HabitDay] as number);
          const total = data.reduce((a, b) => a + b, 0);
          const activeDays = data.filter(v => v > 0).length;
          return (
            <div key={cfg.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                <span style={{ fontSize: '0.7rem', color: Colors.textMuted }}>
                  {activeDays} 天有記錄
                </span>
              </div>
              <Sparkline data={data} color={cfg.color} max={cfg.max} />
              <div style={{ fontSize: '0.7rem', color: Colors.textMuted, marginTop: '0.2rem', textAlign: 'right' }}>
                累計 {total.toFixed(cfg.key === 'sleep' ? 1 : 0)}{cfg.unit}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '1rem', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  card: { backgroundColor: Colors.card, borderRadius: 14, padding: '1rem 1.1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  widgetLabel: { fontSize: '0.85rem', fontWeight: 700, color: Colors.textSecondary, marginBottom: '0.75rem' },

  calHeader: { display: 'flex', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem' },
  navBtn: { background: 'none', border: 'none', fontSize: '1.4rem', color: Colors.text, cursor: 'pointer', padding: '0 0.2rem', lineHeight: 1 },
  calTitle: { flex: 1, fontWeight: 700, color: Colors.text, fontSize: '1rem' },
  todayBtn: { fontSize: '0.75rem', padding: '0.25rem 0.6rem', backgroundColor: Colors.surface, border: `1px solid ${Colors.surfaceLight}`, borderRadius: 8, color: Colors.textSecondary, cursor: 'pointer' },
  weekRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.2rem' },
  weekLabel: { textAlign: 'center', fontSize: '0.72rem', color: Colors.textMuted, padding: '0.2rem 0', fontWeight: 600 },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.12rem', marginBottom: '0.5rem' },
  dayCell: { border: 'none', borderRadius: 7, padding: '0.3rem 0', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.82rem', transition: 'background 0.15s' },
  dotsRow: { display: 'flex', gap: 2, marginTop: 2, minHeight: 5 },
  dot: { width: 4, height: 4, borderRadius: '50%', display: 'inline-block' },
  legend: { display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '0.4rem' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: Colors.textMuted },
  dayDetail: { borderTop: `1px solid ${Colors.surfaceLight}`, paddingTop: '0.7rem', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  dayDetailTitle: { fontWeight: 700, color: Colors.text, fontSize: '0.88rem' },
  studyBadge: { fontSize: '0.8rem', color: Colors.success, backgroundColor: Colors.successBg, padding: '0.3rem 0.6rem', borderRadius: 8, display: 'inline-block' },
  noRecord: { fontSize: '0.8rem', color: Colors.textMuted },
  dayTodoItem: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  doneDot: { width: 7, height: 7, borderRadius: '50%', backgroundColor: Colors.success, flexShrink: 0 },
  pendingDot: { width: 7, height: 7, borderRadius: '50%', backgroundColor: Colors.accent, flexShrink: 0 },

  bubble: { display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: Colors.card, border: '2px solid', borderRadius: 14, padding: '0.85rem 1rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
  bubbleLeft: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' },
  bubbleName: { fontSize: '0.7rem', color: Colors.textMuted, fontWeight: 600 },
  bubbleText: { flex: 1, color: Colors.textSecondary, fontStyle: 'italic', fontSize: '0.88rem', lineHeight: 1.55 },
  bubbleClose: { background: 'none', border: 'none', color: Colors.textMuted, cursor: 'pointer', fontSize: '0.9rem' },

  inputRow: { display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' },
  textInput: { flex: 1, padding: '0.7rem 0.9rem', border: `2px solid ${Colors.surfaceLight}`, borderRadius: 10, backgroundColor: Colors.surface, color: Colors.text, fontSize: '0.95rem', outline: 'none' },
  expandBtn: { padding: '0.7rem 0.75rem', background: Colors.surface, border: `1px solid ${Colors.surfaceLight}`, borderRadius: 10, cursor: 'pointer', fontSize: '0.9rem' },
  addBtn: { padding: '0.7rem 1rem', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1.2rem', cursor: 'pointer' },

  formBox: { backgroundColor: Colors.surface, borderRadius: 10, padding: '0.85rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  formRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' },
  formLabel: { fontSize: '0.82rem', color: Colors.textSecondary, fontWeight: 600, minWidth: 60 },
  formInput: { padding: '0.4rem 0.6rem', border: `1px solid ${Colors.surfaceLight}`, borderRadius: 8, backgroundColor: Colors.card, color: Colors.text, fontSize: '0.85rem' },
  repeatBtns: { display: 'flex', gap: '0.35rem' },
  repeatBtn: { padding: '0.3rem 0.75rem', border: `1px solid ${Colors.surfaceLight}`, borderRadius: 20, backgroundColor: 'transparent', color: Colors.textSecondary, fontSize: '0.8rem', cursor: 'pointer' },
  repeatBtnActive: { backgroundColor: Colors.secondary, color: '#fff', borderColor: Colors.secondary },
  dayBtns: { display: 'flex', gap: '0.3rem', flexWrap: 'wrap' },
  dayBtn: { padding: '0.25rem 0.5rem', border: `1px solid ${Colors.surfaceLight}`, borderRadius: 8, backgroundColor: 'transparent', color: Colors.textSecondary, fontSize: '0.78rem', cursor: 'pointer' },
  dayBtnActive: { backgroundColor: Colors.accent, color: '#fff', borderColor: Colors.accent },

  filterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem', flexWrap: 'wrap', gap: '0.4rem' },
  chips: { display: 'flex', gap: '0.35rem' },
  chipPending: { fontSize: '0.78rem', padding: '0.2rem 0.55rem', backgroundColor: Colors.dangerBg, color: Colors.danger, borderRadius: 20, fontWeight: 600 },
  chipDone: { fontSize: '0.78rem', padding: '0.2rem 0.55rem', backgroundColor: Colors.successBg, color: Colors.success, borderRadius: 20, fontWeight: 600 },
  filterBtns: { display: 'flex', gap: '0.3rem' },
  filterBtn: { padding: '0.25rem 0.65rem', border: `1px solid ${Colors.surfaceLight}`, borderRadius: 20, backgroundColor: 'transparent', color: Colors.textSecondary, fontSize: '0.78rem', cursor: 'pointer' },
  filterActive: { backgroundColor: Colors.primary, color: '#fff', borderColor: Colors.primary },

  list: { display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.5rem' },
  todoItem: { display: 'flex', alignItems: 'flex-start', gap: '0.7rem', backgroundColor: Colors.surface, borderRadius: 10, padding: '0.75rem 0.9rem' },
  checkbox: { width: 22, height: 22, borderRadius: '50%', border: '2px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  todoContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  todoText: { fontSize: '0.93rem', lineHeight: 1.4 },
  tagsRow: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' },
  tag: { fontSize: '0.73rem', padding: '0.15rem 0.5rem', borderRadius: 8, fontWeight: 500 },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: Colors.textMuted, fontSize: '0.8rem', padding: '0.2rem', flexShrink: 0 },

  empty: { textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' },
  emptyText: { color: Colors.textMuted, fontSize: '0.9rem', margin: 0 },
  clearBtn: { marginTop: '0.75rem', width: '100%', padding: '0.6rem', backgroundColor: 'transparent', border: `1px solid ${Colors.surfaceLight}`, borderRadius: 10, color: Colors.textMuted, fontSize: '0.82rem', cursor: 'pointer' },
};
