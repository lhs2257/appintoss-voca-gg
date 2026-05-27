import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { COLORS } from '../lib/theme';
import { formatScore } from '../lib/gameUtils';
import { subscribeMatch, getUserStats } from '../lib/matchmaking';
import type { Match, UserStats } from '../lib/types';

export const Route = createRoute('/result', {
  component: ResultScreen,
});

function ResultScreen() {
  const navigation = Route.useNavigation();
  const params = Route.useParams() as { matchId: string; uid: string };
  const { matchId, uid } = params;

  const [match, setMatch] = useState<Match | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const unsub = subscribeMatch(matchId, setMatch);
    return unsub;
  }, [matchId]);

  useEffect(() => {
    getUserStats(uid)
      .then(setStats)
      .catch(() => setStats(null));
  }, [uid]);

  // 뒤로가기(하드웨어/제스처) 시 게임 화면이 아닌 홈으로 이동
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('/');
      return true; // 기본 뒤로가기 동작 차단
    });
    return () => backHandler.remove();
  }, [navigation]);

  if (!match) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: COLORS.textMuted }}>결과 불러오는 중...</Text>
      </View>
    );
  }

  const myScore = match.scores[uid] ?? 0;
  const myWords = (match.words ?? []).filter((w) => w.uid === uid);
  const isNewBest = stats ? myScore >= (stats.bestScore ?? 0) && myScore > 0 : false;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 결과 헤더 */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>게임 종료</Text>
        {isNewBest && myScore > 0 && (
          <View style={styles.newBestBadge}>
            <Text style={styles.newBestText}>최고 기록 갱신!</Text>
          </View>
        )}
        <Text style={styles.resultSub}>
          {myScore === 0
            ? '아쉬워요. 다음에 다시 도전해보세요!'
            : '수고하셨어요. 다음엔 더 높은 점수에 도전해보세요!'}
        </Text>
      </View>

      {/* 이번 게임 점수 */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>이번 점수</Text>
        <Text style={styles.scoreValue}>{formatScore(myScore)}</Text>
        <Text style={styles.scoreUnit}>점</Text>
        <View style={styles.scoreMeta}>
          <Text style={styles.scoreMetaText}>
            {myWords.length}개 단어 성공 · {match.round}라운드 진행
          </Text>
        </View>
      </View>

      {/* 누적 스탯 */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <Text style={styles.statsItemLabel}>최고 점수</Text>
            <Text style={styles.statsItemValue}>{formatScore(stats.bestScore ?? 0)}</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Text style={styles.statsItemLabel}>누적 점수</Text>
            <Text style={styles.statsItemValue}>{formatScore(stats.totalScore ?? 0)}</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Text style={styles.statsItemLabel}>플레이 횟수</Text>
            <Text style={styles.statsItemValue}>{stats.gamesPlayed ?? 0}회</Text>
          </View>
        </View>
      )}

      {/* 내가 맞춘 단어 목록 */}
      {myWords.length > 0 && (
        <View style={styles.wordList}>
          <Text style={styles.wordListTitle}>이번 게임에서 맞춘 단어</Text>
          {myWords.map((w, i) => (
            <View key={i} style={styles.wordRow}>
              <Text style={styles.wordRowWord}>{w.word}</Text>
              <Text style={styles.wordRowMeaning}>{w.meaning}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 버튼 */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.btnRetry}
          onPress={() => navigation.navigate('/matching', { uid })}
          activeOpacity={0.85}
        >
          <Text style={styles.btnRetryText}>다시 도전</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnHome}
          onPress={() => navigation.navigate('/')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnHomeText}>홈으로</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  resultHeader: {
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.5,
    color: COLORS.text,
    marginBottom: 8,
  },
  newBestBadge: {
    backgroundColor: 'rgba(198,242,78,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(198,242,78,0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 10,
  },
  newBestText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.lime,
  },
  resultSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  scoreCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -2,
  },
  scoreUnit: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: -4,
  },
  scoreMeta: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  scoreMetaText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsItemLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  statsItemValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  statsDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'center',
  },
  wordList: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  wordListTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wordRowWord: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  wordRowMeaning: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  buttons: {
    paddingHorizontal: 16,
    marginTop: 28,
    gap: 10,
  },
  btnRetry: {
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRetryText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnHome: {
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnHomeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
});
