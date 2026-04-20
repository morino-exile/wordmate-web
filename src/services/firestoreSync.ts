import { doc, getDoc, setDoc } from 'firebase/firestore';
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

// Firestore 路徑：/users/{uid}/wordmate/data
function getRef(uid: string) {
  return doc(db, 'users', uid, 'wordmate', 'data');
}

/** 儲存到 Firestore（只同步有學習紀錄的單字，減少文件大小） */
export async function saveToFirestore(uid: string, data: SyncData): Promise<void> {
  // 只上傳「有被學習過」的單字（mastery > 0 或有答題紀錄）
  const studiedWords = data.words.filter(
    (w) => w.mastery > 0 || w.timesCorrect > 0 || w.timesWrong > 0,
  );
  await setDoc(getRef(uid), { ...data, words: studiedWords, lastSyncAt: Date.now() });
}

/** 從 Firestore 讀取 */
export async function loadFromFirestore(uid: string): Promise<SyncData | null> {
  const snap = await getDoc(getRef(uid));
  if (!snap.exists()) return null;
  return snap.data() as SyncData;
}

/**
 * 合併兩份 words 陣列（local vs remote）
 * 以 mastery 較高者為準；相同時取 timesCorrect 較多的版本
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

/**
 * 合併 studyHistory（取每天各欄位的最大值）
 */
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

/**
 * 合併 todos（以 id 為 key，保留所有不重複的 todo）
 */
export function mergeTodos(local: TodoItem[], remote: TodoItem[]): TodoItem[] {
  const map = new Map<string, TodoItem>();
  for (const t of remote) map.set(t.id, t);
  for (const t of local)  map.set(t.id, t); // local wins（保留本機最新狀態）
  return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
}
