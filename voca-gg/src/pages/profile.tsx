import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { COLORS, BOTTOM_NAV_HEIGHT } from '../lib/theme';
import { formatScore } from '../lib/gameUtils';
import { getUserStats } from '../lib/matchmaking';
import { useProfile } from '../lib/ProfileContext';
import { Avatar } from '../components/Avatar';
import { BottomNav } from '../components/BottomNav';
import type { UserStats } from '../lib/types';

export const Route = createRoute('/profile', {
  component: ProfileScreen,
});

function ProfileScreen() {
  const navigation = Route.useNavigation();
  const { uid, nickname, color } = useProfile();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    getUserStats(uid)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [uid]);

  const avgScore =
    stats && stats.gamesPlayed > 0
      ? Math.round(stats.totalScore / stats.gamesPlayed)
      : 0;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: BOTTOM_NAV_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>프로필</Text>
        </View>

        {/* 아바타 + 닉네임 카드 */}
        <View style={styles.profileCard}>
          <Avatar name={nickname} color={color} size={72} />
          <Text style={styles.nickname}>{nickname}</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('/profile-edit')}
            activeOpacity={0.8}
          >
            <Text style={styles.editBtnText}>프로필 수정</Text>
          </TouchableOpacity>
        </View>

        {/* 통계 카드 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>내 전적</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.blue} style={{ marginTop: 16 }} />
          ) : (
            <>
              <View style={styles.statsGrid}>
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{formatScore(stats?.bestScore ?? 0)}</Text>
                  <Text style={styles.statsName}>최고 점수</Text>
                </View>
                <View style={styles.statsDivider} />
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{formatScore(avgScore)}</Text>
                  <Text style={styles.statsName}>평균 점수</Text>
                </View>
                <View style={styles.statsDivider} />
                <View style={styles.statsItem}>
                  <Text style={styles.statsValue}>{stats?.gamesPlayed ?? 0}</Text>
                  <Text style={styles.statsName}>플레이 수</Text>
                </View>
              </View>
              <View style={styles.wordsRow}>
                <View style={styles.wordsDot} />
                <Text style={styles.wordsText}>
                  총 {formatScore(stats?.totalWords ?? 0)}개 단어 성공
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <BottomNav active="/profile" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  nickname: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  editBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(49,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(49,130,246,0.3)',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.blue,
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  statsLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statsValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  statsName: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  statsDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  wordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  wordsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.blue,
  },
  wordsText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
});
