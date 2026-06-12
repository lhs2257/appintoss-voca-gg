// voca.gg - Firebase 매칭 로직 (봇 모드 전용, Realtime Database)

import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  increment,
} from 'firebase/database';
import { db } from './firebase';
import {
  pickRandomCondition,
  generateMatchId,
  pickBotWord,
  getPointsForRound,
} from './gameUtils';
import type {
  Match,
  UserStats,
  PlayedWord,
} from './types';
import {
  BOT_MIN_DELAY,
  BOT_MAX_DELAY,
  TURNS_PER_ROUND,
} from './types';

// ---------------------------------------------------------------------------
// 유저 통계 초기화 / 조회
// ---------------------------------------------------------------------------

/**
 * 첫 진입 시 유저 통계를 초기화하거나 기존 통계를 반환
 * displayName이 변경된 경우(예: 구버전의 '플레이어' 레코드) 최신값으로 갱신
 */
export async function initUserStats(uid: string, displayName: string): Promise<UserStats> {
  const statsRef = ref(db, `userStats/${uid}`);
  const existing = await get(statsRef);

  if (existing.exists()) {
    const stats = existing.val() as UserStats;
    if (stats.displayName !== displayName) {
      await update(statsRef, { displayName, updatedAt: Date.now() });
      return { ...stats, displayName };
    }
    return stats;
  }

  const newStats: UserStats = {
    displayName,
    totalScore: 0,
    bestScore: 0,
    totalWords: 0,
    gamesPlayed: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await set(statsRef, newStats);
  return newStats;
}

/**
 * 유저 통계 불러오기
 */
export async function getUserStats(uid: string): Promise<UserStats | null> {
  const snap = await get(ref(db, `userStats/${uid}`));
  return snap.exists() ? (snap.val() as UserStats) : null;
}

// ---------------------------------------------------------------------------
// 프로필 관리
// ---------------------------------------------------------------------------

/**
 * 닉네임 사용 가능 여부 확인 (nicknames/{lower} 인덱스 기준)
 * - 미등록: 사용 가능
 * - 등록됨 + 본인 uid: 사용 가능 (현재 닉네임 유지)
 * - 등록됨 + 타인 uid: 사용 불가
 */
export async function checkNicknameAvailable(nickname: string, currentUid: string): Promise<boolean> {
  const key = nickname.trim().toLowerCase();
  const snap = await get(ref(db, `nicknames/${key}`));
  if (!snap.exists()) return true;
  return snap.val() === currentUid;
}

/**
 * 프로필 저장 (닉네임 + 색상)
 * - userStats/{uid} 업데이트
 * - nicknames 인덱스 원자적 갱신 (이전 닉네임 제거, 새 닉네임 등록)
 */
export async function saveProfile(
  uid: string,
  nickname: string,
  color: string,
  oldNickname?: string,
): Promise<void> {
  const newKey = nickname.trim().toLowerCase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};

  if (oldNickname) {
    const oldKey = oldNickname.trim().toLowerCase();
    if (oldKey !== newKey) {
      updates[`nicknames/${oldKey}`] = null;
    }
  }

  updates[`nicknames/${newKey}`] = uid;
  updates[`userStats/${uid}/displayName`] = nickname;
  updates[`userStats/${uid}/color`] = color;
  updates[`userStats/${uid}/updatedAt`] = Date.now();

  await update(ref(db), updates);
}

/**
 * 신규 유저 닉네임 인덱스 초기화 (initUserStats 이후 1회 호출)
 */
export async function ensureNicknameIndex(uid: string, displayName: string): Promise<void> {
  const key = displayName.trim().toLowerCase();
  const snap = await get(ref(db, `nicknames/${key}`));
  if (!snap.exists()) {
    await set(ref(db, `nicknames/${key}`), uid);
  }
}

// ---------------------------------------------------------------------------
// 봇 매치 생성
// ---------------------------------------------------------------------------

/**
 * 봇 매치를 바로 생성 (큐 없이 즉시)
 * 1.5초 딜레이 후 Firebase에 매치 생성 → onMatchFound 호출
 */
export function createBotMatchDirect(
  uid: string,
  onMatchFound: (matchId: string) => void,
): Promise<() => void> {
  return new Promise((resolve) => {
    const matchId = generateMatchId();
    const condition = pickRandomCondition();
    const firstTurn = Math.random() < 0.5 ? uid : 'bot';

    const newMatch: Match = {
      mode: 'bot',
      status: 'playing',
      player1: uid,
      player2: 'bot',
      currentTurn: firstTurn,
      round: 1,
      turnCount: 0,
      condition,
      words: [],
      scores: { [uid]: 0, bot: 0 },
      winner: null,
      createdAt: Date.now(),
      finishedAt: null,
    };

    const timer = setTimeout(async () => {
      await set(ref(db, `matches/${matchId}`), newMatch);
      onMatchFound(matchId);
    }, 1500);

    resolve(() => clearTimeout(timer));
  });
}

// ---------------------------------------------------------------------------
// 매치 실시간 구독
// ---------------------------------------------------------------------------

/**
 * 매치 실시간 구독
 *
 * Firebase Realtime Database 주의사항:
 * - 빈 배열 `[]`은 저장되지 않으므로 읽을 때 undefined가 됨
 * - 비어있지 않은 배열도 `{0: {...}, 1: {...}}` 형태의 객체로 반환될 수 있음
 * → words 필드를 항상 배열로 정규화
 */
export function subscribeMatch(
  matchId: string,
  onUpdate: (match: Match) => void,
): () => void {
  const matchRef = ref(db, `matches/${matchId}`);
  onValue(matchRef, (snap) => {
    if (snap.exists()) {
      const data = snap.val() as Match;
      if (!data.words) {
        data.words = [];
      } else if (!Array.isArray(data.words)) {
        data.words = Object.values(data.words as Record<string, PlayedWord>);
      }
      onUpdate(data);
    }
  });
  return () => off(matchRef);
}

// ---------------------------------------------------------------------------
// 단어 제출
// ---------------------------------------------------------------------------

/**
 * 단어 제출 처리
 */
export async function submitWord(
  matchId: string,
  match: Match,
  uid: string,
  word: string,
  meaning: string,
): Promise<void> {
  const played: PlayedWord = { word, meaning, uid, timestamp: Date.now() };
  const newWords = [...(match.words ?? []), played];
  const newTurnCount = (match.turnCount ?? 0) + 1;
  const points = getPointsForRound(match.round);
  const newScores = {
    ...match.scores,
    [uid]: (match.scores[uid] ?? 0) + points,
  };

  const opponentUid = match.player1 === uid ? match.player2 : match.player1;
  const nextTurn = opponentUid;

  const isRoundEnd = newTurnCount % TURNS_PER_ROUND === 0;
  const newRound = isRoundEnd ? match.round + 1 : match.round;
  const newTurnCountReset = isRoundEnd ? 0 : newTurnCount;

  const matchRef = ref(db, `matches/${matchId}`);
  await set(matchRef, {
    ...match,
    words: newWords,
    scores: newScores,
    currentTurn: nextTurn,
    turnCount: newTurnCountReset,
    round: newRound,
  });
}

// ---------------------------------------------------------------------------
// 봇 모드 게임 종료
// ---------------------------------------------------------------------------

/**
 * 봇 모드 게임 종료
 * 승패 없이 플레이어의 점수를 기록하고 매치를 종료 상태로 변경
 */
export async function endBotGame(
  matchId: string,
  match: Match,
  playerUid: string,
): Promise<void> {
  const matchRef = ref(db, `matches/${matchId}`);
  await set(matchRef, {
    ...match,
    status: 'finished',
    winner: null,
    finishedAt: Date.now(),
  });

  await updateBotGameStats(match, playerUid);
}

/**
 * 봇 게임 종료 시 유저 통계 업데이트
 */
async function updateBotGameStats(match: Match, playerUid: string): Promise<void> {
  const playerScore = match.scores[playerUid] ?? 0;
  const wordsPlayed = (match.words ?? []).filter((w) => w.uid === playerUid).length;

  const statsRef = ref(db, `userStats/${playerUid}`);
  const existing = await get(statsRef);

  if (!existing.exists()) {
    const newStats: UserStats = {
      displayName: '플레이어',
      totalScore: playerScore,
      bestScore: playerScore,
      totalWords: wordsPlayed,
      gamesPlayed: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await set(statsRef, newStats);
  } else {
    const currentStats = existing.val() as UserStats;
    const newBestScore = Math.max(currentStats.bestScore ?? 0, playerScore);
    await update(statsRef, {
      totalScore: increment(playerScore),
      bestScore: newBestScore,
      totalWords: increment(wordsPlayed),
      gamesPlayed: increment(1),
      updatedAt: Date.now(),
    });
  }
}

// ---------------------------------------------------------------------------
// 봇 턴 처리
// ---------------------------------------------------------------------------

/**
 * 봇 턴 처리
 * 1.5~3초 딜레이 후 자동으로 단어 제출
 * onNoWord: 봇이 쓸 수 있는 단어가 없을 때 호출 (DB 소진 시 게임 자연 종료)
 */
export function scheduleBotTurn(
  _matchId: string,
  match: Match,
  onBotWord: (word: string, meaning: string) => void,
  onNoWord?: () => void,
): () => void {
  const delay = BOT_MIN_DELAY + Math.random() * (BOT_MAX_DELAY - BOT_MIN_DELAY);

  const timer = setTimeout(() => {
    const botWord = pickBotWord(match.condition, match.words ?? []);
    if (botWord) {
      onBotWord(botWord.word, botWord.meaning);
    } else if (onNoWord) {
      onNoWord();
    }
  }, delay);

  return () => clearTimeout(timer);
}

// ---------------------------------------------------------------------------
// 랭킹 조회
// ---------------------------------------------------------------------------

/**
 * 점수 랭킹 상위 100명 (단판 최고 점수 기준, 0점 제외)
 */
export async function fetchScoreRanking(): Promise<(UserStats & { uid: string })[]> {
  const snap = await get(ref(db, 'userStats'));
  if (!snap.exists()) return [];

  const results: (UserStats & { uid: string })[] = [];
  snap.forEach((child) => {
    results.push({ uid: child.key!, ...(child.val() as UserStats) });
  });
  return results
    .filter((u) => (u.bestScore ?? 0) > 0)
    .sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0))
    .slice(0, 100);
}
