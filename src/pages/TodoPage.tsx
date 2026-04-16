import { useState } from 'react';
import { useStore } from '../store/useStore';
import { characters } from '../data/characters';
import { Colors } from '../theme/colors';

function getRandomLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)] ?? '';
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
type FilterType = 'all' | 'pending' | 'done';

export default function TodoPage() {
  const { todos, addTodo, toggleTodo, deleteTodo, selectedCharacterId, studyHistory } = useStore();
  const character = characters.find((c) => c.id === selectedCharacterId) ?? characters[0];

  // ---- 月曆狀態 ----
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  // ---- 待辦狀態 ----
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [reminder, setReminder] = useState('');
  const [showReminder, setShowReminder] = useState(false);

  // ---- 月曆計算 ----
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  // 某日有無標記
  const getDayDots = (day: number) => {
    const key = formatDateKey(currentYear, currentMonth, day);
    const record = studyHistory[key];
    const hasTodo = todos.some((t) => {
      const d = new Date(t.createdAt);
      return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate()) === key;
    });
    return {
      hasStudy: !!record && (record.wordsStudied > 0 || record.quizzesTaken > 0),
      hasTodo,
    };
  };

  const isToday = (day: number) =>
    currentYear === today.getFullYear() &&
    currentMonth === today.getMonth() &&
    day === today.getDate();

  // ---- 選中日的待辦 ----
  const selectedKey = selectedDay
    ? formatDateKey(currentYear, currentMonth, selectedDay)
    : null;

  const todosForDay = selectedKey
    ? todos.filter((t) => {
        const d = new Date(t.createdAt);
        return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate()) === selectedKey;
      })
    : [];

  const selectedStudy = selectedKey ? studyHistory[selectedKey] : null;

  // ---- 新增待辦 ----
  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    addTodo(text);
    setInput('');

    const line = getRandomLine(character.lines.remindTodo);
    setReminder(line);
    setShowReminder(true);
    setTimeout(() => setShowReminder(false), 5000);
  };

  // ---- 全部待辦篩選 ----
  const allFiltered = todos.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  const pendingCount = todos.filter((t) => !t.completed).length;
  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <div style={s.page}>

      {/* ── 月曆區塊 ── */}
      <div style={s.card}>
        {/* 月份切換 */}
        <div style={s.calHeader}>
          <button style={s.calNavBtn} onClick={prevMonth}>‹</button>
          <span style={s.calTitle}>{currentYear} 年 {currentMonth + 1} 月</span>
          <button style={s.calNavBtn} onClick={nextMonth}>›</button>
          <button style={s.todayBtn} onClick={() => {
            setCurrentYear(today.getFullYear());
            setCurrentMonth(today.getMonth());
            setSelectedDay(today.getDate());
          }}>今天</button>
        </div>

        {/* 星期列 */}
        <div style={s.weekRow}>
          {WEEKDAYS.map((d) => <span key={d} style={s.weekLabel}>{d}</span>)}
        </div>

        {/* 日期格子 */}
        <div style={s.calGrid}>
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`e${idx}`} />;
            const dots = getDayDots(day);
            const selected = selectedDay === day;
            const isTod = isToday(day);
            return (
              <button
                key={day}
                style={{
                  ...s.dayCell,
                  backgroundColor: selected ? Colors.primary : isTod ? Colors.primaryLight + '44' : 'transparent',
                  color: selected ? '#fff' : isTod ? Colors.primary : Colors.text,
                  fontWeight: isTod || selected ? 700 : 400,
                }}
                onClick={() => setSelectedDay(day)}
              >
                {day}
                <div style={s.dotsRow}>
                  {dots.hasStudy && <span style={{ ...s.dot, backgroundColor: Colors.success }} />}
                  {dots.hasTodo && <span style={{ ...s.dot, backgroundColor: Colors.accent }} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* 圖例 */}
        <div style={s.legend}>
          <span style={s.legendItem}><span style={{ ...s.dot, backgroundColor: Colors.success }} /> 有學習</span>
          <span style={s.legendItem}><span style={{ ...s.dot, backgroundColor: Colors.accent }} /> 有待辦</span>
        </div>

        {/* 選中日摘要 */}
        {selectedDay && (
          <div style={s.dayDetail}>
            <div style={s.dayDetailTitle}>
              {currentMonth + 1}/{selectedDay} 紀錄
            </div>
            {selectedStudy && (selectedStudy.wordsStudied > 0 || selectedStudy.quizzesTaken > 0) ? (
              <div style={s.studyBadge}>
                📖 學了 {selectedStudy.wordsStudied} 個單字・做了 {selectedStudy.quizzesTaken} 次測驗
              </div>
            ) : (
              <div style={s.noStudy}>這天沒有學習紀錄</div>
            )}
            {todosForDay.length > 0 ? (
              <div style={s.dayTodoList}>
                {todosForDay.map((t) => (
                  <div key={t.id} style={s.dayTodoItem}>
                    <span style={t.completed ? s.doneDot : s.pendingDot} />
                    <span style={{ ...s.dayTodoText, textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? Colors.textMuted : Colors.text }}>
                      {t.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={s.noStudy}>這天沒有待辦事項</div>
            )}
          </div>
        )}
      </div>

      {/* ── 角色提醒泡泡 ── */}
      {showReminder && (
        <div style={{ ...s.reminderBubble, borderColor: character.themeColor }}>
          <div style={s.reminderLeft}>
            <span style={s.reminderEmoji}>{character.emoji}</span>
            <span style={s.reminderName}>{character.name}</span>
          </div>
          <span style={s.reminderText}>「{reminder}」</span>
          <button style={s.reminderClose} onClick={() => setShowReminder(false)}>✕</button>
        </div>
      )}

      {/* ── 新增待辦 ── */}
      <div style={s.card}>
        <div style={s.widgetLabel}>📋 待辦清單</div>
        <div style={s.inputRow}>
          <input
            style={s.textInput}
            placeholder="新增待辦事項... (Enter 送出)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            style={{ ...s.addBtn, opacity: input.trim() ? 1 : 0.45 }}
            onClick={handleAdd}
            disabled={!input.trim()}
          >＋</button>
        </div>

        {/* 統計 + 篩選 */}
        <div style={s.filterRow}>
          <div style={s.statsChips}>
            <span style={s.chipPending}>待完成 {pendingCount}</span>
            <span style={s.chipDone}>已完成 {doneCount}</span>
          </div>
          <div style={s.filterBtns}>
            {(['all', 'pending', 'done'] as FilterType[]).map((f) => (
              <button key={f}
                style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}
                onClick={() => setFilter(f)}
              >
                {{ all: '全部', pending: '待辦', done: '完成' }[f]}
              </button>
            ))}
          </div>
        </div>

        {/* 清單 */}
        {allFiltered.length === 0 ? (
          <div style={s.empty}>
            <span style={{ fontSize: '2rem' }}>{filter === 'done' ? '📭' : '✨'}</span>
            <p style={s.emptyText}>
              {filter === 'done' ? '還沒有完成的項目' : '沒有待辦，很棒！'}
            </p>
          </div>
        ) : (
          <div style={s.list}>
            {allFiltered.map((todo) => (
              <div key={todo.id} style={{ ...s.todoItem, opacity: todo.completed ? 0.55 : 1 }}>
                <button
                  style={{
                    ...s.checkbox,
                    backgroundColor: todo.completed ? Colors.success : 'transparent',
                    borderColor: todo.completed ? Colors.success : Colors.textMuted,
                  }}
                  onClick={() => toggleTodo(todo.id)}
                >
                  {todo.completed && <span style={{ color: '#fff', fontSize: '0.7rem' }}>✓</span>}
                </button>
                <span style={{
                  ...s.todoText,
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? Colors.textMuted : Colors.text,
                }}>
                  {todo.text}
                </span>
                <button style={s.deleteBtn} onClick={() => deleteTodo(todo.id)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {doneCount > 0 && (
          <button style={s.clearBtn}
            onClick={() => todos.filter((t) => t.completed).forEach((t) => deleteTodo(t.id))}>
            🗑 清除已完成（{doneCount}）
          </button>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '1rem', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  card: { backgroundColor: Colors.card, borderRadius: 14, padding: '1rem 1.1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  widgetLabel: { fontSize: '0.85rem', fontWeight: 700, color: Colors.textSecondary, marginBottom: '0.75rem' },

  // 月曆
  calHeader: { display: 'flex', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem' },
  calNavBtn: { background: 'none', border: 'none', fontSize: '1.4rem', color: Colors.text, cursor: 'pointer', padding: '0 0.25rem', lineHeight: 1 },
  calTitle: { flex: 1, fontWeight: 700, color: Colors.text, fontSize: '1rem' },
  todayBtn: { fontSize: '0.75rem', padding: '0.25rem 0.6rem', backgroundColor: Colors.surface, border: `1px solid ${Colors.surfaceLight}`, borderRadius: 8, color: Colors.textSecondary, cursor: 'pointer' },
  weekRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.25rem' },
  weekLabel: { textAlign: 'center', fontSize: '0.75rem', color: Colors.textMuted, padding: '0.2rem 0', fontWeight: 600 },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.15rem', marginBottom: '0.6rem' },
  dayCell: {
    border: 'none', borderRadius: 8, padding: '0.35rem 0',
    cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', fontSize: '0.85rem', transition: 'background 0.15s',
  },
  dotsRow: { display: 'flex', gap: 2, marginTop: 2, minHeight: 5 },
  dot: { width: 4, height: 4, borderRadius: '50%', display: 'inline-block' },
  legend: { display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginBottom: '0.5rem' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: Colors.textMuted },
  dayDetail: { borderTop: `1px solid ${Colors.surfaceLight}`, paddingTop: '0.75rem', marginTop: '0.25rem' },
  dayDetailTitle: { fontWeight: 700, color: Colors.text, marginBottom: '0.5rem', fontSize: '0.9rem' },
  studyBadge: { fontSize: '0.82rem', color: Colors.success, backgroundColor: Colors.successBg, padding: '0.35rem 0.65rem', borderRadius: 8, marginBottom: '0.5rem', display: 'inline-block' },
  noStudy: { fontSize: '0.82rem', color: Colors.textMuted, marginBottom: '0.4rem' },
  dayTodoList: { display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.4rem' },
  dayTodoItem: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  doneDot: { width: 8, height: 8, borderRadius: '50%', backgroundColor: Colors.success, flexShrink: 0 },
  pendingDot: { width: 8, height: 8, borderRadius: '50%', backgroundColor: Colors.accent, flexShrink: 0 },
  dayTodoText: { fontSize: '0.85rem' },

  // 角色提醒
  reminderBubble: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    backgroundColor: Colors.card, border: '2px solid',
    borderRadius: 14, padding: '0.85rem 1rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  },
  reminderLeft: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' },
  reminderEmoji: { fontSize: '1.5rem' },
  reminderName: { fontSize: '0.7rem', color: Colors.textMuted, fontWeight: 600 },
  reminderText: { flex: 1, color: Colors.textSecondary, fontStyle: 'italic', fontSize: '0.88rem', lineHeight: 1.55 },
  reminderClose: { background: 'none', border: 'none', color: Colors.textMuted, cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 },

  // 新增
  inputRow: { display: 'flex', gap: '0.6rem', marginBottom: '0.75rem' },
  textInput: { flex: 1, padding: '0.7rem 0.9rem', border: `2px solid ${Colors.surfaceLight}`, borderRadius: 10, backgroundColor: Colors.surface, color: Colors.text, fontSize: '1rem', outline: 'none' },
  addBtn: { padding: '0.7rem 1.1rem', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1.2rem', cursor: 'pointer' },

  filterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' },
  statsChips: { display: 'flex', gap: '0.35rem' },
  chipPending: { fontSize: '0.78rem', padding: '0.2rem 0.55rem', backgroundColor: Colors.dangerBg, color: Colors.danger, borderRadius: 20, fontWeight: 600 },
  chipDone: { fontSize: '0.78rem', padding: '0.2rem 0.55rem', backgroundColor: Colors.successBg, color: Colors.success, borderRadius: 20, fontWeight: 600 },
  filterBtns: { display: 'flex', gap: '0.3rem' },
  filterBtn: { padding: '0.25rem 0.65rem', border: `1px solid ${Colors.surfaceLight}`, borderRadius: 20, backgroundColor: 'transparent', color: Colors.textSecondary, fontSize: '0.78rem', cursor: 'pointer' },
  filterBtnActive: { backgroundColor: Colors.primary, color: '#fff', borderColor: Colors.primary },

  list: { display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.5rem' },
  todoItem: { display: 'flex', alignItems: 'center', gap: '0.7rem', backgroundColor: Colors.surface, borderRadius: 10, padding: '0.75rem 0.9rem', transition: 'opacity 0.2s' },
  checkbox: { width: 22, height: 22, borderRadius: '50%', border: '2px solid', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' },
  todoText: { flex: 1, fontSize: '0.93rem', lineHeight: 1.4 },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', color: Colors.textMuted, fontSize: '0.8rem', padding: '0.2rem', opacity: 0.6 },

  empty: { textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' },
  emptyText: { color: Colors.textMuted, fontSize: '0.9rem', margin: 0 },

  clearBtn: { marginTop: '0.75rem', width: '100%', padding: '0.6rem', backgroundColor: 'transparent', border: `1px solid ${Colors.surfaceLight}`, borderRadius: 10, color: Colors.textMuted, fontSize: '0.82rem', cursor: 'pointer' },
};
