import { create } from 'zustand';
import type { StarterWord } from '../data/wordList';

interface BuiltinWordsStore {
  words: StarterWord[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
}

export const useBuiltinWords = create<BuiltinWordsStore>((set, get) => ({
  words: [],
  loading: false,
  error: null,

  load: async () => {
    if (get().words.length > 0 || get().loading) return; // 只載入一次
    set({ loading: true, error: null });
    try {
      const res = await fetch('/wordmate-web/cefrj-words.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StarterWord[] = await res.json();
      set({ words: data, loading: false });
    } catch (err) {
      set({ error: String(err), loading: false });
    }
  },
}));
