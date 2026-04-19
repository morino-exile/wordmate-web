import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExamCategory } from '../data/wordList';
import { allWords } from '../data/wordList';

// ---- Types ----
export interface WordEntry {
  word: string;
  phonetic?: string;
  meaning: string;
  partOfSpeech?: string;
  example?: string;
  mastery: number;       // 0–5（設計文件 familiarity）
  nextReview: number;    // timestamp
  timesCorrect: number;
  timesWrong: number;
  exams: ExamCategory[];
  inventory?: string;    // 情境分類（education / travel / …）
  lastWrongDate?: number;
}

// SRS 間隔（對齊設計文件）
const SRS_INTERVALS_MS = [
  1 * 3600_000,      // 0 → 1 小時後（當天）
  1 * 86400_000,     // 1 → 1 天
  3 * 86400_000,     // 2 → 3 天
  7 * 86400_000,     // 3 → 7 天
  14 * 86400_000,    // 4 → 14 天
  30 * 86400_000,    // 5 → 30 天
];

export function calcNextReview(mastery: number): number {
  const idx = Math.min(mastery, SRS_INTERVALS_MS.length - 1);
  return Date.now() + SRS_INTERVALS_MS[idx];
}

export function updateMastery(current: number, correct: boolean): number {
  if (correct) return Math.min(5, current + 1);
  return Math.max(0, current - 2); // 答錯懲罰 -2（設計文件規格）
}

export interface CharacterState {
  id: string;
  affection: number;
  stamina: number;
  unlockedLines: string[];
}

export interface DailyRecord {
  wordsStudied: number;
  quizzesTaken: number;
  todosCompleted: number;
  interactionCount: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  characterId: string;
  createdAt: number;
  dueDate?: number;
}

export interface AppState {
  // 學習資料
  words: WordEntry[];
  todayStudied: number;
  totalStudied: number;
  streak: number;
  lastStudyDate: string;
  studyHistory: Record<string, DailyRecord>;

  // 角色
  selectedCharacterId: string;
  characterStates: Record<string, CharacterState>;
  chatHistories: Record<string, ChatMessage[]>;

  // 待辦
  todos: TodoItem[];

  // 設定（API key 只存在 localStorage，不上傳 Firestore）
  apiKey: string;

  // Actions
  selectCharacter: (id: string) => void;
  addAffection: (id: string, amount: number) => void;
  addStamina: (id: string, amount: number) => void;
  recordStudy: (correct: boolean) => void;
  addWord: (word: WordEntry) => void;
  getWordsForReview: (limit?: number) => WordEntry[];
  getWeakWords: (limit?: number) => WordEntry[];
  getWordProgressByExam: (exam: ExamCategory) => { total: number; learned: number; mastered: number };
  setApiKey: (key: string) => void;
  recordDailyStudy: (count?: number) => void;
  recordDailyQuiz: () => void;
  addChatMessage: (characterId: string, message: ChatMessage) => void;
  clearChatHistory: (characterId: string) => void;
  addTodo: (text: string, dueDate?: number) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
}

function isConsecutiveDay(prev: string, current: string): boolean {
  if (!prev) return false;
  const diff = new Date(current).getTime() - new Date(prev).getTime();
  return diff <= 86400000 * 1.5;
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      words: [],
      todayStudied: 0,
      totalStudied: 0,
      streak: 0,
      lastStudyDate: '',
      studyHistory: {},
      selectedCharacterId: 'shiHe',
      characterStates: {},
      chatHistories: {},
      todos: [],
      apiKey: '',

      selectCharacter: (id) => {
        const states = { ...get().characterStates };
        if (!states[id]) {
          states[id] = { id, affection: 0, stamina: 50, unlockedLines: [] };
        }
        set({ selectedCharacterId: id, characterStates: states });
      },

      addAffection: (id, amount) => {
        const states = { ...get().characterStates };
        if (!states[id]) return;
        states[id] = {
          ...states[id],
          affection: Math.min(100, Math.max(0, states[id].affection + amount)),
        };
        set({ characterStates: states });
      },

      addStamina: (id, amount) => {
        const states = { ...get().characterStates };
        if (!states[id]) return;
        states[id] = {
          ...states[id],
          stamina: Math.min(100, Math.max(0, states[id].stamina + amount)),
        };
        set({ characterStates: states });
      },

      recordStudy: (correct) => {
        const { lastStudyDate, todayStudied, totalStudied, streak, selectedCharacterId } = get();
        const today = getTodayKey();
        const isNewDay = lastStudyDate !== today;
        set({
          todayStudied: isNewDay ? 1 : todayStudied + 1,
          totalStudied: totalStudied + 1,
          streak: isNewDay
            ? isConsecutiveDay(lastStudyDate, today) ? streak + 1 : 1
            : streak,
          lastStudyDate: today,
        });
        if (correct) {
          get().addAffection(selectedCharacterId, 2);
          get().addStamina(selectedCharacterId, 3);
        }
      },

      addWord: (word) => {
        const words = [...get().words];
        const idx = words.findIndex((w) => w.word === word.word);
        if (idx >= 0) words[idx] = word;
        else words.push(word);
        set({ words });
      },

      getWordsForReview: (limit = 10) => {
        const now = Date.now();
        return get().words
          .filter((w) => w.nextReview <= now)
          .sort((a, b) => a.nextReview - b.nextReview)
          .slice(0, limit);
      },

      getWeakWords: (limit = 20) =>
        get().words
          .filter((w) => w.timesWrong > 0 && w.mastery < 3)
          .sort((a, b) => {
            const rA = a.timesWrong / (a.timesCorrect + a.timesWrong);
            const rB = b.timesWrong / (b.timesCorrect + b.timesWrong);
            if (rB !== rA) return rB - rA;
            return (b.lastWrongDate ?? 0) - (a.lastWrongDate ?? 0);
          })
          .slice(0, limit),

      getWordProgressByExam: (exam) => {
        const examWords = allWords.filter((w) => w.exams.includes(exam));
        const total = examWords.length;
        let learned = 0, mastered = 0;
        for (const sw of examWords) {
          const entry = get().words.find((w) => w.word === sw.word);
          if (entry) { learned++; if (entry.mastery >= 3) mastered++; }
        }
        return { total, learned, mastered };
      },

      setApiKey: (key) => set({ apiKey: key }),

      recordDailyStudy: (count = 1) => {
        const key = getTodayKey();
        const history = { ...get().studyHistory };
        const rec = history[key] || { wordsStudied: 0, quizzesTaken: 0, todosCompleted: 0, interactionCount: 0 };
        history[key] = { ...rec, wordsStudied: rec.wordsStudied + count };
        set({ studyHistory: history });
      },

      recordDailyQuiz: () => {
        const key = getTodayKey();
        const history = { ...get().studyHistory };
        const rec = history[key] || { wordsStudied: 0, quizzesTaken: 0, todosCompleted: 0, interactionCount: 0 };
        history[key] = { ...rec, quizzesTaken: rec.quizzesTaken + 1 };
        set({ studyHistory: history });
      },

      addChatMessage: (characterId, message) => {
        const histories = { ...get().chatHistories };
        const current = histories[characterId] || [];
        histories[characterId] = [...current, message].slice(-50);
        set({ chatHistories: histories });
      },

      clearChatHistory: (characterId) => {
        const histories = { ...get().chatHistories };
        histories[characterId] = [];
        set({ chatHistories: histories });
      },

      addTodo: (text, dueDate) => {
        const todo: TodoItem = {
          id: Date.now().toString(),
          text,
          completed: false,
          characterId: get().selectedCharacterId,
          createdAt: Date.now(),
          dueDate,
        };
        set({ todos: [...get().todos, todo] });
      },

      toggleTodo: (id) => {
        set({ todos: get().todos.map((t) => t.id === id ? { ...t, completed: !t.completed } : t) });
      },

      deleteTodo: (id) => {
        set({ todos: get().todos.filter((t) => t.id !== id) });
      },
    }),
    {
      name: 'wordmate-storage', // localStorage key
    }
  )
);
