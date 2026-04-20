// Free Dictionary API 音檔 cache（避免重複請求）
const audioCache = new Map<string, string | null>();

/**
 * 播放單字發音
 * 優先使用 Free Dictionary API 的真人音檔，
 * 若無音檔則 fallback 到瀏覽器 Web Speech API
 */
export async function playWord(word: string): Promise<void> {
  // 查 cache
  let audioUrl = audioCache.get(word);

  if (audioUrl === undefined) {
    // 尚未查過，打 Free Dictionary API
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { signal: AbortSignal.timeout(3000) },
      );
      if (res.ok) {
        const data = await res.json();
        const phonetics: { audio?: string }[] = data[0]?.phonetics ?? [];
        audioUrl = phonetics.find((p) => p.audio)?.audio ?? null;
      } else {
        audioUrl = null;
      }
    } catch {
      audioUrl = null;
    }
    audioCache.set(word, audioUrl);
  }

  // 有音檔：播放 MP3
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
      return;
    } catch {
      // 播放失敗（CORS/格式問題）→ 繼續 fallback
    }
  }

  // Fallback：Web Speech API（瀏覽器內建，無需 API key）
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  }
}
