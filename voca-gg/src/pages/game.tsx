import { createRoute, useBackEvent, closeView } from '@granite-js/react-native';
import { CommonActions } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useDialog } from '@toss/tds-react-native';
import { josa } from 'es-hangul';
import { COLORS } from '../lib/theme';
import { useAudio } from '../lib/AudioContext';
import { validateWord, validateWordAsync, formatScore, getPointsForRound } from '../lib/gameUtils';
import {
  subscribeMatch,
  submitWord,
  endBotGame,
  scheduleBotTurn,
  getUserStats,
} from '../lib/matchmaking';
import type { Match } from '../lib/types';

export const Route = createRoute('/game', {
  component: GameScreen,
});

const TURN_TIMEOUT_MS_CONST = 10000;

function GameScreen() {
  const navigation = Route.useNavigation();
  const params = Route.useParams() as { matchId: string; uid: string };
  const { matchId, uid } = params;

  const [match, setMatch] = useState<Match | null>(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [timeLeft, setTimeLeft] = useState(TURN_TIMEOUT_MS_CONST / 1000);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // 외부 API 검증 중 상태 (로컬 DB에 없는 단어 입력 시)
  const [isValidating, setIsValidating] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(TURN_TIMEOUT_MS_CONST / 1000);
  const botCancelRef = useRef<(() => void) | null>(null);
  // 게임 종료 중복 방지 (타이머 만료 + 오답 제출 레이스 컨디션)
  const isEndingRef = useRef(false);
  // API 검증 중 타이머 정지용 ref (setInterval 클로저에서 state 직접 참조 불가)
  const isValidatingRef = useRef(false);
  const wordFeedScrollRef = useRef<ScrollView>(null);
  const timerBarAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // match 최신값을 back 핸들러에서 참조하기 위한 ref
  const matchRef = useRef(match);
  matchRef.current = match;
  // isValidating 최신값을 setInterval 클로저에서 참조하기 위한 ref
  isValidatingRef.current = isValidating;

  const backEvent = useBackEvent();
  const { openConfirm } = useDialog();
  const { setInGame, playHighScore } = useAudio();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brandDisplayName: string = ((global as Record<string, any>).__appsInToss ?? {}).brandDisplayName ?? '보카지지';

  // 이전 최고 기록 (게임 시작 전 로드)
  const bestScoreRef = useRef<number | null>(null);
  // 최고 기록 SFX 1회 재생 여부
  const sfxPlayedRef = useRef(false);

  // 게임 화면 진입 시 게임 BGM 활성화, 이탈 시 메인 BGM 복귀
  useEffect(() => {
    setInGame(true);
    return () => setInGame(false);
  }, []);

  // 게임 시작 시 이전 최고 기록 로드
  useEffect(() => {
    getUserStats(uid)
      .then((s) => { bestScoreRef.current = s?.bestScore ?? 0; })
      .catch(() => { bestScoreRef.current = 0; });
  }, [uid]);

  // 내 점수가 이전 최고 기록을 최초로 넘는 순간 SFX 재생
  useEffect(() => {
    if (sfxPlayedRef.current || bestScoreRef.current === null || !match) return;
    const myScore = match.scores[uid] ?? 0;
    if (myScore > 0 && myScore > bestScoreRef.current) {
      sfxPlayedRef.current = true;
      playHighScore();
    }
  }, [match]);

  // 키보드 높이 추적 (KeyboardAvoidingView 대체)
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  // 뒤로가기: TDS ConfirmDialog (X 버튼과 동일 디자인) → 종료 시 앱 닫기
  useEffect(() => {
    const handleBack = async () => {
      const confirmed = await openConfirm({
        title: `${josa(brandDisplayName, '을/를')} 종료할까요?`,
        leftButton: '닫기',
        rightButton: '종료하기',
        closeOnDimmerClick: true,
      });
      if (!confirmed) return;
      const currentMatch = matchRef.current;
      if (currentMatch && !isEndingRef.current) {
        isEndingRef.current = true;
        await endBotGame(matchId, currentMatch, uid);
      }
      closeView();
    };

    backEvent.addEventListener(handleBack);
    return () => backEvent.removeEventListener(handleBack);
  }, [backEvent, matchId, uid, navigation]);

  // 매치 구독
  useEffect(() => {
    const unsub = subscribeMatch(matchId, (updatedMatch) => {
      setMatch(updatedMatch);
    });
    return unsub;
  }, [matchId]);

  const isMyTurn = match?.currentTurn === uid;
  const isBotGame = match?.player2 === 'bot' || match?.player1 === 'bot';

  // 단어 목록 갱신 시 자동 스크롤 (최신 단어가 항상 보이도록)
  useEffect(() => {
    if (match?.words && match.words.length > 0) {
      setTimeout(() => {
        wordFeedScrollRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [match?.words?.length]);

  // 타이머 (내 턴에만 동작)
  useEffect(() => {
    if (!match || match.status !== 'playing') return;

    if (isMyTurn) {
      // 타이머 리셋
      timeLeftRef.current = TURN_TIMEOUT_MS_CONST / 1000;
      setTimeLeft(TURN_TIMEOUT_MS_CONST / 1000);
      timerBarAnim.setValue(1);

      Animated.timing(timerBarAnim, {
        toValue: 0,
        duration: TURN_TIMEOUT_MS_CONST,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      timerRef.current = setInterval(() => {
        // API 검증 중에는 카운트다운 정지
        if (isValidatingRef.current) return;
        timeLeftRef.current -= 1;
        setTimeLeft(timeLeftRef.current);
        if (timeLeftRef.current <= 0) {
          clearInterval(timerRef.current!);
          if (isEndingRef.current) return;
          isEndingRef.current = true;
          // 시간 초과: 봇 모드 게임 종료 (점수 기록)
          endBotGame(matchId, match, uid).then(() => {
            navigation.navigate('/result', { matchId, uid });
          });
        }
      }, 1000);
    } else {
      // 상대 턴: 타이머 정지
      if (timerRef.current) clearInterval(timerRef.current);
      timerBarAnim.stopAnimation();
      timerBarAnim.setValue(1);

      // 봇 턴 처리
      if (isBotGame && match.currentTurn === 'bot') {
        botCancelRef.current?.();
        botCancelRef.current = scheduleBotTurn(
          matchId,
          match,
          (word, meaning) => {
            submitWord(matchId, match, 'bot', word, meaning);
          },
          () => {
            // 봇 단어 소진 → 게임 자연 종료
            if (isEndingRef.current) return;
            isEndingRef.current = true;
            endBotGame(matchId, match, uid).then(() => {
              navigation.navigate('/result', { matchId, uid });
            });
          },
        );
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      botCancelRef.current?.();
    };
  }, [match?.currentTurn, match?.status]);

  // API 검증 중 프로그래스바 애니메이션 정지/재개
  useEffect(() => {
    if (!isMyTurn || match?.status !== 'playing') return;

    if (isValidating) {
      timerBarAnim.stopAnimation();
    } else {
      // 오답 판정 후 남은 시간부터 재개
      Animated.timing(timerBarAnim, {
        toValue: 0,
        duration: timeLeftRef.current * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  }, [isValidating]);

  // 피드백 표시 애니메이션
  const showFeedback = useCallback(
    (text: string, type: 'success' | 'error' | 'info') => {
      setFeedback({ text, type });
      feedbackAnim.setValue(1);
      setTimeout(() => {
        Animated.timing(feedbackAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => setFeedback(null));
      }, 1400);
    },
    [],
  );

  const handleSubmit = async () => {
    if (!match || !isMyTurn || !input.trim() || isValidating) return;

    const wordToSubmit = input.trim().toLowerCase();

    // 1단계: 로컬 DB 동기 검사 (빠른 경로 — 대부분의 경우 여기서 종료)
    const localResult = validateWord(wordToSubmit, match.condition, match.words ?? []);
    if (localResult.valid) {
      clearInterval(timerRef.current!);
      showFeedback(`+${getPointsForRound(match.round)}점 — ${localResult.meaning}`, 'success');
      setInput('');
      submitWord(matchId, match, uid, wordToSubmit, localResult.meaning!);
      return;
    }

    // 로컬에서 "이미 사용된 단어" / "형식 오류"는 즉시 피드백 (API 불필요)
    if (
      localResult.reason === '이미 사용된 단어예요.' ||
      localResult.reason?.startsWith("'") // 첫글자/끝글자 조건 오류
    ) {
      showFeedback(localResult.reason, 'error');
      setInput('');
      return;
    }

    // 2단계: 로컬 DB에 없는 단어 → 외부 API로 검증
    // "단어 확인 중..." 피드백은 isValidating 상태로 직접 렌더링 (아래 JSX 참고)
    setIsValidating(true);
    setInput('');

    try {
      const result = await validateWordAsync(wordToSubmit, match.condition, match.words ?? []);

      // 타이머가 이미 만료된 경우 (isEndingRef) 제출 무시
      if (isEndingRef.current) return;

      if (!result.valid) {
        showFeedback(result.reason!, 'error');
        return;
      }

      // 정답
      clearInterval(timerRef.current!);
      showFeedback(`+${getPointsForRound(match.round)}점 — ${result.meaning}`, 'success');
      submitWord(matchId, match, uid, wordToSubmit, result.meaning!);
    } catch {
      // 네트워크 오류 (isValidEnglishWord가 throw)
      showFeedback('네트워크 오류가 발생했어요. 다시 시도해 주세요.', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const timerColor = timerBarAnim.interpolate({
    inputRange: [0, 0.25, 0.6, 1],
    outputRange: [COLORS.red, COLORS.red, COLORS.amber, COLORS.green],
  });

  if (!match) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>게임 불러오는 중...</Text>
      </View>
    );
  }

  const opponentUid = match.player1 === uid ? match.player2 : match.player1;
  const myScore = match.scores[uid] ?? 0;
  const opponentScore = match.scores[opponentUid] ?? 0;

  return (
    <View style={[styles.container, { paddingBottom: keyboardHeight }]}>
      {/* 타이머 바 */}
      <Animated.View
        style={[
          styles.timerBar,
          {
            width: timerBarAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: timerColor,
          },
        ]}
      />

      {/* 헤더: 라운드 뱃지만 중앙에 (점수는 단어 퍼즐 양옆으로 이동) */}
      <View style={styles.header}>
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>R{match.round}</Text>
        </View>
      </View>

      {/* 조건 + 점수 통합 영역: [나/점수] [E→...→E] [봇/점수] */}
      <View style={styles.conditionArea}>
        <View style={styles.conditionWithScores}>
          {/* 좌측: 내 점수 */}
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>나</Text>
            <Text style={styles.scoreValue}>{formatScore(myScore)}</Text>
          </View>

          {/* 중앙: 글자 조건 퍼즐 */}
          <View style={styles.conditionRow}>
            <View style={styles.letterBox}>
              <Text style={styles.letterText}>{match.condition.first.toUpperCase()}</Text>
            </View>
            <Text style={styles.conditionArrow}>→</Text>
            <Text style={styles.conditionEllipsis}>···</Text>
            <Text style={styles.conditionArrow}>→</Text>
            <View style={styles.letterBox}>
              <Text style={styles.letterText}>{match.condition.last.toUpperCase()}</Text>
            </View>
          </View>

          {/* 우측: 봇/상대 점수 */}
          <View style={[styles.scoreBox, styles.scoreBoxRight]}>
            <Text style={styles.scoreLabel}>{opponentUid === 'bot' ? '봇' : '상대'}</Text>
            <Text style={styles.scoreValue}>{formatScore(opponentScore)}</Text>
          </View>
        </View>
      </View>

      {/* 단어 피드 (스크롤 가능, 키보드 위에 유지) */}
      <ScrollView
        ref={wordFeedScrollRef}
        style={styles.wordFeed}
        contentContainerStyle={styles.wordFeedContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          wordFeedScrollRef.current?.scrollToEnd({ animated: false })
        }
        keyboardShouldPersistTaps="handled"
      >
        {(match.words ?? []).map((w, i) => (
          <View
            key={i}
            style={[
              styles.wordItem,
              w.uid === uid ? styles.wordItemMine : styles.wordItemOpponent,
            ]}
          >
            <Text style={styles.wordText}>{w.word}</Text>
            <Text style={styles.wordMeaning}>{w.meaning}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 피드백 오버레이 */}
      {/* isValidating 중에는 opacity 1로 고정 → 검증 완료까지 "단어 확인 중..." 지속 표시 */}
      {(feedback || isValidating) && (
        <Animated.View
          style={[styles.feedback, { opacity: isValidating ? 1 : feedbackAnim }]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.feedbackText,
              isValidating
                ? styles.feedbackInfo
                : feedback?.type === 'success'
                ? styles.feedbackSuccess
                : feedback?.type === 'error'
                ? styles.feedbackError
                : styles.feedbackInfo,
            ]}
          >
            {isValidating ? '단어 확인 중...' : feedback?.text}
          </Text>
        </Animated.View>
      )}

      {/* 입력 영역 */}
      <View style={styles.inputArea}>
        {isMyTurn ? (
          <>
            <View style={styles.timerDisplay}>
              <Text style={styles.timerText}>{timeLeft}초</Text>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSubmit}
                placeholder={
                  isValidating
                    ? '확인 중...'
                    : `${match.condition.first}...${match.condition.last}`
                }
                placeholderTextColor={COLORS.textDim}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                autoFocus
                editable={!isValidating}
              />
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!input.trim() || isValidating) && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!input.trim() || isValidating}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>
                  {isValidating ? '...' : '입력'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.waitingArea}>
            <Text style={styles.waitingText}>
              {opponentUid === 'bot' ? 'AI 봇이' : '상대가'} 생각 중...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  timerBar: {
    height: 4,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // 헤더: 라운드 뱃지만 중앙 정렬
  header: {
    alignItems: 'center',
    paddingTop: 8,  // safeAreaTop은 GameScreenContainer wrapper에서 처리
    paddingBottom: 4,
  },
  scoreBox: {
    flex: 1,
    alignItems: 'flex-start',
  },
  scoreBoxRight: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  roundBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roundText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  // 조건 영역: 점수와 퍼즐을 한 행에 배치
  conditionArea: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  conditionWithScores: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  letterBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  conditionArrow: {
    fontSize: 16,
    color: COLORS.textDim,
  },
  conditionEllipsis: {
    fontSize: 16,
    color: COLORS.textDim,
    letterSpacing: 2,
  },
  conditionSub: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  wordFeed: {
    flex: 1,
    paddingHorizontal: 16,
  },
  wordFeedContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  wordItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordItemMine: {
    backgroundColor: 'rgba(49,130,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(49,130,246,0.3)',
  },
  wordItemOpponent: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wordText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  wordMeaning: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  feedback: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  feedbackSuccess: {
    color: COLORS.lime,
    backgroundColor: 'rgba(198,242,78,0.12)',
  },
  feedbackError: {
    color: COLORS.red,
    backgroundColor: 'rgba(255,77,94,0.12)',
  },
  feedbackInfo: {
    color: COLORS.textMuted,
    backgroundColor: COLORS.bgCard,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 52,
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitBtn: {
    height: 52,
    paddingHorizontal: 20,
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: COLORS.bgCard,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  waitingArea: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingText: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
