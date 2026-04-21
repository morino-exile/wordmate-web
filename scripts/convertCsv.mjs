/**
 * 將 cefrj-vocabulary-zh.csv 轉成 public/cefrj-words.json
 * 執行方式：node scripts/convertCsv.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH  = path.join(__dirname, '../../cefrj-vocabulary-zh.csv');
const OUT_PATH  = path.join(__dirname, '../public/cefrj-words.json');

const VALID_CEFR = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

// 簡易 CSV 解析（支援引號內的逗號）
function parseLine(line) {
  const fields = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      fields.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

const raw = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = raw.split(/\r?\n/).filter(Boolean);
const header = parseLine(lines[0]);

// 欄位索引
const idx = (name) => header.indexOf(name);
const iWord     = idx('headword');
const iPos      = idx('pos');
const iCefr     = idx('CEFR');
const iZh       = idx('zh_def');
const iExample  = idx('example_sentence');
const iInv      = idx('inventory');

// 同一個 headword+pos 只保留一筆（CEFR 相同），不同 CEFR 合併 exams
const map = new Map(); // key: `${word}|${pos}`

let skipped = 0;
for (let i = 1; i < lines.length; i++) {
  const f = parseLine(lines[i]);
  const word = f[iWord]?.trim();
  const pos  = f[iPos]?.trim();
  const cefr = f[iCefr]?.trim();
  const zh   = f[iZh]?.trim().replace(/^"|"$/g, '');
  const ex   = f[iExample]?.trim().replace(/^"|"$/g, '');
  const inv  = f[iInv]?.trim();

  if (!word || !VALID_CEFR.has(cefr)) { skipped++; continue; }

  const key = `${word}|${pos}`;
  if (map.has(key)) {
    const existing = map.get(key);
    if (!existing.exams.includes(cefr)) existing.exams.push(cefr);
  } else {
    map.set(key, {
      word,
      partOfSpeech: pos || '',
      meaning: zh || '',
      example: ex || '',
      exams: [cefr],
      ...(inv ? { inventory: inv } : {}),
    });
  }
}

const words = Array.from(map.values()).sort((a, b) => a.word.localeCompare(b.word));

fs.writeFileSync(OUT_PATH, JSON.stringify(words), 'utf-8');

console.log(`✅ 完成！共 ${words.length} 個單字 → public/cefrj-words.json`);
if (skipped) console.log(`⚠️  略過 ${skipped} 筆（CEFR 欄位不合法）`);
const size = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
console.log(`📦 檔案大小：${size} KB`);
