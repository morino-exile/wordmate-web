import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Colors } from '../theme/colors';
import type { ExamCategory } from '../data/wordList';

const CEFR_LEVELS: ExamCategory[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const CEFR_DESC: Record<string, string> = {
  A1: '初學者', A2: '基礎', B1: '中級', B2: '中高級', C1: '高級', C2: '精通',
};

const INVENTORY_LABELS: Record<string, string> = {
  // ── 底線格式（CEFR CSV 標準欄位）──
  personality_and_feelings:    '😊 個性與情感',
  arts_and_literature:         '🎨 藝術與文學',
  clothes:                     '👗 服裝',
  colours_and_dimensions:      '🎨 顏色與尺寸',
  education:                   '📚 教育',
  family_and_home:             '🏠 家庭與居家',
  film:                        '🎬 電影',
  food_and_drink:              '🍜 飲食',
  hobbies_and_leisure:         '🎮 興趣與休閒',
  holidays_and_travel:         '✈️ 旅遊',
  idiomatic_expressions:       '💬 慣用語',
  media_and_news:              '📰 媒體與新聞',
  nationalities_and_countries: '🌍 國籍與國家',
  personal_information:        '👤 個人資訊',
  science_and_technology:      '🔬 科技',
  shopping_and_town:           '🛍️ 購物與城市',
  work_and_jobs:               '💼 工作職業',
  description:                 '📝 描述',
  health_and_body:             '🏥 健康與身體',

  // ── 空格句式（部分 CSV 使用的格式）──
  'Education':                              '📚 教育',
  'Media':                                  '📰 媒體',
  'Work and Jobs':                          '💼 工作職業',
  'Food and drink':                         '🍜 飲食',
  'Personal information':                   '👤 個人資訊',
  'Travel and services vocab':              '✈️ 旅遊與服務',
  'Objects and rooms':                      '🏠 物品與房間',
  'Things in the town, shops and shopping': '🛍️ 城市與購物',
  'Collocation':                            '💬 搭配詞組',
  'News, lifestyles and current affairs':   '📰 新聞與生活',
};

// 無對應 label 時的備用顯示：底線轉空格、首字大寫
function formatInventoryLabel(inv: string): string {
  const mapped = INVENTORY_LABELS[inv];
  if (mapped) return mapped;
  // 底線格式 → 空格，首字大寫
  return inv.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export default function QuizSelectPage() {
  const navigate = useNavigate();
  const { words } = useStore();

  // 計算各 CEFR 等級的單字數與學習進度
  const cefrStats = useMemo(() => {
    const stats: Record<string, { total: number; learned: number }> = {};
    for (const level of CEFR_LEVELS) {
      const levelWords = words.filter((w) => w.exams.includes(level));
      stats[level] = {
        total:   levelWords.length,
        learned: levelWords.filter((w) => w.mastery >= 1).length,
      };
    }
    return stats;
  }, [words]);

  // 向下相容（部分地方只需要 total）
  const cefrCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const level of CEFR_LEVELS) c[level] = cefrStats[level].total;
    return c;
  }, [cefrStats]);

  // 計算各情境的單字數
  const inventoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of words) {
      if (w.inventory) counts[w.inventory] = (counts[w.inventory] ?? 0) + 1;
    }
    return counts;
  }, [words]);

  const hasInventory = Object.keys(inventoryCounts).length > 0;
  const hasCefr = CEFR_LEVELS.some((l) => cefrCounts[l] > 0);

  const startQuiz = (mode: string, value: string) => {
    navigate(`/quiz/play?mode=${mode}&value=${encodeURIComponent(value)}`);
  };

  return (
    <div style={s.page}>
      <h2 style={s.title}>✏️ 選擇測驗模式</h2>

      {/* ── 一般測驗 ── */}
      <div style={s.card}>
        <div style={s.cardTitle}>🎲 一般測驗</div>
        <button style={s.bigBtn} onClick={() => navigate('/quiz/play?mode=all')}>
          <span style={s.bigBtnIcon}>🔀</span>
          <div>
            <div style={s.bigBtnLabel}>全部混合</div>
            <div style={s.bigBtnSub}>從所有單字隨機出 10 題</div>
          </div>
        </button>
        <button style={{ ...s.bigBtn, borderColor: Colors.danger + '66' }} onClick={() => navigate('/quiz/play?mode=weak')}>
          <span style={s.bigBtnIcon}>🔴</span>
          <div>
            <div style={s.bigBtnLabel}>弱點複習</div>
            <div style={s.bigBtnSub}>只出你答錯過的單字</div>
          </div>
        </button>
        <button style={{ ...s.bigBtn, borderColor: Colors.success + '66' }} onClick={() => navigate('/quiz/play?mode=review')}>
          <span style={s.bigBtnIcon}>⏰</span>
          <div>
            <div style={s.bigBtnLabel}>今日複習</div>
            <div style={s.bigBtnSub}>到期需要複習的單字</div>
          </div>
        </button>
      </div>

      {/* ── CEFR 等級 ── */}
      <div style={s.card}>
        <div style={s.cardTitle}>📊 按 CEFR 程度</div>
        {!hasCefr && (
          <p style={s.emptyHint}>請先在設定頁匯入 CEFR 單字 CSV</p>
        )}
        <div style={s.grid2}>
          {CEFR_LEVELS.map((level) => {
            const { total, learned } = cefrStats[level];
            const disabled = total < 4;
            const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
            return (
              <button
                key={level}
                style={{ ...s.levelBtn, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                onClick={() => !disabled && startQuiz('cefr', level)}
                disabled={disabled}
              >
                <span style={{ ...s.levelBadge, backgroundColor: cefrColor(level) }}>{level}</span>
                <span style={s.levelName}>{CEFR_DESC[level]}</span>
                <span style={s.levelCount}>{total} 個單字</span>
                {total >= 4 && (
                  <div style={s.cefrProgress}>
                    <div style={{ ...s.cefrBar, width: `${pct}%`, backgroundColor: cefrColor(level) }} />
                  </div>
                )}
                {total >= 4 && (
                  <span style={s.cefrPct}>{learned} / {total} 已學（{pct}%）</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 情境主題 ── */}
      <div style={s.card}>
        <div style={s.cardTitle}>🗂️ 按情境主題</div>
        {!hasInventory && (
          <p style={s.emptyHint}>匯入 CSV 後（含 inventory 欄位）自動出現</p>
        )}
        <div style={s.grid2}>
          {Object.entries(inventoryCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([inv, count]) => {
              const label = formatInventoryLabel(inv);
              const disabled = count < 4;
              return (
                <button
                  key={inv}
                  style={{ ...s.invBtn, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                  onClick={() => !disabled && startQuiz('inventory', inv)}
                  disabled={disabled}
                >
                  <span style={s.invLabel}>{label}</span>
                  <span style={s.invCount}>{count} 個</span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function cefrColor(level: string): string {
  const map: Record<string, string> = {
    A1: '#7ABAA8', A2: '#6A9EC0',
    B1: '#9B7EC5', B2: '#8B6AAD',
    C1: '#E8887A', C2: '#CC6655',
  };
  return map[level] ?? Colors.primary;
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '1rem', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  title: { color: Colors.text, margin: 0 },
  card: { backgroundColor: Colors.card, borderRadius: 14, padding: '1.1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  cardTitle: { fontSize: '0.85rem', fontWeight: 700, color: Colors.textSecondary, marginBottom: '0.1rem' },
  emptyHint: { fontSize: '0.82rem', color: Colors.textMuted, margin: 0, fontStyle: 'italic' },

  bigBtn: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '0.85rem 1rem', backgroundColor: Colors.surface,
    border: `1.5px solid ${Colors.surfaceLight}`, borderRadius: 12,
    cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s',
  },
  bigBtnIcon: { fontSize: '1.6rem', flexShrink: 0 },
  bigBtnLabel: { fontWeight: 700, color: Colors.text, fontSize: '0.95rem', marginBottom: 2 },
  bigBtnSub: { fontSize: '0.78rem', color: Colors.textMuted },

  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },

  levelBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem',
    padding: '0.75rem', backgroundColor: Colors.surface,
    border: `1px solid ${Colors.surfaceLight}`, borderRadius: 10,
    transition: 'opacity 0.2s',
  },
  levelBadge: { fontSize: '0.82rem', fontWeight: 800, color: '#fff', padding: '0.15rem 0.5rem', borderRadius: 6 },
  levelName: { fontSize: '0.82rem', fontWeight: 600, color: Colors.text },
  levelCount: { fontSize: '0.75rem', color: Colors.textMuted },
  cefrProgress: { width: '100%', height: 4, backgroundColor: Colors.surfaceLight, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  cefrBar: { height: '100%', borderRadius: 2, transition: 'width 0.3s' },
  cefrPct: { fontSize: '0.68rem', color: Colors.textMuted },

  invBtn: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.65rem 0.8rem', backgroundColor: Colors.surface,
    border: `1px solid ${Colors.surfaceLight}`, borderRadius: 10,
  },
  invLabel: { fontSize: '0.82rem', fontWeight: 600, color: Colors.text },
  invCount: { fontSize: '0.75rem', color: Colors.textMuted, flexShrink: 0 },
};
