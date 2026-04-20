import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import type { WordEntry, CharacterState, ChatMessage, TodoItem, DailyRecord } from '../store/useStore';

// ── 同步資料結構（不含 apiKey / geminiModel，這些是裝置個人設定）──
export interface SyncData {
  words: WordEntry[];
  characterStates: Record<string, CharacterState>;
  chatHistories: Record<string, ChatMessage[]>;
  todos: TodoItem[];
  studyHistory: Record<string, DailyRecord>;
  streak: number;
  lastStudyDate: string;
  todayStudied: number;
  totalStudied: number;
  selectedCharacterId: string;
  lastSyncAt: number;
}

// 每份文件最多存幾個單字（控制在 ~700KB 以下，遠低於 Firestore 1MB 限制）
const WORDS_PER_CHUNK = 3000;

// Firestore 路徑
const metaRef  = (uid: string) => doc(db, 'users', uid, 'wordmate', 'meta');
const chunkRef = (uid: string, i: number) => doc(db, 'users', uid, 'wordmate', `words_${i}`);

// ── 寫入 ────────────────────────────────────────────────────────────

/**
 * 儲存到 Firestore
 * - meta 文件：所有非單字資料
 * - words_0, words_1 … 文件：單字分批存放（每批 3000 個）
 */
export async function saveToFirestore(uid: string, data: SyncData): Promise<void> {
  const { words, ...meta } = data;
  const now = Date.now();

  // 單字分批
  const chunks: WordEntry[][] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_CHUNK) {
    chunks.push(words.slice(i, i + WORDS_PER_CHUNK));
  }

  // Firestore batch write（最多 500 ops，meta + words_chunk）
  // 若單字超過 500 批，分多次 batch（實際上不太可能）
  const batch = writeBatch(db);
  batch.set(metaRef(uid), { ...meta, chunkCount: chunks.length, lastSyncAt: now });
  for (let i = 0; i < chunks.length; i++) {
    batch.set(chunkRef(uid, i), { words: chunks[i] });
  }
  await batch.commit();
}

// ── 讀取 ────────────────────────────────────────────────────────────

/** 從 Firestore 讀取（meta + 所有 words chunk） */
export async function loadFromFirestore(uid: string): Promise<SyncData | null> {
  const metaSnap = await getDoc(metaRef(uid));
  if (!metaSnap.exists()) return null;

  const metaData = metaSnap.data() as Omit<SyncData, 'words'> & { chunkCount?: number };
  const chunkCount = metaData.chunkCount ?? 1;

  // 讀取所有單字分批
  const wordPromises = Array.from({ length: chunkCount }, (_, i) => getDoc(chunkRef(uid, i)));
  const chunkSnaps = await Promise.all(wordPromises);
  const words: WordEntry[] = chunkSnaps.flatMap((snap) =>
    snap.exists() ? (snap.data().words as WordEntry[]) : [],
  );

  return { ...metaData, words };
}

// ── 合併邏輯 ─────────────────────────────────────────────────────────

/**
 * 合併兩份 words 陣列（local vs remote）
 * mastery 較高者優先；相同時取 timesCorrect 較多的版本
 */
export function mergeWords(local: WordEntry[], remote: WordEntry[]): WordEntry[] {
  const map = new Map<string, WordEntry>();
  for (const w of remote) map.set(w.word, w);
  for (const w of local) {
    const existing = map.get(w.word);
    if (!existing) {
      map.set(w.word, w);
    } else if (
      w.mastery > existing.mastery ||
      (w.mastery === existing.mastery && w.timesCorrect > existing.timesCorrect)
    ) {
      map.set(w.word, w);
    }
  }
  return Array.from(map.values());
}

/** 合併 studyHistory（取每天各欄位的最大值） */
export function mergeStudyHistory(
  local: Record<string, DailyRecord>,
  remote: Record<string, DailyRecord>,
): Record<string, DailyRecord> {
  const result = { ...remote };
  for (const [date, rec] of Object.entries(local)) {
    const r = result[date];
    if (!r) {
      result[date] = rec;
    } else {
      result[date] = {
        wordsStudied:     Math.max(r.wordsStudied,     rec.wordsStudied),
        quizzesTaken:     Math.max(r.quizzesTaken,     rec.quizzesTaken),
        todosCompleted:   Math.max(r.todosCompleted,   rec.todosCompleted),
        interactionCount: Math.max(r.interactionCount, rec.interactionCount),
      };
    }
  }
  return result;
}

/** 合併 todos（以 id 為 key，local wins） */
export function mergeTodos(local: TodoItem[], remote: TodoItem[]): TodoItem[] {
  const map = new Map<string, TodoItem>();
  for (const t of remote) map.set(t.id, t);
  for (const t of local)  map.set(t.id, t);
  return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
}
