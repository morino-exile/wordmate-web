import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Colors } from '../theme/colors';

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default function StatsPage() {
  const { words, studyHistory, streak, totalStudied, characterStates, selectedCharacterId } = useStore();

  const last7Days = useMemo(() => getLast7Days(), []);
  const todayKey = new Date().toISOString().slice(0, 10);

  const dailyCounts = last7Days.map((d) => studyHistory[d]?.wordsStudied ?? 0);
  const maxCount = Math.max(...dailyCounts, 1);

  const masteryBuckets = [0, 1, 2, 3, 4, 5].map((lvl) =>
    words.filter((w) => w.mastery === lvl).length
  );
  const masteryMax = Math.max(...masteryBuckets, 1);

  const mastered = words.filter((w) => w.mastery >= 3).length;
  const learning = words.filter((w) => w.mastery > 0 && w.mastery < 3).length;

  const charState = characterStates[selectedCharacterId];

  const MASTERY_META = [
    { label: '未學習', color: Colors.surfaceLight },
    { label: '初學',   color: Colors.warning },
    { label: '練習中', color: Colors.accent },
    { label: '熟悉',   color: Colors.success },
    { label: '精通',   color: '#5BA85A' },
    { label: '完全掌握', color: '#3D7A3C' },
  ];

  return (
    <div style={st.page}>
      <h2 style={st.heading}>📊 學習統計</h2>

      {/* 總覽 */}
      <div style={st.grid4}>
        <StatCard icon="📚" label="總單字數" value={words.length} />
        <StatCard icon="⭐" label="已掌握" value={mastered} color={Colors.success} />
        <StatCard icon="📖" label="學習中" value={learning} color={Colors.accent} />
        <StatCard icon="🔥" label="連續天數" value={streak} color={Colors.primary} />
      </div>

      {/* 最近 7 天 */}
      <div style={st.card}>
        <div style={st.cardTitle}>📅 最近 7 天學習量</div>
        <div style={st.barChart}>
          {last7Days.map((d, i) => {
            const count = dailyCounts[i];
            const pct = (count / maxCount) * 100;
            const isToday = d === todayKey;
            const label = new Date(d + 'T12:00:00').toLocaleDateString('zh-TW', { weekday: 'short' });
            return (
              <div key={d} style={st.barCol}>
                <span style={st.barNum}>{count > 0 ? count : ''}</span>
                <div style={st.barTrack}>
                  <div style={{
                    ...st.barFill,
                    height: `${Math.max(pct, count > 0 ? 6 : 0)}%`,
                    backgroundColor: isToday ? Colors.primary : Colors.accent,
                    opacity: isToday ? 1 : 0.7,
                  }} />
                </div>
                <span style={{ ...st.barDay, color: isToday ? Colors.primary : Colors.textMuted, fontWeight: isToday ? 700 : 400 }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 掌握度分布 */}
      <div style={st.card}>
        <div style={st.cardTitle}>🎯 單字掌握度分布</div>
        {MASTERY_META.map(({ label, color }, lvl) => (
          <div key={lvl} style={st.masteryRow}>
            <span style={st.masteryLabel}>{label}</span>
            <div style={st.masteryTrack}>
              <div style={{
                ...st.masteryFill,
                width: `${(masteryBuckets[lvl] / masteryMax) * 100}%`,
                backgroundColor: color,
              }} />
            </div>
            <span style={st.masteryNum}>{masteryBuckets[lvl]}</span>
          </div>
        ))}
      </div>

      {/* 角色 & 累計 */}
      <div style={st.card}>
        <div style={st.cardTitle}>❤️ 角色進度</div>
        {charState && (
          <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '0.75rem' }}>
            <MiniBar label="好感度" value={charState.affection} color={Colors.primary} />
            <MiniBar label="體力" value={charState.stamina} color={Colors.accent} />
          </div>
        )}
        <div style={st.totalRow}>
          <span style={st.totalLabel}>累計學習單字</span>
          <span style={st.totalValue}>{totalStudied}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color?: string }) {
  return (
    <div style={st.statCard}>
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      <span style={{ ...st.statNum, color: color ?? Colors.text }}>{value}</span>
      <span style={st.statLabel}>{label}</span>
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.78rem', color: Colors.textSecondary }}>{label}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color }}>{value}/100</span>
      </div>
      <div style={{ height: 6, backgroundColor: Colors.surfaceLight, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, backgroundColor: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  page: { padding: '1.5rem', maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  heading: { color: Colors.text, margin: 0, fontSize: '1.25rem', fontWeight: 700 },

  grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' },
  statCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: '0.85rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  statNum: { fontSize: '1.8rem', fontWeight: 800 },
  statLabel: { fontSize: '0.72rem', color: Colors.textMuted },

  card: { backgroundColor: Colors.card, borderRadius: 14, padding: '1.1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '0.82rem', fontWeight: 600, color: Colors.textSecondary, marginBottom: '0.85rem' },

  barChart: { display: 'flex', gap: '0.4rem', height: 110, alignItems: 'flex-end' },
  barCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', height: '100%' },
  barNum: { fontSize: '0.62rem', color: Colors.textSecondary, height: 14, lineHeight: '14px' },
  barTrack: { flex: 1, width: '100%', backgroundColor: Colors.surfaceLight, borderRadius: 4, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 4, transition: 'height 0.5s' },
  barDay: { fontSize: '0.68rem' },

  masteryRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' },
  masteryLabel: { fontSize: '0.75rem', color: Colors.textSecondary, width: 54, flexShrink: 0 },
  masteryTrack: { flex: 1, height: 7, backgroundColor: Colors.surfaceLight, borderRadius: 3, overflow: 'hidden' },
  masteryFill: { height: '100%', borderRadius: 3, transition: 'width 0.5s', minWidth: 0 },
  masteryNum: { fontSize: '0.75rem', color: Colors.textMuted, width: 22, textAlign: 'right', flexShrink: 0 },

  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: `1px solid ${Colors.surfaceLight}` },
  totalLabel: { fontSize: '0.85rem', color: Colors.textSecondary },
  totalValue: { fontSize: '1.2rem', fontWeight: 700, color: Colors.accent },
};
