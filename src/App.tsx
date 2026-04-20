import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useStore } from './store/useStore';
import {
  saveToFirestore, loadFromFirestore,
  mergeWords, mergeStudyHistory, mergeTodos,
  type SyncData,
} from './services/firestoreSync';

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
  const [userId, setUserId] = useState<string | null>(null);

  // ── Firebase Auth 監聽 ──────────────────────────────────────────────
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const remote = await loadFromFirestore(user.uid);
          if (remote) {
            // 有雲端資料 → 合併
            const local = useStore.getState();
            const merged: Partial<SyncData> = {
              ...remote,
              words:        mergeWords(local.words, remote.words ?? []),
              studyHistory: mergeStudyHistory(local.studyHistory, remote.studyHistory ?? {}),
              todos:        mergeTodos(local.todos, remote.todos ?? []),
              // 角色狀態：取好感度較高的
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
              streak:      Math.max(local.streak, remote.streak ?? 0),
              totalStudied: Math.max(local.totalStudied, remote.totalStudied ?? 0),
            };
            useStore.getState().syncFromCloud(merged);
            // 將合併結果回存雲端
            await saveToFirestore(user.uid, { ...buildSyncData(), ...merged } as SyncData);
          } else {
            // 首次登入：將本機資料上傳
            await saveToFirestore(user.uid, buildSyncData());
          }
        } catch (err) {
          console.warn('[sync] 登入同步失敗', err);
        }
      } else {
        setUserId(null);
      }
    });
    return unsubAuth;
  }, []);

  // ── 自動同步：store 有變化時 debounce 5 秒後存雲端 ──────────────────
  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout>;

    const unsub = useStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        saveToFirestore(userId, buildSyncData()).catch((err) =>
          console.warn('[sync] 自動同步失敗', err),
        );
      }, 5000);
    });

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [userId]);

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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
