import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { characters } from '../data/characters';
import { Colors } from '../theme/colors';
import { chatWithCharacter, buildSystemPrompt } from '../services/gemini';
import type { ChatMessage } from '../store/useStore';

// ── Tier 計算 ──────────────────────────────────────────────
function getTier(affection: number): { tier: number; label: string; nextAt: number } {
  if (affection >= 61) return { tier: 3, label: '親密', nextAt: 100 };
  if (affection >= 31) return { tier: 2, label: '相識', nextAt: 60 };
  return { tier: 1, label: '初識', nextAt: 30 };
}

const TIER_COLORS = ['', '#9B9B9B', '#6A9EC0', '#E8887A']; // 1=灰, 2=藍, 3=紅

// ── 固定台詞輔助 ────────────────────────────────────────────
function getRandomLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)] ?? '';
}

// ── 主元件 ─────────────────────────────────────────────────
export default function CharacterPage() {
  const navigate = useNavigate();
  const {
    selectedCharacterId, characterStates, selectCharacter,
    apiKey, geminiModel, chatHistories, addChatMessage, clearChatHistory,
    addAffection, addStamina,
  } = useStore();

  const [activeLine, setActiveLine] = useState('');
  const [showLine, setShowLine] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const character = characters.find((c) => c.id === selectedCharacterId) ?? characters[0];
  const charState = characterStates[character.id];
  const affection = charState?.affection ?? 0;
  const stamina   = charState?.stamina ?? 50;
  const tierInfo  = getTier(affection);
  const messages  = chatHistories[character.id] ?? [];

  // 切換角色時清除輸入
  useEffect(() => {
    setChatInput('');
    setChatError('');
  }, [character.id]);

  // 新訊息時自動捲到底
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = (lines: string[], affectionDelta = 0, staminaDelta = 0) => {
    setActiveLine(getRandomLine(lines));
    setShowLine(true);
    if (affectionDelta) addAffection(character.id, affectionDelta);
    if (staminaDelta)  addStamina(character.id, staminaDelta);
  };

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || isLoading) return;
    if (!apiKey) {
      setChatError('請先在「設定」頁面輸入 Gemini API Key');
      return;
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), text, isUser: true, timestamp: Date.now() };
    addChatMessage(character.id, userMsg);
    setChatInput('');
    setChatError('');
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(
        character.id, character.name, character.nameEn, tierInfo.tier,
      );
      const history = messages.map((m) => ({ isUser: m.isUser, text: m.text }));
      const reply = await chatWithCharacter(apiKey, geminiModel, systemPrompt, history, text);

      const charMsg: ChatMessage = { id: (Date.now() + 1).toString(), text: reply, isUser: false, timestamp: Date.now() };
      addChatMessage(character.id, charMsg);
    } catch (e: any) {
      setChatError(`傳送失敗：${e?.message ?? '未知錯誤'}`);
    } finally {
      setIsLoading(false);
    }
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

        {/* ── 好感度 / Tier / 活力 ── */}
        <div style={s.statSection}>

          {/* Tier badge */}
          <div style={s.tierRow}>
            <span style={{ ...s.tierBadge, backgroundColor: TIER_COLORS[tierInfo.tier] }}>
              Tier {tierInfo.tier} · {tierInfo.label}
            </span>
            <span style={s.tierHint}>
              {tierInfo.tier < 3
                ? `再 ${tierInfo.nextAt - affection} 點好感解鎖下一階段`
                : '✦ 已達最高好感度'}
            </span>
          </div>

          <StatBar label="❤️ 好感度" value={affection} max={100} color={Colors.primary} />
          <StatBar label="⚡ 活力"   value={stamina}   max={100} color={Colors.accent} />
        </div>
      </div>

      {/* ── 對話泡泡（固定台詞） ── */}
      {showLine && (
        <div style={{ ...s.speechBubble, borderColor: character.themeColor }}>
          <span style={s.bubbleEmoji}>{character.emoji}</span>
          <p style={s.speechText}>「{activeLine}」</p>
          <button style={s.closeBubble} onClick={() => setShowLine(false)}>✕</button>
        </div>
      )}

      {/* ── 互動按鈕 ── */}
      <div style={s.card}>
        <div style={s.sectionLabel}>💬 角色台詞</div>
        <div style={s.interactGrid}>
          <InteractBtn label="打招呼" emoji="👋" color={character.themeColor}
            onClick={() => speak(character.lines.greeting, 2, 1)} />
          <InteractBtn label="鼓勵學習" emoji="📖" color={Colors.success}
            onClick={() => speak(character.lines.encourageStudy, 1, 3)} />
          <InteractBtn label="提醒待辦" emoji="📋" color={Colors.accent}
            onClick={() => speak(character.lines.remindTodo, 1, 0)} />
          <InteractBtn label="好感提升" emoji="✨" color={Colors.primary}
            onClick={() => speak(character.lines.affectionUp, 5, 2)} />
        </div>
      </div>

      {/* ── Gemini 聊天 ── */}
      <div style={s.card}>
        <div style={s.chatHeader}>
          <span style={s.sectionLabel}>🤖 與 {character.name} 對話</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ ...s.tierPill, backgroundColor: TIER_COLORS[tierInfo.tier] }}>
              Tier {tierInfo.tier}
            </span>
            {messages.length > 0 && (
              <button style={s.clearBtn} onClick={() => clearChatHistory(character.id)}>
                清除
              </button>
            )}
          </div>
        </div>

        {!apiKey && (
          <div style={s.noApiBox}>
            <p style={s.noApiText}>需要 Gemini API Key 才能聊天</p>
            <button style={s.goSettingsBtn} onClick={() => navigate('/settings')}>
              前往設定 →
            </button>
          </div>
        )}

        {apiKey && (
          <>
            {/* 訊息區 */}
            <div style={s.msgArea}>
              {messages.length === 0 && (
                <p style={s.emptyChat}>傳送訊息，開始與 {character.name} 對話</p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.isUser ? 'flex-end' : 'flex-start', marginBottom: '0.6rem' }}>
                  {!msg.isUser && (
                    <span style={{ fontSize: '1.2rem', marginRight: '0.4rem', alignSelf: 'flex-end' }}>
                      {character.emoji}
                    </span>
                  )}
                  <div style={{
                    ...s.msgBubble,
                    backgroundColor: msg.isUser ? character.themeColor : Colors.surface,
                    color: msg.isUser ? '#fff' : Colors.text,
                    borderRadius: msg.isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: Colors.textMuted, fontSize: '0.85rem' }}>
                  <span>{character.emoji}</span>
                  <span>輸入中⋯⋯</span>
                </div>
              )}
              {chatError && (
                <p style={s.chatErr}>{chatError}</p>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 輸入區 */}
            <div style={s.inputRow}>
              <input
                style={s.chatInput}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`對 ${character.name} 說些什麼…`}
                disabled={isLoading}
              />
              <button
                style={{ ...s.sendBtn, backgroundColor: isLoading ? Colors.surfaceLight : character.themeColor }}
                onClick={handleSend}
                disabled={isLoading || !chatInput.trim()}
              >
                送出
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── 預留小遊戲 ── */}
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

// ── 子元件 ─────────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <span style={{ fontSize: '0.72rem', color: Colors.textMuted, marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: Colors.text }}>{value}</span>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.82rem', color: Colors.textSecondary }}>{label}</span>
        <span style={{ fontSize: '0.82rem', color, fontWeight: 700 }}>{value} / {max}</span>
      </div>
      <div style={{ height: 8, backgroundColor: Colors.surfaceLight, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(value / max) * 100}%`, backgroundColor: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
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

// ── 樣式 ───────────────────────────────────────────────────
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

  tierRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' },
  tierBadge: { fontSize: '0.75rem', fontWeight: 700, color: '#fff', padding: '0.2rem 0.7rem', borderRadius: 20 },
  tierHint: { fontSize: '0.75rem', color: Colors.textMuted },

  speechBubble: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: Colors.card, border: '2px solid', borderRadius: 14, padding: '1rem', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' },
  bubbleEmoji: { fontSize: '1.6rem', flexShrink: 0 },
  speechText: { flex: 1, margin: 0, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 1.6, fontSize: '0.92rem' },
  closeBubble: { background: 'none', border: 'none', color: Colors.textMuted, cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 },

  card: { backgroundColor: Colors.card, borderRadius: 14, padding: '1.1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  sectionLabel: { fontSize: '0.85rem', fontWeight: 700, color: Colors.textSecondary, marginBottom: '0.85rem' },

  interactGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' },
  interactBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', padding: '1rem', backgroundColor: Colors.surface, border: '1.5px solid', borderRadius: 12, cursor: 'pointer', transition: 'transform 0.1s' },

  // chat
  chatHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' },
  tierPill: { fontSize: '0.7rem', fontWeight: 700, color: '#fff', padding: '0.15rem 0.5rem', borderRadius: 12 },
  clearBtn: { fontSize: '0.75rem', color: Colors.textMuted, background: 'none', border: `1px solid ${Colors.surfaceLight}`, borderRadius: 8, padding: '0.15rem 0.5rem', cursor: 'pointer' },

  noApiBox: { textAlign: 'center', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  noApiText: { margin: 0, color: Colors.textMuted, fontSize: '0.85rem' },
  goSettingsBtn: { padding: '0.5rem 1.2rem', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' },

  msgArea: { minHeight: 180, maxHeight: 340, overflowY: 'auto', backgroundColor: Colors.surface, borderRadius: 10, padding: '0.75rem', marginBottom: '0.75rem' },
  emptyChat: { textAlign: 'center', color: Colors.textMuted, fontSize: '0.82rem', margin: '2rem 0' },
  msgBubble: { maxWidth: '78%', padding: '0.55rem 0.85rem', fontSize: '0.88rem', lineHeight: 1.55, wordBreak: 'break-word' },
  chatErr: { color: Colors.danger, fontSize: '0.8rem', margin: '0.25rem 0 0' },

  inputRow: { display: 'flex', gap: '0.5rem' },
  chatInput: { flex: 1, padding: '0.65rem 0.85rem', border: `1.5px solid ${Colors.surfaceLight}`, borderRadius: 10, fontSize: '0.9rem', backgroundColor: Colors.surface, color: Colors.text, outline: 'none' },
  sendBtn: { padding: '0.65rem 1.1rem', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', transition: 'background 0.2s' },

  comingSoon: { textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },
  comingSoonText: { margin: 0, fontWeight: 700, color: Colors.text, fontSize: '1rem' },
  comingSoonSub: { margin: 0, color: Colors.textMuted, fontSize: '0.82rem', lineHeight: 1.5 },
};
