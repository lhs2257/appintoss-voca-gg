// voca.gg - 게임 로직 유틸리티

import wordsData from '../data/words.json';
import type { WordDB, WordEntry, GameCondition, PlayedWord } from './types';
import { isValidEnglishWord, translateToKorean } from './externalDict';
import { getCachedMeaning, cacheMeaning } from './wordCache';
import { DEEPL_API_KEY } from './config';

const WORD_DB: WordDB = wordsData as WordDB;

/**
 * 사용 가능한 게임 조건 목록 (단어 15개 이상인 조합만)
 */
export const VALID_CONDITIONS: GameCondition[] = Object.keys(WORD_DB)
  .filter((key) => (WORD_DB[key]?.length ?? 0) >= 15)
  .map((key) => {
    const parts = key.split('_');
    return { first: parts[0] ?? '', last: parts[1] ?? '' };
  })
  .filter((c): c is GameCondition => c.first !== '' && c.last !== '');

/**
 * 랜덤 게임 조건 선택
 */
export function pickRandomCondition(): GameCondition {
  const idx = Math.floor(Math.random() * VALID_CONDITIONS.length);
  return VALID_CONDITIONS[idx] ?? VALID_CONDITIONS[0] ?? { first: 'a', last: 'e' };
}

/**
 * 게임 조건 키 생성 (예: 'a_e')
 */
export function conditionKey(condition: GameCondition): string {
  return `${condition.first}_${condition.last}`;
}

/**
 * 단어 유효성 검사
 * @returns { valid: boolean, reason?: string, meaning?: string }
 */
export function validateWord(
  input: string,
  condition: GameCondition,
  usedWords: PlayedWord[],
): { valid: boolean; reason?: string; meaning?: string } {
  const word = input.trim().toLowerCase();

  if (!word) {
    return { valid: false, reason: '단어를 입력해주세요.' };
  }

  if (word[0] !== condition.first) {
    return { valid: false, reason: `'${condition.first}'로 시작하는 단어를 입력하세요.` };
  }

  if (word[word.length - 1] !== condition.last) {
    return { valid: false, reason: `'${condition.last}'로 끝나는 단어를 입력하세요.` };
  }

  const key = conditionKey(condition);
  const wordList = WORD_DB[key] ?? [];
  const found = wordList.find((w) => w.word === word);

  if (!found) {
    return { valid: false, reason: '단어 목록에 없는 단어예요.' };
  }

  const alreadyUsed = usedWords.some((w) => w.word === word);
  if (alreadyUsed) {
    return { valid: false, reason: '이미 사용된 단어예요.' };
  }

  return { valid: true, meaning: found.meaning };
}

/**
 * 조건에 맞는 단어 목록 중 사용되지 않은 단어를 랜덤으로 반환 (봇용)
 */
export function pickBotWord(
  condition: GameCondition,
  usedWords: PlayedWord[],
): WordEntry | null {
  const key = conditionKey(condition);
  const wordList = WORD_DB[key] ?? [];
  const usedSet = new Set(usedWords.map((w) => w.word));
  const available = wordList.filter((w) => !usedSet.has(w.word));

  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)] ?? null;
}

/**
 * 라운드별 점수 배율
 */
export function getPointsForRound(round: number): number {
  if (round === 1) return 10;
  if (round === 2) return 15;
  if (round === 3) return 20;
  if (round === 4) return 30;
  return 40;
}

/**
 * 단어 유효성 검사 (비동기 — 로컬 DB 미포함 단어를 외부 API로 검증)
 *
 * 처리 흐름:
 *   1. 형식 검사 (빈 값, 첫글자/끝글자, 이미 사용)
 *   2. 로컬 DB 확인 → 있으면 한국어 의미 반환 (빠른 경로)
 *   3. Firebase 캐시 확인 → 이전에 조회된 단어면 캐시 의미 반환
 *   4. Free Dictionary API로 유효한 영단어인지 확인
 *   5. Papago API로 한국어 의미 번역
 *   6. Firebase에 캐시 저장 (이후 동일 단어는 3번에서 종료)
 */
export async function validateWordAsync(
  input: string,
  condition: GameCondition,
  usedWords: PlayedWord[],
): Promise<{ valid: boolean; reason?: string; meaning?: string }> {
  const word = input.trim().toLowerCase();

  // 1. 기본 형식 검사 (동기)
  if (!word) {
    return { valid: false, reason: '단어를 입력해주세요.' };
  }
  if (word[0] !== condition.first) {
    return { valid: false, reason: `'${condition.first}'로 시작하는 단어를 입력하세요.` };
  }
  if (word[word.length - 1] !== condition.last) {
    return { valid: false, reason: `'${condition.last}'로 끝나는 단어를 입력하세요.` };
  }
  if (usedWords.some((w) => w.word === word)) {
    return { valid: false, reason: '이미 사용된 단어예요.' };
  }

  // 2. 로컬 DB 확인 (동기, 빠른 경로)
  const key = conditionKey(condition);
  const wordList = WORD_DB[key] ?? [];
  const localEntry = wordList.find((w) => w.word === word);
  if (localEntry) {
    return { valid: true, meaning: localEntry.meaning };
  }

  // 3. Firebase 캐시 확인
  const cached = await getCachedMeaning(word);
  if (cached) {
    return { valid: true, meaning: cached };
  }

  // 4. Free Dictionary API로 유효한 영단어인지 확인
  // isValidEnglishWord는 네트워크 오류 시 throw → 호출부에서 처리
  const valid = await isValidEnglishWord(word);
  if (!valid) {
    return { valid: false, reason: '올바른 영단어가 아니에요.' };
  }

  // 5. Papago API로 한국어 의미 번역
  const meaning = await translateToKorean(word, DEEPL_API_KEY);
  const finalMeaning = meaning ?? '(의미를 확인할 수 없어요)';

  // 6. Firebase 캐시 저장 (fire-and-forget)
  if (meaning) {
    cacheMeaning(word, finalMeaning);
  }

  return { valid: true, meaning: finalMeaning };
}

/**
 * 랜덤 매치 ID 생성
 */
export function generateMatchId(): string {
  return `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 숫자를 한국어 표기로 변환 (예: 1234 -> '1,234')
 */
export function formatScore(score: number): string {
  return score.toLocaleString('ko-KR');
}
