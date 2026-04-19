import type { ExamCategory } from '../data/wordList';
import type { WordEntry } from '../store/useStore';

// 解析 CSV（處理有引號、含逗號的欄位）
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let cur = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        cols.push(cur.trim()); cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

// CEFR 等級對應
function cefrToCategory(cefr: string): ExamCategory | null {
  const map: Record<string, ExamCategory> = {
    a1: 'A1', a2: 'A2', b1: 'B1', b2: 'B2', c1: 'C1', c2: 'C2',
  };
  return map[cefr.toLowerCase()] ?? null;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// 主要匯入函數
export function parseCEFRCsv(
  csvText: string,
  existingWords: WordEntry[],
  addWord: (w: WordEntry) => void
): ImportResult {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return { imported: 0, skipped: 0, errors: ['檔案是空的'] };

  // 自動偵測欄位位置
  const header = rows[0].map((h) => h.toLowerCase().trim());
  const col = (name: string) => header.findIndex((h) => h.includes(name));

  const idxWord    = col('headword') !== -1 ? col('headword') : 0;
  const idxPos     = col('pos') !== -1 ? col('pos') : 1;
  const idxCefr    = col('cefr') !== -1 ? col('cefr') : 2;
  const idxZhDef  = col('zh_def') !== -1 ? col('zh_def') : col('zh') !== -1 ? col('zh') : 6;
  const idxExample = col('example') !== -1 ? col('example') : 7;

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  const existingSet = new Set(existingWords.map((w) => w.word.toLowerCase()));

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    const word = row[idxWord]?.trim().toLowerCase();
    if (!word) continue;

    // 已存在則跳過（不覆蓋學習進度）
    if (existingSet.has(word)) { skipped++; continue; }

    const cefrRaw = row[idxCefr]?.trim() ?? '';
    const category = cefrToCategory(cefrRaw);
    const meaning  = row[idxZhDef]?.trim() ?? '';
    const example  = row[idxExample]?.trim() ?? '';
    const pos      = row[idxPos]?.trim() ?? '';

    if (!meaning) { errors.push(`第 ${i + 1} 行：${word} 缺少中文釋義`); skipped++; continue; }

    const entry: WordEntry = {
      word,
      phonetic: '',
      meaning,
      partOfSpeech: pos,
      example,
      exams: category ? [category] : [],
      mastery: 0,
      nextReview: Date.now(),
      timesCorrect: 0,
      timesWrong: 0,
    };

    addWord(entry);
    existingSet.add(word);
    imported++;
  }

  return { imported, skipped, errors };
}
