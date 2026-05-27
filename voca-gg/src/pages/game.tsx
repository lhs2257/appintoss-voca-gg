import { createRoute } from '@granite-js/react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS } from '../lib/theme';
import { validateWord, formatScore, getPointsForRound } from '../lib/gameUtils';
import {
  subscribeMatch,
  submitWord,
  endBotGame,
  scheduleBotTurn,
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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(TURN_TIMEOUT_MS_CONST / 1000);
  const botCancelRef = useRef<(() => void) | null>(null);
  // 게임 종료 중복 방지 (타이머 만료 + 오답 제출 레이스 컨디션)
  const isEndingRef = useRef(false);
  const wordFeedScrollRef = useRef<ScrollView>(null);
  const timerBarAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

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

  const handleSubmit = () => {
    if (!match || !isMyTurn || !input.trim()) return;

    const result = validateWord(input, match.condition, match.words ?? []);
    if (!result.valid) {
      // 오답: 피드백만 표시, 타이머는 계속 진행 (10초 만료 시 게임 종료)
      showFeedback(result.reason!, 'error');
      setInput('');
      return;
    }

    // 정답
    clearInterval(timerRef.current!);
    showFeedback(`+${getPointsForRound(match.round)}점 — ${result.meaning}`, 'success');
    setInput('');
    submitWord(matchId, match, uid, input.trim().toLowerCase(), result.meaning!);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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

      {/* 헤더: 점수 */}
      <View style={styles.header}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>나</Text>
          <Text style={styles.scoreValue}>{formatScore(myScore)}</Text>
        </View>
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>R{match.round}</Text>
        </View>
        <View style={[styles.scoreBox, styles.scoreBoxRight]}>
          <Text style={styles.scoreLabel}>{opponentUid === 'bot' ? '봇' : '상대'}</Text>
          <Text style={styles.scoreValue}>{formatScore(opponentScore)}</Text>
        </View>
      </View>

      {/* 조건 표시 */}
      <View style={styles.conditionArea}>
        <Text style={styles.conditionLabel}>단어 조건</Text>
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
        <Text style={styles.conditionSub}>
          {match.condition.first.toUpperCase()}로 시작하고{' '}
          {match.condition.last.toUpperCase()}로 끝나는 영어 단어
        </Text>
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
      {feedback && (
        <Animated.View
          style={[styles.feedback, { opacity: feedbackAnim }]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.feedbackText,
              feedback.type === 'success'
                ? styles.feedbackSuccess
                : feedback.type === 'error'
                ? styles.feedbackError
                : styles.feedbackInfo,
            ]}
          >
            {feedback.text}
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
                placeholder={`${match.condition.first}...${match.condition.last}`}
                placeholderTextColor={COLORS.textDim}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.submitBtn, !input.trim() && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!input.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>입력</Text>
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
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 12,
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
  conditionArea: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
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
