import { useState } from 'react';
import { useStore } from '../store/useStore';
import { characters } from '../data/characters';
import { Colors } from '../theme/colors';

function getRandomLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)] ?? '';
}

type FilterType = 'all' | 'pending' | 'done';

export default function TodoPage() {
  const { todos, addTodo, toggleTodo, deleteTodo, selectedCharacterId } = useStore();
  const character = characters.find((c) => c.id === selectedCharacterId) ?? characters[0];

  const [input, setInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [reminder, setReminder] = useState('');
  const [showReminder, setShowReminder] = useState(false);

  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    addTodo(text, dueDate ? new Date(dueDate).getTime() : undefined);
    setInput('');
    setDueDate('');

    // 角色提醒語
    const line = getRandomLine(character.lines.remindTodo);
    setReminder(line);
    setShowReminder(true);
    setTimeout(() => setShowReminder(false), 4000);
  };

  const filtered = todos.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  }).sort((a, b) => {
    // 未完成排前面，再依建立時間排
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  const pendingCount = todos.filter((t) => !t.completed).length;
  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <div style={s.container}>
      <h2 style={s.title}>📋 待辦清單</h2>

      {/* 角色提醒泡泡 */}
      {showReminder && (
        <div style={{ ...s.reminderBubble, borderColor: character.themeColor }}>
          <span style={s.reminderEmoji}>{character.emoji}</span>
          <span style={s.reminderText}>「{reminder}」</span>
        </div>
      )}

      {/* 新增輸入 */}
      <div style={s.inputCard}>
        <div style={s.inputRow}>
          <input
            style={s.textInput}
            placeholder="新增待辦事項..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            style={{ ...s.addBtn, opacity: input.trim() ? 1 : 0.5 }}
            onClick={handleAdd}
            disabled={!input.trim()}
          >
            ＋
          </button>
        </div>
        <input
          style={s.dateInput}
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          placeholder="截止日期（選填）"
        />
      </div>

      {/* 統計 + 篩選 */}
      <div style={s.filterRow}>
        <div style={s.statsChips}>
          <span style={s.chip}>待完成 {pendingCount}</span>
          <span style={{ ...s.chip, backgroundColor: Colors.successBg, color: Colors.success }}>
            已完成 {doneCount}
          </span>
        </div>
        <div style={s.filterBtns}>
          {(['all', 'pending', 'done'] as FilterType[]).map((f) => (
            <button
              key={f}
              style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {{ all: '全部', pending: '待辦', done: '完成' }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* 清單 */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          <span style={{ fontSize: '2.5rem' }}>
            {filter === 'done' ? '📭' : '✨'}
          </span>
          <p style={s.emptyText}>
            {filter === 'done' ? '還沒有完成的項目' : '沒有待辦事項，很棒！'}
          </p>
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map((todo) => {
            const isOverdue = !todo.completed && todo.dueDate && todo.dueDate < Date.now();
            const dueDateStr = todo.dueDate
              ? new Date(todo.dueDate).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
              : null;

            return (
              <div key={todo.id} style={{
                ...s.todoItem,
                opacity: todo.completed ? 0.55 : 1,
              }}>
                {/* 勾選圓框 */}
                <button
                  style={{
                    ...s.checkbox,
                    backgroundColor: todo.completed ? Colors.success : 'transparent',
                    borderColor: todo.completed ? Colors.success : Colors.textMuted,
                  }}
                  onClick={() => toggleTodo(todo.id)}
                  aria-label="切換完成"
                >
                  {todo.completed && <span style={{ color: '#fff', fontSize: '0.75rem' }}>✓</span>}
                </button>

                {/* 文字 */}
                <div style={s.todoContent}>
                  <span style={{
                    ...s.todoText,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? Colors.textMuted : Colors.text,
                  }}>
                    {todo.text}
                  </span>
                  {dueDateStr && (
                    <span style={{
                      ...s.dueTag,
                      color: isOverdue ? Colors.danger : Colors.textMuted,
                      backgroundColor: isOverdue ? Colors.dangerBg : Colors.surfaceLight,
                    }}>
                      {isOverdue ? '⚠️ ' : '📅 '}{dueDateStr}
                    </span>
                  )}
                </div>

                {/* 刪除 */}
                <button style={s.deleteBtn} onClick={() => deleteTodo(todo.id)} aria-label="刪除">
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 清除已完成 */}
      {doneCount > 0 && (
        <button
          style={s.clearDoneBtn}
          onClick={() => todos.filter((t) => t.completed).forEach((t) => deleteTodo(t.id))}
        >
          🗑 清除已完成（{doneCount}）
        </button>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: 560, margin: '0 auto' },
  title: { color: Colors.text, marginBottom: '1rem' },

  reminderBubble: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    backgroundColor: Colors.card, border: '2px solid',
    borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1rem',
    animation: 'fadeIn 0.3s ease',
  },
  reminderEmoji: { fontSize: '1.3rem' },
  reminderText: { color: Colors.textSecondary, fontStyle: 'italic', fontSize: '0.9rem', lineHeight: 1.5 },

  inputCard: {
    backgroundColor: Colors.card, borderRadius: 14,
    padding: '1rem', marginBottom: '1rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', gap: '0.6rem',
  },
  inputRow: { display: 'flex', gap: '0.6rem' },
  textInput: {
    flex: 1, padding: '0.7rem 0.9rem',
    border: `2px solid ${Colors.surfaceLight}`,
    borderRadius: 10, backgroundColor: Colors.surface,
    color: Colors.text, fontSize: '1rem', outline: 'none',
  },
  addBtn: {
    padding: '0.7rem 1.1rem', backgroundColor: Colors.primary,
    color: '#fff', border: 'none', borderRadius: 10,
    fontWeight: 700, fontSize: '1.2rem', cursor: 'pointer',
  },
  dateInput: {
    padding: '0.5rem 0.75rem', border: `1px solid ${Colors.surfaceLight}`,
    borderRadius: 8, backgroundColor: Colors.surface,
    color: Colors.textSecondary, fontSize: '0.85rem', width: '100%',
    boxSizing: 'border-box',
  },

  filterRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem',
  },
  statsChips: { display: 'flex', gap: '0.4rem' },
  chip: {
    fontSize: '0.8rem', padding: '0.25rem 0.6rem',
    backgroundColor: Colors.dangerBg, color: Colors.danger,
    borderRadius: 20, fontWeight: 600,
  },
  filterBtns: { display: 'flex', gap: '0.35rem' },
  filterBtn: {
    padding: '0.3rem 0.75rem', border: `1px solid ${Colors.surfaceLight}`,
    borderRadius: 20, backgroundColor: 'transparent',
    color: Colors.textSecondary, fontSize: '0.8rem', cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: Colors.primary, color: '#fff', borderColor: Colors.primary,
  },

  list: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  todoItem: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    backgroundColor: Colors.card, borderRadius: 12,
    padding: '0.85rem 1rem',
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
    transition: 'opacity 0.2s',
  },
  checkbox: {
    width: 24, height: 24, borderRadius: '50%',
    border: '2px solid', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all 0.2s',
  },
  todoContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  todoText: { fontSize: '0.95rem', lineHeight: 1.4 },
  dueTag: {
    fontSize: '0.75rem', fontWeight: 500,
    padding: '0.15rem 0.5rem', borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deleteBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: Colors.textMuted, fontSize: '0.85rem', padding: '0.25rem',
    flexShrink: 0, opacity: 0.6,
  },

  empty: {
    textAlign: 'center', padding: '3rem 1rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
  },
  emptyText: { color: Colors.textMuted, fontSize: '0.95rem', margin: 0 },

  clearDoneBtn: {
    marginTop: '1rem', width: '100%',
    padding: '0.65rem', backgroundColor: 'transparent',
    border: `1px solid ${Colors.surfaceLight}`, borderRadius: 10,
    color: Colors.textMuted, fontSize: '0.85rem', cursor: 'pointer',
  },
};
