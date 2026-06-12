// voca.gg - 공용 타입 정의

export interface WordEntry {
  word: string;
  meaning: string;
}

export interface WordDB {
  [key: string]: WordEntry[];
}

export interface GameCondition {
  first: string;
  last: string;
}

export interface PlayedWord {
  word: string;
  meaning: string;
  uid: string;
  timestamp: number;
}

export type MatchStatus = 'waiting' | 'playing' | 'finished';

export interface MatchScores {
  [uid: string]: number;
}

export interface Match {
  mode: 'bot' | 'pvp';  // 게임 모드
  status: MatchStatus;
  player1: string;
  player2: string; // 'bot' if playing against bot
  currentTurn: string; // uid or 'bot'
  round: number;
  turnCount: number;
  condition: GameCondition;
  words: PlayedWord[];
  scores: MatchScores;
  winner: string | null; // uid or 'bot' or null (봇 모드에서는 항상 null)
  createdAt: number;
  finishedAt: number | null;
}

export interface UserStats {
  displayName: string;
  color?: string;
  totalScore: number;
  bestScore: number;   // 단판 최고 점수
  totalWords: number;
  gamesPlayed: number;
  createdAt: number;
  updatedAt: number;
}

export interface QueueEntry {
  uid: string;
  displayName: string;
  joinedAt: number;
}

// 점수 계산: 라운드별 단어당 점수
export function getPointsForRound(round: number): number {
  if (round === 1) return 10;
  if (round === 2) return 15;
  if (round === 3) return 20;
  if (round === 4) return 30;
  return 40; // round 5+
}

// 총 5턴 / 라운드 (두 플레이어 합산)
export const TURNS_PER_ROUND = 5;
// 매칭 대기 시간 (봇 폴백, ms)
export const MATCH_TIMEOUT_MS = 3000;
// 턴 제한 시간 (ms)
export const TURN_TIMEOUT_MS = 10000;
// 봇 응답 딜레이 범위 (ms)
export const BOT_MIN_DELAY = 1500;
export const BOT_MAX_DELAY = 3000;
