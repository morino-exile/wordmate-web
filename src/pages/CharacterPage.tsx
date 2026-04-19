import { useState } from 'react';
import { useStore } from '../store/useStore';
import { characters } from '../data/characters';
import { Colors } from '../theme/colors';

function getRandomLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)] ?? '';
}

export default function CharacterPage() {
  const { selectedCharacterId, characterStates, selectCharacter } = useStore();
  const [activeLine, setActiveLine] = useState('');
  const [showLine, setShowLine] = useState(false);

  const character = characters.find((c) => c.id === selectedCharacterId) ?? characters[0];
  const charState = characterStates[character.id];
  const affection = charState?.affection ?? 0;
  const stamina = charState?.stamina ?? 50;

  const speak = (lines: string[]) => {
    setActiveLine(getRandomLine(lines));
    setShowLine(true);
  };

  return (
    <div style={s.page}>

      {/* ── 角色選擇列 ── */}
      <div style={s.charTabs}>
        {characters.map((c) => (
          <button
            key={c.id}
            style={{
              ...s.charTab,
              backgroundColor: selectedCharacterId === c.id ? c.themeColor : Colors.surface,
              color: selectedCharacterId === c.id ? '#fff' : Colors.textSecondary,
              borderColor: c.themeColor,
            }}
            onClick={() => { selectCharacter(c.id); setShowLine(false); }}
          >
            <span style={{ fontSize: '1.1rem' }}>{c.emoji}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{c.name}</span>
          </button>
        ))}
      </div>

      {/* ── 角色主卡 ── */}
      <div style={{ ...s.mainCard, borderColor: character.themeColor }}>
        <div style={s.cardTop}>
          <div style={{ ...s.avatarCircle, backgroundColor: character.themeColor + '33' }}>
            <span style={s.avatarEmoji}>{character.emoji}</span>
          </div>
          <div style={s.charInfo}>
            <h2 style={s.charName}>{character.name}</h2>
            <p style={s.charNameEn}>{character.nameEn}</p>
            <p style={s.charOccupation}>{character.occupation}</p>
          </div>
        </div>

        {/* 基本資料 */}
        <div style={s.infoGrid}>
          <InfoItem label="年齡" value={`${character.age} 歲`} />
          <InfoItem label="身高" value={character.height} />
        </div>

        <div style={s.keywords}>
          {character.keywords.map((kw) => (
            <span key={kw} style={{ ...s.kwTag, borderColor: character.themeColor, color: character.themeColor }}>
              {kw}
            </span>
          ))}
        </div>

        <p style={s.speakStyle}>說話風格：{character.speakingStyle}</p>

        {/* 好感度 / 活力 */}
        <div style={s.statSection}>
          <StatBar label="❤️ 好感度" value={affection} color={Colors.primary} />
          <StatBar label="⚡ 活力" value={stamina} color={Colors.accent} />
        </div>
      </div>

      {/* ── 對話泡泡 ── */}
      {showLine && (
        <div style={{ ...s.speechBubble, borderColor: character.themeColor }}>
          <span style={s.bubbleEmoji}>{character.emoji}</span>
          <p style={s.speechText}>「{activeLine}」</p>
          <button style={s.closeBubble} onClick={() => setShowLine(false)}>✕</button>
        </div>
      )}

      {/* ── 互動按鈕 ── */}
      <div style={s.card}>
        <div style={s.sectionLabel}>💬 角色互動</div>
        <div style={s.interactGrid}>
          <InteractBtn label="打招呼" emoji="👋" color={character.themeColor}
            onClick={() => speak(character.lines.greeting)} />
          <InteractBtn label="鼓勵學習" emoji="📖" color={Colors.success}
            onClick={() => speak(character.lines.encourageStudy)} />
          <InteractBtn label="提醒待辦" emoji="📋" color={Colors.accent}
            onClick={() => speak(character.lines.remindTodo)} />
          <InteractBtn label="好感提升" emoji="✨" color={Colors.primary}
            onClick={() => speak(character.lines.affectionUp)} />
        </div>
      </div>

      {/* ── 預留小遊戲區 ── */}
      <div style={s.card}>
        <div style={s.sectionLabel}>🎮 互動小遊戲</div>
        <div style={s.comingSoon}>
          <span style={{ fontSize: '2.5rem' }}>🚧</span>
          <p style={s.comingSoonText}>小遊戲開發中</p>
          <p style={s.comingSoonSub}>即將推出：猜單字、配對記憶、角色故事解鎖</p>
        </div>
      </div>

    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <span style={{ fontSize: '0.72rem', color: Colors.textMuted, marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: Colors.text }}>{value}</span>
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.82rem', color: Colors.textSecondary }}>{label}</span>
        <span style={{ fontSize: '0.82rem', color, fontWeight: 700 }}>{value} / 100</span>
      </div>
      <div style={{ height: 8, backgroundColor: Colors.surfaceLight, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, backgroundColor: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function InteractBtn({ label, emoji, color, onClick }: { label: string; emoji: string; color: string; onClick: () => void }) {
  return (
    <button style={{ ...s.interactBtn, borderColor: color + '66' }} onClick={onClick}>
      <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
      <span style={{ fontSize: '0.78rem', color: Colors.textSecondary, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '1rem', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' },

  charTabs: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  charTab: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', padding: '0.5rem 0.75rem', border: '2px solid', borderRadius: 12, cursor: 'pointer', minWidth: 56, transition: 'all 0.2s' },

  mainCard: { backgroundColor: Colors.card, borderRadius: 14, padding: '1.2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '2px solid' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' },
  avatarCircle: { width: 70, height: 70, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarEmoji: { fontSize: '2.2rem' },
  charInfo: { flex: 1 },
  charName: { margin: 0, fontSize: '1.4rem', fontWeight: 800, color: Colors.text },
  charNameEn: { margin: '0.1rem 0 0.2rem', fontSize: '0.82rem', color: Colors.textMuted },
  charOccupation: { margin: 0, fontSize: '0.85rem', color: Colors.textSecondary },

  infoGrid: { display: 'flex', backgroundColor: Colors.surface, borderRadius: 10, padding: '0.6rem', marginBottom: '0.75rem' },

  keywords: { display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' },
  kwTag: { fontSize: '0.76rem', padding: '0.2rem 0.6rem', borderRadius: 20, border: '1px solid', fontWeight: 500 },

  speakStyle: { fontSize: '0.82rem', color: Colors.textMuted, margin: '0 0 0.85rem', lineHeight: 1.5 },

  statSection: { backgroundColor: Colors.surface, borderRadius: 10, padding: '0.75rem' },

  speechBubble: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: Colors.card, border: '2px solid', borderRadius: 14, padding: '1rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
  bubbleEmoji: { fontSize: '1.6rem', flexShrink: 0 },
  speechText: { flex: 1, margin: 0, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 1.6, fontSize: '0.92rem' },
  closeBubble: { background: 'none', border: 'none', color: Colors.textMuted, cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 },

  card: { backgroundColor: Colors.card, borderRadius: 14, padding: '1.1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  sectionLabel: { fontSize: '0.85rem', fontWeight: 700, color: Colors.textSecondary, marginBottom: '0.85rem' },

  interactGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' },
  interactBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '1rem', backgroundColor: Colors.surface, border: '1.5px solid', borderRadius: 12, cursor: 'pointer', transition: 'transform 0.1s' },

  comingSoon: { textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  comingSoonText: { margin: 0, fontWeight: 700, color: Colors.text, fontSize: '1rem' },
  comingSoonSub: { margin: 0, color: Colors.textMuted, fontSize: '0.82rem', lineHeight: 1.5 },
};
