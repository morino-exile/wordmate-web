import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter basename="/wordmate-web">
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dictionary" element={<DictionaryPage />} />
          <Route path="/flashcard" element={<FlashcardPage />} />
          <Route path="/quiz" element={<QuizSelectPage />} />
          <Route path="/quiz/play" element={<QuizPage />} />
          <Route path="/weak-review" element={<WeakReviewPage />} />
          <Route path="/todo" element={<TodoPage />} />
          <Route path="/character" element={<CharacterPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
