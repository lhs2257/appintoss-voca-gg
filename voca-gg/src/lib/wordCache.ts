// voca.gg - 단어 캐시 (Firebase Realtime DB)
//
// 로컬 DB에 없는 단어를 외부 API로 조회한 결과를 저장합니다.
// 한번 조회된 단어는 다음 사용 시 API 호출 없이 즉시 반환됩니다.
//
// Firebase DB 경로: /wordCache/{word}
//   { meaning: "한국어 의미", cachedAt: timestamp }

import { ref, get, set } from 'firebase/database';
import { db } from './firebase';

interface CachedWord {
  meaning: string;
  cachedAt: number;
}

/**
 * Firebase 캐시에서 단어의 한국어 의미를 조회
 * @returns 캐시된 의미 or null (캐시 없음 / 오류)
 */
export async function getCachedMeaning(word: string): Promise<string | null> {
  try {
    const snapshot = await get(ref(db, `wordCache/${word.toLowerCase()}`));
    if (!snapshot.exists()) return null;
    const data = snapshot.val() as CachedWord;
    return data.meaning ?? null;
  } catch {
    return null; // 캐시 조회 실패는 무시 (외부 API로 폴백)
  }
}

/**
 * 단어의 한국어 의미를 Firebase 캐시에 저장
 * fire-and-forget 방식으로 호출 (await 불필요)
 */
export function cacheMeaning(word: string, meaning: string): void {
  const entry: CachedWord = {
    meaning,
    cachedAt: Date.now(),
  };
  set(ref(db, `wordCache/${word.toLowerCase()}`), entry).catch(() => {
    // 캐시 저장 실패는 조용히 무시
  });
}
