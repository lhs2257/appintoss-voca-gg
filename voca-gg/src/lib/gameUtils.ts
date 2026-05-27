// voca.gg - 게임 로직 유틸리티

import wordsData from '../data/words.json';
import type { WordDB, WordEntry, GameCondition, PlayedWord } from './types';

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
