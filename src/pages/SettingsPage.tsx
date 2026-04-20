import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../theme/colors';
import { parseCEFRCsv, type ImportResult } from '../services/csvImport';

export default function SettingsPage() {
  const { apiKey, setApiKey, geminiModel, setGeminiModel, words, addWord } = useStore();
  const { user, login, logout } = useAuth();
  const [inputKey, setInputKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  // CSV 匯入狀態
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSave = () => {
    setApiKey(inputKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setImportResult({ imported: 0, updated: 0, skipped: 0, errors: ['請選擇 .csv 檔案'] });
      return;
    }
    setImporting(true);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCEFRCsv(text, words, addWord);
      setImportResult(result);
      setImporting(false);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div style={s.container}>
      <h2 style={s.heading}>設定</h2>

      {/* ── Google 帳號 ── */}
      <section style={s.section}>
        <h3 style={s.sectionTitle}>帳號</h3>
        {user ? (
          <div style={s.userRow}>
            <img src={user.photoURL ?? ''} alt="avatar" style={s.avatar} />
            <div>
              <div style={s.userName}>{user.displayName}</div>
              <div style={s.userEmail}>{user.email}</div>
            </div>
            <button onClick={logout} style={s.btnOutline}>登出</button>
          </div>
        ) : (
          <button onClick={login} style={s.btnPrimary}>使用 Google 登入</button>
        )}
      </section>

      {/* ── CSV 單字匯入 ── */}
      <section style={s.section}>
        <h3 style={s.sectionTitle}>📥 匯入單字 CSV</h3>
        <p style={s.hint}>
          支援 CEFR 格式（欄位：headword、pos、CEFR、zh_def、example_sentence）。<br />
          已存在的單字會跳過，不會覆蓋你的學習進度。
        </p>

        {/* 拖放區 */}
        <div
          style={{
            ...s.dropZone,
            borderColor: dragOver ? Colors.primary : Colors.surfaceLight,
            backgroundColor: dragOver ? Colors.primary + '11' : Colors.surface,
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <span style={{ fontSize: '2rem' }}>📄</span>
          <p style={s.dropText}>
            {importing ? '解析中…' : '拖放 CSV 到這裡，或點擊選擇檔案'}
          </p>
          <p style={s.dropSub}>支援 UTF-8 編碼的 .csv 檔案</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* 匯入結果 */}
        {importResult && (
          <div style={{
            ...s.resultBox,
            borderColor: importResult.errors.length > 0 ? Colors.warning : Colors.success,
            backgroundColor: importResult.errors.length > 0 ? Colors.warning + '11' : Colors.successBg,
          }}>
            <p style={s.resultLine}>
              ✅ 成功匯入 <strong>{importResult.imported}</strong> 個單字
            </p>
            {importResult.updated > 0 && (
              <p style={s.resultLine}>
                🔄 補上情境分類 <strong>{importResult.updated}</strong> 個（已存在單字）
              </p>
            )}
            {importResult.skipped > 0 && (
              <p style={s.resultLine}>
                ⏭ 略過 <strong>{importResult.skipped}</strong> 個（已存在且無需更新）
              </p>
            )}
            {importResult.errors.length > 0 && (
              <details style={{ marginTop: '0.5rem' }}>
                <summary style={{ fontSize: '0.82rem', color: Colors.warning, cursor: 'pointer' }}>
                  ⚠️ {importResult.errors.length} 個警告
                </summary>
                <ul style={s.errorList}>
                  {importResult.errors.slice(0, 10).map((e, i) => (
                    <li key={i} style={s.errorItem}>{e}</li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li style={s.errorItem}>…還有 {importResult.errors.length - 10} 個</li>
                  )}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* 目前單字庫統計 */}
        <div style={s.statsRow}>
          <span style={s.statChip}>📚 單字庫共 {words.length} 個</span>
          {words.filter((w) => w.mastery >= 3).length > 0 && (
            <span style={{ ...s.statChip, backgroundColor: Colors.successBg, color: Colors.success }}>
              ⭐ 已掌握 {words.filter((w) => w.mastery >= 3).length} 個
            </span>
          )}
        </div>
      </section>

      {/* ── API 金鑰 ── */}
      <section style={s.section}>
        <h3 style={s.sectionTitle}>🤖 Gemini API 設定</h3>
        <p style={s.hint}>金鑰只存在你的瀏覽器，不會上傳到任何伺服器。</p>
        <input
          type="password"
          placeholder="AIza..."
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          style={s.input}
        />

        <p style={{ ...s.hint, marginTop: '0.75rem', marginBottom: '0.4rem' }}>使用模型</p>
        <select
          value={geminiModel}
          onChange={(e) => setGeminiModel(e.target.value)}
          style={s.select}
        >
          <optgroup label="✅ 免費額度充足（推薦）">
            <option value="gemma-3-27b-it">Gemma 3 27B（14,400次/天，品質最佳）</option>
            <option value="gemma-3-12b-it">Gemma 3 12B（14,400次/天，速度較快）</option>
          </optgroup>
          <optgroup label="⚠️ 免費但額度有限">
            <option value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash（20次/天）</option>
          </optgroup>
          <optgroup label="💳 需付費帳號">
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          </optgroup>
        </select>

        <button onClick={handleSave} style={{ ...s.btnPrimary, marginTop: '0.75rem' }}>
          {saved ? '已儲存 ✓' : '儲存 API Key'}
        </button>
      </section>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: 500, margin: '0 auto' },
  heading: { color: Colors.text, marginBottom: '1.25rem' },
  section: { backgroundColor: Colors.card, borderRadius: 14, padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  sectionTitle: { color: Colors.text, marginTop: 0, marginBottom: '0.6rem', fontSize: '1rem' },
  hint: { color: Colors.textMuted, fontSize: '0.83rem', marginBottom: '0.85rem', lineHeight: 1.55 },

  userRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: { width: 40, height: 40, borderRadius: '50%' },
  userName: { fontWeight: 600, color: Colors.text },
  userEmail: { fontSize: '0.82rem', color: Colors.textSecondary },

  dropZone: {
    border: '2px dashed', borderRadius: 12,
    padding: '2rem 1rem', textAlign: 'center',
    cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
    marginBottom: '0.85rem',
  },
  dropText: { margin: 0, fontWeight: 600, color: Colors.text, fontSize: '0.95rem' },
  dropSub: { margin: 0, fontSize: '0.78rem', color: Colors.textMuted },

  select: { width: '100%', padding: '0.6rem 0.85rem', border: `1.5px solid ${Colors.surfaceLight}`, borderRadius: 10, fontSize: '0.88rem', backgroundColor: Colors.surface, color: Colors.text, outline: 'none' },

  resultBox: {
    border: '1.5px solid', borderRadius: 10,
    padding: '0.85rem 1rem', marginBottom: '0.75rem',
  },
  resultLine: { margin: '0 0 0.25rem', fontSize: '0.88rem', color: Colors.text },
  errorList: { paddingLeft: '1.25rem', margin: '0.4rem 0 0' },
  errorItem: { fontSize: '0.78rem', color: Colors.textSecondary, marginBottom: '0.15rem' },

  statsRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  statChip: { fontSize: '0.8rem', padding: '0.25rem 0.65rem', backgroundColor: Colors.surface, color: Colors.textSecondary, borderRadius: 20, fontWeight: 500 },

  input: { width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8, border: `1px solid ${Colors.surfaceLight}`, backgroundColor: Colors.background, color: Colors.text, fontSize: '0.95rem', marginBottom: '0.75rem', boxSizing: 'border-box' },
  btnPrimary: { padding: '0.6rem 1.25rem', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  btnOutline: { marginLeft: 'auto', padding: '0.4rem 1rem', backgroundColor: 'transparent', color: Colors.primary, border: `1px solid ${Colors.primary}`, borderRadius: 8, cursor: 'pointer' },
};
