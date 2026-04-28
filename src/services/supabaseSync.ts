import { supabase } from '../supabase';
import type { WordEntry, CharacterState, TodoItem, DailyRecord } from '../store/useStore';

// ── 同步資料結構（與 firestoreSync 相容）────────────────────────
export interface SyncData {
  words: WordEntry[];
  characterStates: Record<string, CharacterState>;
  chatHistories: Record<string, { id: string; text: string; isUser: boolean; timestamp: number }[]>;
  todos: TodoItem[];
  studyHistory: Record<string, DailyRecord>;
  streak: number;
  lastStudyDate: string;
  todayStudied: number;
  totalStudied: number;
  selectedCharacterId: string;
  lastSyncAt: number;
}

// ── 寫入 Supabase ────────────────────────────────────────────────

export async function saveToSupabase(data: SyncData): Promise<void> {
  // 只同步有學習進度的單字
  const studiedWords = data.words.filter(
    (w) => w.mastery > 0 || w.timesCorrect > 0 || w.timesWrong > 0,
  );

  // 1. 單字進度
  if (studiedWords.length > 0) {
    await supabase.from('word_progress').upsert(
      studiedWords.map((w) => ({
        word:            w.word,
        mastery:         w.mastery,
        next_review:     w.nextReview,
        times_correct:   w.timesCorrect,
        times_wrong:     w.timesWrong,
        last_wrong_date: w.lastWrongDate ?? null,
        updated_at:      new Date().toISOString(),
      })),
      { onConflict: 'word' },
    );
  }

  // 2. 每日學習統計
  const dailyRows = Object.entries(data.studyHistory).map(([date, rec]) => ({
    date,
    words_studied:     rec.wordsStudied,
    quizzes_taken:     rec.quizzesTaken,
    todos_completed:   rec.todosCompleted,
    interaction_count: rec.interactionCount,
  }));
  if (dailyRows.length > 0) {
    await supabase.from('study_daily').upsert(dailyRows, { onConflict: 'date' });
  }

  // 3. 角色狀態
  const charRows = Object.values(data.characterStates).map((c) => ({
    character_id:   c.id,
    affection:      c.affection,
    stamina:        c.stamina,
    unlocked_lines: c.unlockedLines,
  }));
  if (charRows.length > 0) {
    await supabase.from('character_states').upsert(charRows, { onConflict: 'character_id' });
  }

  // 4. 全域統計（單行，id = 1）
  await supabase.from('learning_stats').upsert({
    id:                    1,
    streak:                data.streak,
    last_study_date:       data.lastStudyDate || null,
    today_studied:         data.todayStudied,
    total_studied:         data.totalStudied,
    selected_character_id: data.selectedCharacterId,
  }, { onConflict: 'id' });

  // 5. 待辦事項
  if (data.todos.length > 0) {
    await supabase.from('todos').upsert(
      data.todos.map((t) => ({
        id:           t.id,
        text:         t.text,
        completed:    t.completed,
        character_id: t.characterId,
        created_at:   t.createdAt,
        due_date:     t.dueDate ?? null,
      })),
      { onConflict: 'id' },
    );
  }
}

// ── 從 Supabase 讀取 ─────────────────────────────────────────────

export async function loadFromSupabase(): Promise<SyncData | null> {
  const [wordsRes, dailyRes, charRes, statsRes, todosRes] = await Promise.all([
    supabase.from('word_progress').select('*'),
    supabase.from('study_daily').select('*'),
    supabase.from('character_states').select('*'),
    supabase.from('learning_stats').select('*').eq('id', 1).single(),
    supabase.from('todos').select('*').order('created_at'),
  ]);

  // 完全沒有資料（第一次使用）
  if (!statsRes.data) return null;

  // 重建 words
  const words: WordEntry[] = (wordsRes.data ?? []).map((r) => ({
    word:          r.word,
    meaning:       '',          // 定義來自內建單字庫，不需存雲端
    mastery:       r.mastery,
    nextReview:    r.next_review,
    timesCorrect:  r.times_correct,
    timesWrong:    r.times_wrong,
    lastWrongDate: r.last_wrong_date ?? undefined,
    exams:         [],
  }));

  // 重建 studyHistory
  const studyHistory: Record<string, DailyRecord> = {};
  for (const r of dailyRes.data ?? []) {
    studyHistory[r.date] = {
      wordsStudied:     r.words_studied,
      quizzesTaken:     r.quizzes_taken,
      todosCompleted:   r.todos_completed,
      interactionCount: r.interaction_count,
    };
  }

  // 重建 characterStates
  const characterStates: Record<string, CharacterState> = {};
  for (const r of charRes.data ?? []) {
    characterStates[r.character_id] = {
      id:            r.character_id,
      affection:     r.affection,
      stamina:       r.stamina,
      unlockedLines: r.unlocked_lines ?? [],
    };
  }

  // 重建 todos
  const todos: TodoItem[] = (todosRes.data ?? []).map((r) => ({
    id:          r.id,
    text:        r.text,
    completed:   r.completed,
    characterId: r.character_id ?? '',
    createdAt:   r.created_at,
    dueDate:     r.due_date ?? undefined,
  }));

  const stats = statsRes.data;

  return {
    words,
    characterStates,
    chatHistories:       {},   // 對話記錄不同步雲端
    todos,
    studyHistory,
    streak:              stats.streak,
    lastStudyDate:       stats.last_study_date ?? '',
    todayStudied:        stats.today_studied,
    totalStudied:        stats.total_studied,
    selectedCharacterId: stats.selected_character_id,
    lastSyncAt:          Date.now(),
  };
}

// ── 合併邏輯（與 firestoreSync 相同）────────────────────────────

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

export function mergeTodos(local: TodoItem[], remote: TodoItem[]): TodoItem[] {
  const map = new Map<string, TodoItem>();
  for (const t of remote) map.set(t.id, t);
  for (const t of local)  map.set(t.id, t);
  return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
}
