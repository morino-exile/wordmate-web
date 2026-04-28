import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useBuiltinWords } from './store/useBuiltinWords';
import {
  saveToSupabase, loadFromSupabase,
  mergeWords, mergeStudyHistory, mergeTodos,
  type SyncData,
} from './services/supabaseSync';

import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DictionaryPage from './pages/DictionaryPage';
import FlashcardPage from './pages/FlashcardPage';
import QuizSelectPage from './pages/QuizSelectPage';
import QuizPage from './pages/QuizPage';
import WeakReviewPage from './pages/WeakReviewPage';
import SettingsPage from './pages/SettingsPage';
import TodoPage from './pages/TodoPage';
import CharacterPage from './pages/CharacterPage';
import SpellingPage from './pages/SpellingPage';
import StatsPage from './pages/StatsPage';

/** 將目前 store 狀態打包成 SyncData */
function buildSyncData(): SyncData {
  const s = useStore.getState();
  return {
    words:               s.words,
    characterStates:     s.characterStates,
    chatHistories:       s.chatHistories,
    todos:               s.todos,
    studyHistory:        s.studyHistory,
    streak:              s.streak,
    lastStudyDate:       s.lastStudyDate,
    todayStudied:        s.todayStudied,
    totalStudied:        s.totalStudied,
    selectedCharacterId: s.selectedCharacterId,
    lastSyncAt:          Date.now(),
  };
}

export default function App() {
  const loadBuiltinWords = useBuiltinWords((s) => s.load);

  // 啟動時載入 CEFR 單字庫
  useEffect(() => { loadBuiltinWords(); }, []);

  // 通知：App 開啟時若有到期複習則推送
  useEffect(() => {
    const { notificationsEnabled, getWordsForReview } = useStore.getState();
    if (!notificationsEnabled || Notification.permission !== 'granted') return;
    const due = getWordsForReview(50).length;
    if (due > 0) {
      new Notification('WordMate 複習提醒 📚', {
        body: `你有 ${due} 個單字需要複習！`,
        icon: '/wordmate-web/favicon.svg',
      });
    }
  }, []);

  // ── 啟動同步：從 Supabase 載入並合併 ────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const remote = await loadFromSupabase();
        if (remote) {
          const local = useStore.getState();
          const merged: Partial<SyncData> = {
            ...remote,
            words:        mergeWords(local.words, remote.words ?? []),
            studyHistory: mergeStudyHistory(local.studyHistory, remote.studyHistory ?? {}),
            todos:        mergeTodos(local.todos, remote.todos ?? []),
            characterStates: (() => {
              const merged: typeof remote.characterStates = { ...remote.characterStates };
              for (const [id, state] of Object.entries(local.characterStates)) {
                const r = merged[id];
                if (!r) { merged[id] = state; }
                else {
                  merged[id] = {
                    ...r,
                    affection: Math.max(r.affection, state.affection),
                    stamina:   Math.max(r.stamina,   state.stamina),
                  };
                }
              }
              return merged;
            })(),
            streak:       Math.max(local.streak, remote.streak ?? 0),
            totalStudied: Math.max(local.totalStudied, remote.totalStudied ?? 0),
          };
          useStore.getState().syncFromCloud(merged);
          // 合併結果回存雲端
          await saveToSupabase({ ...buildSyncData(), ...merged } as SyncData);
        } else {
          // 首次使用：將本機資料上傳
          await saveToSupabase(buildSyncData());
        }
      } catch (err) {
        console.warn('[sync] 啟動同步失敗', err);
      }
    })();
  }, []);

  // ── 自動同步：store 有變化時 debounce 5 秒後存雲端 ──────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const unsub = useStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        saveToSupabase(buildSyncData()).catch((err) =>
          console.warn('[sync] 自動同步失敗', err),
        );
      }, 5000);
    });
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  return (
    <BrowserRouter basename="/wordmate-web">
      <Layout>
        <Routes>
          <Route path="/"             element={<HomePage />} />
          <Route path="/dictionary"   element={<DictionaryPage />} />
          <Route path="/flashcard"    element={<FlashcardPage />} />
          <Route path="/quiz"         element={<QuizSelectPage />} />
          <Route path="/quiz/play"    element={<QuizPage />} />
          <Route path="/weak-review"  element={<WeakReviewPage />} />
          <Route path="/todo"         element={<TodoPage />} />
          <Route path="/character"    element={<CharacterPage />} />
          <Route path="/settings"     element={<SettingsPage />} />
          <Route path="/spelling"     element={<SpellingPage />} />
          <Route path="/stats"        element={<StatsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
