// Built-in starter word list + exam word bank

export type ExamCategory = '基本2000' | '基本5000' | 'TOEFL' | 'TOEIC';

export interface StarterWord {
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic: string;
  example: string;
  exams: ExamCategory[];
}

export const starterWords: StarterWord[] = [
  { word: 'abandon', meaning: '放棄；拋棄', partOfSpeech: 'verb', phonetic: '/əˈbændən/', example: 'He abandoned his old car in the parking lot.', exams: ['基本2000', 'TOEFL', 'TOEIC'] },
  { word: 'benefit', meaning: '好處；利益', partOfSpeech: 'noun', phonetic: '/ˈbenɪfɪt/', example: 'Exercise has many health benefits.', exams: ['基本2000', 'TOEIC'] },
  { word: 'challenge', meaning: '挑戰', partOfSpeech: 'noun', phonetic: '/ˈtʃælɪndʒ/', example: 'Learning a new language is a real challenge.', exams: ['基本2000', 'TOEIC'] },
  { word: 'determine', meaning: '決定；確定', partOfSpeech: 'verb', phonetic: '/dɪˈtɜːrmɪn/', example: 'We need to determine the cause of the problem.', exams: ['基本2000', 'TOEFL', 'TOEIC'] },
  { word: 'essential', meaning: '必要的；本質的', partOfSpeech: 'adjective', phonetic: '/ɪˈsenʃəl/', example: 'Water is essential for life.', exams: ['基本2000', 'TOEFL', 'TOEIC'] },
  { word: 'frequent', meaning: '頻繁的', partOfSpeech: 'adjective', phonetic: '/ˈfriːkwənt/', example: 'She is a frequent visitor to the library.', exams: ['基本2000', 'TOEIC'] },
  { word: 'generate', meaning: '產生；生成', partOfSpeech: 'verb', phonetic: '/ˈdʒenəreɪt/', example: 'Solar panels generate electricity.', exams: ['基本5000', 'TOEFL'] },
  { word: 'hesitate', meaning: '猶豫', partOfSpeech: 'verb', phonetic: '/ˈhezɪteɪt/', example: "Don't hesitate to ask for help.", exams: ['基本2000', 'TOEIC'] },
  { word: 'influence', meaning: '影響', partOfSpeech: 'noun', phonetic: '/ˈɪnfluəns/', example: 'Music has a big influence on my mood.', exams: ['基本2000', 'TOEFL', 'TOEIC'] },
  { word: 'justify', meaning: '證明……正當', partOfSpeech: 'verb', phonetic: '/ˈdʒʌstɪfaɪ/', example: 'How can you justify spending so much money?', exams: ['基本5000', 'TOEFL'] },
  { word: 'maintain', meaning: '維持；保養', partOfSpeech: 'verb', phonetic: '/meɪnˈteɪn/', example: 'It is important to maintain a healthy diet.', exams: ['基本2000', 'TOEFL', 'TOEIC'] },
  { word: 'negotiate', meaning: '談判；協商', partOfSpeech: 'verb', phonetic: '/nɪˈɡoʊʃieɪt/', example: 'They negotiated a peace agreement.', exams: ['基本5000', 'TOEFL', 'TOEIC'] },
  { word: 'obvious', meaning: '明顯的', partOfSpeech: 'adjective', phonetic: '/ˈɑːbviəs/', example: 'The answer was obvious to everyone.', exams: ['基本2000', 'TOEIC'] },
  { word: 'perspective', meaning: '觀點；視角', partOfSpeech: 'noun', phonetic: '/pərˈspektɪv/', example: 'Try to see things from a different perspective.', exams: ['基本5000', 'TOEFL'] },
  { word: 'reluctant', meaning: '不情願的', partOfSpeech: 'adjective', phonetic: '/rɪˈlʌktənt/', example: 'She was reluctant to leave her hometown.', exams: ['基本5000', 'TOEFL'] },
  { word: 'significant', meaning: '重要的；顯著的', partOfSpeech: 'adjective', phonetic: '/sɪɡˈnɪfɪkənt/', example: 'There has been a significant improvement.', exams: ['基本2000', 'TOEFL', 'TOEIC'] },
  { word: 'temporary', meaning: '暫時的', partOfSpeech: 'adjective', phonetic: '/ˈtempəreri/', example: 'This is only a temporary solution.', exams: ['基本2000', 'TOEIC'] },
  { word: 'ultimate', meaning: '最終的；極致的', partOfSpeech: 'adjective', phonetic: '/ˈʌltɪmət/', example: 'The ultimate goal is world peace.', exams: ['基本5000', 'TOEFL'] },
  { word: 'vulnerable', meaning: '脆弱的；易受傷的', partOfSpeech: 'adjective', phonetic: '/ˈvʌlnərəbl/', example: 'Children are vulnerable to infections.', exams: ['基本5000', 'TOEFL'] },
  { word: 'widespread', meaning: '廣泛的', partOfSpeech: 'adjective', phonetic: '/ˈwaɪdspred/', example: 'The use of smartphones is now widespread.', exams: ['基本5000', 'TOEFL', 'TOEIC'] },
  { word: 'accomplish', meaning: '完成；達成', partOfSpeech: 'verb', phonetic: '/əˈkɑːmplɪʃ/', example: 'She accomplished her goal of graduating early.', exams: ['基本5000', 'TOEFL'] },
  { word: 'boundary', meaning: '邊界；界限', partOfSpeech: 'noun', phonetic: '/ˈbaʊndəri/', example: 'You need to set clear boundaries.', exams: ['基本5000', 'TOEFL'] },
  { word: 'consistent', meaning: '一致的；持續的', partOfSpeech: 'adjective', phonetic: '/kənˈsɪstənt/', example: 'Be consistent with your daily routine.', exams: ['基本5000', 'TOEFL', 'TOEIC'] },
  { word: 'demonstrate', meaning: '展示；證明', partOfSpeech: 'verb', phonetic: '/ˈdemənstreɪt/', example: 'Let me demonstrate how it works.', exams: ['基本5000', 'TOEFL', 'TOEIC'] },
  { word: 'enthusiasm', meaning: '熱情', partOfSpeech: 'noun', phonetic: '/ɪnˈθuːziæzəm/', example: 'She showed great enthusiasm for the project.', exams: ['基本5000', 'TOEFL'] },
  { word: 'frustrate', meaning: '使沮喪', partOfSpeech: 'verb', phonetic: '/ˈfrʌstreɪt/', example: 'The slow internet frustrated everyone.', exams: ['基本5000', 'TOEFL'] },
  { word: 'genuine', meaning: '真正的；真誠的', partOfSpeech: 'adjective', phonetic: '/ˈdʒenjuɪn/', example: 'She showed genuine concern for others.', exams: ['基本5000', 'TOEFL', 'TOEIC'] },
  { word: 'highlight', meaning: '強調；亮點', partOfSpeech: 'verb', phonetic: '/ˈhaɪlaɪt/', example: 'The report highlights the main issues.', exams: ['基本2000', 'TOEIC'] },
  { word: 'implement', meaning: '實施；執行', partOfSpeech: 'verb', phonetic: '/ˈɪmplɪment/', example: 'We need to implement the new policy.', exams: ['基本5000', 'TOEFL', 'TOEIC'] },
  { word: 'phenomenon', meaning: '現象', partOfSpeech: 'noun', phonetic: '/fɪˈnɑːmɪnən/', example: 'Social media is a modern phenomenon.', exams: ['基本5000', 'TOEFL'] },
];

// Import the large exam word bank and merge with starter words
import { examWordBank } from './examWords';

// Combined word bank: merge starterWords + examWordBank, deduplicate by word
function mergeWordBanks(): StarterWord[] {
  const map = new Map<string, StarterWord>();
  // Add starter words first (they take priority)
  for (const w of starterWords) {
    map.set(w.word.toLowerCase(), w);
  }
  // Merge exam words, combining exams arrays for duplicates
  for (const w of examWordBank) {
    const key = w.word.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      const mergedExams = [...new Set([...existing.exams, ...w.exams])] as ExamCategory[];
      map.set(key, { ...existing, exams: mergedExams });
    } else {
      map.set(key, w);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.word.localeCompare(b.word));
}

export const allWords: StarterWord[] = mergeWordBanks();

// Helper: get words filtered by exam category (from full bank)
export function getWordsByExam(exam: ExamCategory): StarterWord[] {
  return allWords.filter((w) => w.exams.includes(exam));
}

// All exam categories with metadata
export const examCategories: { id: ExamCategory; label: string; icon: string; color: string; description: string }[] = [
  { id: '基本2000', label: '基本 2000', icon: 'book-outline', color: '#6A9EC0', description: '基礎必備單字' },
  { id: '基本5000', label: '基本 5000', icon: 'library-outline', color: '#7DB88E', description: '進階常用單字' },
  { id: 'TOEFL', label: 'TOEFL', icon: 'globe-outline', color: '#D4956B', description: '托福常考單字' },
  { id: 'TOEIC', label: 'TOEIC', icon: 'briefcase-outline', color: '#B8A5D4', description: '多益常考單字' },
];

// Fetch word definition from Free Dictionary API
export async function fetchWordDefinition(word: string): Promise<{
  phonetic?: string;
  meaning?: string;
  partOfSpeech?: string;
  example?: string;
} | null> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data[0];
    const firstMeaning = entry?.meanings?.[0];
    const firstDef = firstMeaning?.definitions?.[0];

    return {
      phonetic: entry?.phonetic || entry?.phonetics?.[0]?.text,
      meaning: firstDef?.definition,
      partOfSpeech: firstMeaning?.partOfSpeech,
      example: firstDef?.example,
    };
  } catch {
    return null;
  }
}
