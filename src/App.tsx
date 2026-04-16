import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DictionaryPage from './pages/DictionaryPage';
import FlashcardPage from './pages/FlashcardPage';
import QuizPage from './pages/QuizPage';
import WeakReviewPage from './pages/WeakReviewPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter basename="/wordmate-web">
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dictionary" element={<DictionaryPage />} />
          <Route path="/flashcard" element={<FlashcardPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/weak-review" element={<WeakReviewPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
