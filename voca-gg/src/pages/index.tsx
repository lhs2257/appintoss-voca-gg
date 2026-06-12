import { createRoute, useBackEvent, closeView } from '@granite-js/react-native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { getUserKeyForGame, Storage } from '@apps-in-toss/framework';
import { useDialog } from '@toss/tds-react-native';
import { josa } from 'es-hangul';
import { COLORS } from '../lib/theme';
import { useAudio, type AudioMode } from '../lib/AudioContext';
import { formatScore } from '../lib/gameUtils';
import { initUserStats } from '../lib/matchmaking';
import type { UserStats } from '../lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppGlobals = Record<string, any>;

// 최초 1회 결정된 UID를 영구 저장 — 이후 세션에서는 캐시 값만 사용
// (iOS에서 getUserKeyForGame이 세션마다 다른 hash를 반환하는 문제 방지)
const PERSISTENT_UID_KEY = '@vocagg/persistent_uid';

async function getOrCreatePersistentUid(): Promise<string> {
  try {
    const cached = await Storage.getItem(PERSISTENT_UID_KEY);
    if (cached) return cached;

    // 최초 1회: getUserKeyForGame 시도 → 실패 시 랜덤 생성
    let newUid: string;
    try {
      const result = await getUserKeyForGame();
      if (result && result !== 'INVALID_CATEGORY' && result !== 'ERROR' && result.type === 'HASH') {
        newUid = result.hash;
      } else {
        newUid = `${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
      }
    } catch {
      newUid = `${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    }

    await Storage.setItem(PERSISTENT_UID_KEY, newUid);
    return newUid;
  } catch {
    // Storage 완전 실패 시 세션 고유 ID (최후 폴백)
    return `${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
  }
}

/**
 * getUserKeyForGame의 hash 앞 4자리로 기본 닉네임 생성
 * 예: hash = "ab12cdef..." → "플레이어 AB12"
 */
function generateDisplayName(hash: string): string {
  const chars = hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  return `플레이어 ${chars || '????'}`;
}

// ─── 오디오 토글 버튼 ────────────────────────────────────────────────────────

// 음표 + 음파 아이콘 (첨부 이미지 스타일)
function MusicSoundIcon({ size = 20, color }: { size?: number; color: string }) {
  const nW = size * 0.52;   // 음표 전체 너비
  const nH = size;           // 음표 전체 높이
  const stroke = size * 0.1; // 음파 선 굵기

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: size * 1.55, height: nH }}>
      {/* ── 8분 음표 ── */}
      <View style={{ width: nW, height: nH }}>
        {/* 머리 (타원) */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0,
          width: nW * 0.82, height: nH * 0.4,
          borderRadius: nH * 0.2,
          backgroundColor: color,
          transform: [{ rotate: '-14deg' }],
        }} />
        {/* 기둥 */}
        <View style={{
          position: 'absolute', right: nW * 0.04, bottom: nH * 0.14,
          width: size * 0.1, height: nH * 0.72,
          borderRadius: size * 0.05,
          backgroundColor: color,
        }} />
        {/* 꼬리 */}
        <View style={{
          position: 'absolute', top: nH * 0.04, right: nW * 0.04,
          width: nW * 0.52, height: nH * 0.32,
          backgroundColor: color,
          borderTopRightRadius: nH * 0.18,
          borderBottomRightRadius: nH * 0.12,
        }} />
      </View>

      {/* ── 음파 (작은 호 → 큰 호) ── */}
      {/* 호: borderRightColor만 보이는 원 → ")" 형태 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.06, marginLeft: size * 0.04 }}>
        {/* 작은 호 */}
        <View style={{
          width: size * 0.2,
          height: size * 0.48,
          borderRadius: size * 0.1,
          borderWidth: stroke,
          borderColor: 'transparent',
          borderRightColor: color,
        }} />
        {/* 큰 호 */}
        <View style={{
          width: size * 0.26,
          height: size * 0.72,
          borderRadius: size * 0.13,
          borderWidth: stroke,
          borderColor: 'transparent',
          borderRightColor: color,
        }} />
      </View>
    </View>
  );
}

function AudioToggleButton() {
  const { mode, cycleMode } = useAudio();
  const active = mode !== 'off';
  const iconColor = active ? COLORS.blue : 'rgba(255,255,255,0.3)';
  const badge = mode === 'bgm1' ? '1' : mode === 'bgm2' ? '2' : null;

  return (
    <TouchableOpacity
      style={[audioToggleStyles.btn, active && audioToggleStyles.btnActive]}
      onPress={cycleMode}
      activeOpacity={0.75}
    >
      <View style={{ position: 'relative' }}>
        <MusicSoundIcon size={18} color={iconColor} />
        {/* 꺼짐 상태: 빨간 사선 */}
        {!active && (
          <View style={audioToggleStyles.muteLine} />
        )}
      </View>
      {badge && (
        <Text style={audioToggleStyles.badge}>{badge}</Text>
      )}
    </TouchableOpacity>
  );
}

const audioToggleStyles = {
  btn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  btnActive: {
    borderColor: 'rgba(49,130,246,0.5)',
    backgroundColor: 'rgba(49,130,246,0.1)',
  },
  badge: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: COLORS.blue,
    marginTop: -1,
  },
  muteLine: {
    position: 'absolute' as const,
    width: 26,
    height: 2,
    backgroundColor: 'rgba(220,50,50,0.9)',
    top: 7,
    left: -1,
    borderRadius: 1,
    transform: [{ rotate: '-30deg' }],
  },
};

export const Route = createRoute('/', {
  component: HomeScreen,
});

function HomeScreen() {
  const navigation = Route.useNavigation();
  const [uid, setUid] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const backEvent = useBackEvent();
  const { openConfirm } = useDialog();

  // 브랜드 이름 (X 버튼 팝업과 동일하게 사용)
  const brandDisplayName: string =
    ((global as AppGlobals).__appsInToss ?? {}).brandDisplayName ?? '보카지지';

  // 홈에서 뒤로가기 → TDS ConfirmDialog (X 버튼과 동일한 팝업)
  useEffect(() => {
    const handleBack = () => {
      openConfirm({
        title: `${josa(brandDisplayName, '을/를')} 종료할까요?`,
        leftButton: '닫기',
        rightButton: '종료하기',
        closeOnDimmerClick: true,
      }).then((confirmed) => {
        if (confirmed) closeView();
      });
    };

    backEvent.addEventListener(handleBack);
    return () => backEvent.removeEventListener(handleBack);
  }, [backEvent, openConfirm, brandDisplayName]);

  useEffect(() => {
    async function init() {
      try {
        // 최초 1회만 UID 결정 후 Storage에 영구 저장
        // 이후 세션에서는 캐시 값 사용 (iOS getUserKeyForGame 세션마다 변경 문제 방지)
        const resolvedUid = await getOrCreatePersistentUid();
        const resolvedName = generateDisplayName(resolvedUid);

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
        <View style={styles.taglineRow}>
          <Text style={styles.tagline}>영어 단어 대결 게임</Text>
          <AudioToggleButton />
        </View>
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
                <Text style={styles.statsItemLabel}>평균 점수</Text>
                <Text style={styles.statsItemValue}>
                  {formatScore(
                    stats && stats.gamesPlayed > 0
                      ? Math.round(stats.totalScore / stats.gamesPlayed)
                      : 0
                  )}
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
    paddingTop: 8,  // safeAreaTop은 GameScreenContainer wrapper에서 처리
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
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
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
