import { createRoute, useBackEvent, closeView } from '@granite-js/react-native';
import { CommonActions } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { useDialog } from '@toss/tds-react-native';
import { josa } from 'es-hangul';
import { COLORS } from '../lib/theme';
import { createBotMatchDirect } from '../lib/matchmaking';

export const Route = createRoute('/matching', {
  component: MatchingScreen,
});

function MatchingScreen() {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const uid: string = (params as any)?.uid ?? 'demo_user_001';

  const [elapsed, setElapsed] = useState(0);
  const cancelRef = useRef<(() => void) | null>(null);
  const backEvent = useBackEvent();
  const { openConfirm } = useDialog();

  const brandDisplayName: string =
    ((global as Record<string, any>).__appsInToss ?? {}).brandDisplayName ?? '보카지지';

  const resetToHome = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: '/' }] })
    );
  };

  // 뒤로가기: TDS ConfirmDialog → 종료 시 매칭 취소 후 앱 닫기
  useEffect(() => {
    const handleBack = async () => {
      const confirmed = await openConfirm({
        title: `${josa(brandDisplayName, '을/를')} 종료할까요?`,
        leftButton: '닫기',
        rightButton: '종료하기',
        closeOnDimmerClick: true,
      });
      if (confirmed) {
        cancelRef.current?.();
        closeView();
      }
    };

    backEvent.addEventListener(handleBack);
    return () => backEvent.removeEventListener(handleBack);
  }, [backEvent, openConfirm, brandDisplayName]);
  const pulseAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  // 펄스 애니메이션
  useEffect(() => {
    pulseAnims.forEach((anim, i) => {
      const loop = Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 2100,
          delay: i * 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      );
      loop.start();
    });
    return () => pulseAnims.forEach((a) => a.stopAnimation());
  }, []);

  // 경과 시간 카운터
  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 봇 매치 직접 생성 (큐 없이)
  useEffect(() => {
    let mounted = true;

    createBotMatchDirect(uid, (matchId) => {
      if (mounted) {
        navigation.navigate('/game', { matchId, uid });
      }
    }).then((cancel) => {
      if (mounted) {
        cancelRef.current = cancel;
      } else {
        cancel();
      }
    });

    return () => {
      mounted = false;
      cancelRef.current?.();
    };
  }, [uid]);

  const handleCancel = () => {
    cancelRef.current?.();
    resetToHome();
  };

  return (
    <View style={styles.container}>
      {/* 상단 X 버튼은 GameScreenContainer 오버레이가 제공 — 중복 제거 */}

      {/* 메인 영역 */}
      <View style={styles.center}>
        {/* 펄스 스피너 */}
        <View style={styles.pulseContainer}>
          {pulseAnims.map((anim, i) => {
            const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] });
            const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
            return (
              <Animated.View
                key={i}
                style={[styles.pulseRing, { transform: [{ scale }], opacity }]}
              />
            );
          })}
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>BOT</Text>
          </View>
        </View>

        <Text style={styles.title}>게임 준비 중...</Text>
        <Text style={styles.subtitle}>{elapsed}초</Text>

        <View style={styles.botNotice}>
          <Text style={styles.botText}>
            AI 봇과 대결을 준비하고 있어요
          </Text>
        </View>
      </View>

      {/* 취소 버튼 */}
      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
          <Text style={styles.cancelBtnText}>취소</Text>
        </TouchableOpacity>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pulseContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: COLORS.blue,
    backgroundColor: 'rgba(49,130,246,0.1)',
  },
  vsCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  botNotice: {
    marginTop: 28,
    backgroundColor: 'rgba(49,130,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(49,130,246,0.2)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  botText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  cancelBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
});
