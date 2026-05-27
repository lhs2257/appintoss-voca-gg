import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { getUserKeyForGame } from '@apps-in-toss/framework';
import { COLORS } from '../lib/theme';
import { formatScore } from '../lib/gameUtils';
import { initUserStats } from '../lib/matchmaking';
import type { UserStats } from '../lib/types';

const FALLBACK_UID = 'demo_user_001';
const FALLBACK_NAME = '플레이어 DEMO';

/**
 * getUserKeyForGame의 hash 앞 4자리로 기본 닉네임 생성
 * 예: hash = "ab12cdef..." → "플레이어 AB12"
 */
function generateDisplayName(hash: string): string {
  const chars = hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  return `플레이어 ${chars || '????'}`;
}

export const Route = createRoute('/', {
  component: HomeScreen,
});

function HomeScreen() {
  const navigation = Route.useNavigation();
  const [uid, setUid] = useState<string>(FALLBACK_UID);
  const [displayName, setDisplayName] = useState<string>(FALLBACK_NAME);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        let resolvedUid = FALLBACK_UID;
        let resolvedName = FALLBACK_NAME;

        const result = await getUserKeyForGame();
        if (
          result &&
          result !== 'INVALID_CATEGORY' &&
          result !== 'ERROR' &&
          result.type === 'HASH'
        ) {
          resolvedUid = result.hash;
          resolvedName = generateDisplayName(result.hash);
        }

        setUid(resolvedUid);
        setDisplayName(resolvedName);

        const userStats = await initUserStats(resolvedUid, resolvedName);
        setStats(userStats);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 상단 바 */}
      <View style={styles.topBar}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarBox}>
            <View style={styles.avatarInner} />
          </View>
          <Text style={styles.userName}>{displayName} 님</Text>
        </View>
      </View>

      {/* 로고 영역 */}
      <View style={styles.logoArea}>
        <Text style={styles.tagline}>영어 단어 대결 게임</Text>
        <Text style={styles.logo}>
          voca<Text style={styles.logoDot}>.</Text>gg
        </Text>
        <Text style={styles.logoSub}>조건에 맞는 단어를 입력해 점수를 쌓으세요</Text>
      </View>

      {/* 스탯 카드 */}
      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>MY STATS</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.blue} style={{ marginTop: 16 }} />
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statsItem}>
                <Text style={styles.statsItemLabel}>최고 점수</Text>
                <Text style={styles.statsItemValue}>
                  {formatScore(stats?.bestScore ?? 0)}
                  <Text style={styles.statsUnit}> P</Text>
                </Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsItem}>
                <Text style={styles.statsItemLabel}>누적 점수</Text>
                <Text style={styles.statsItemValue}>
                  {formatScore(stats?.totalScore ?? 0)}
                  <Text style={styles.statsUnit}> P</Text>
                </Text>
              </View>
            </View>
            <View style={styles.playCountRow}>
              <View style={styles.playCountDot} />
              <Text style={styles.playCountText}>
                {stats?.gamesPlayed ?? 0}회 플레이
              </Text>
              <Text style={styles.playCountSub}>
                총 {formatScore(stats?.totalWords ?? 0)}개 단어 성공
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={{ flex: 1, minHeight: 24 }} />

      {/* 모드 선택 버튼 */}
      <View style={styles.buttons}>
        {/* 봇 모드 */}
        <TouchableOpacity
          style={styles.btnBotMode}
          onPress={() =>
            navigation.navigate('/matching', { uid, displayName })
          }
          activeOpacity={0.85}
          disabled={loading}
        >
          <View style={styles.btnModeInner}>
            <View>
              <Text style={styles.btnBotModeTitle}>봇 모드</Text>
              <Text style={styles.btnBotModeSub}>AI 봇과 대결 · 점수 도전</Text>
            </View>
            <Text style={styles.btnArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* PvP 모드 (Coming Soon) */}
        <View style={styles.btnPvpWrapper}>
          <View style={styles.btnPvpMode}>
            <View style={styles.btnModeInner}>
              <View>
                <Text style={styles.btnPvpModeTitle}>PvP 대결</Text>
                <Text style={styles.btnPvpModeSub}>실시간 1대1 대결</Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>출시 예정</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 랭킹 */}
        <TouchableOpacity
          style={styles.btnRanking}
          onPress={() => navigation.navigate('/ranking')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnRankingText}>랭킹 보기</Text>
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
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#22222A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 16,
    height: 16,
    borderRadius: 5,
    backgroundColor: COLORS.blue,
  },
  userName: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  logoArea: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 4,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  logo: {
    fontSize: 52,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -2,
    lineHeight: 58,
  },
  logoDot: {
    color: COLORS.blue,
  },
  logoSub: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#16161B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    marginTop: 12,
  },
  statsItem: {
    flex: 1,
  },
  statsItemLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  statsItemValue: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
    marginTop: 2,
  },
  statsUnit: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  statsDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  playCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  playCountDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.blue,
  },
  playCountText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  playCountSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  buttons: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  btnBotMode: {
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  btnModeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnBotModeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  btnBotModeSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  btnArrow: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
  },
  btnPvpWrapper: {
    opacity: 0.45,
  },
  btnPvpMode: {
    borderRadius: 16,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  btnPvpModeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  btnPvpModeSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  btnRanking: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnRankingText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
});
