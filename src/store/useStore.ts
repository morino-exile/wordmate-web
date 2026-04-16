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
  mastery: number;
  nextReview: number;
  timesCorrect: number;
  timesWrong: number;
  exams: ExamCategory[];
  lastWrongDate?: number;
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
    }),
    {
      name: 'wordmate-storage', // localStorage key
    }
  )
);
