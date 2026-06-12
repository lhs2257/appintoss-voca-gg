import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, BOTTOM_NAV_HEIGHT } from '../lib/theme';

type NavRoute = '/' | '/ranking' | '/profile';

interface BottomNavProps {
  active: NavRoute;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
}

// ─── 커스텀 탭 아이콘 ────────────────────────────────────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* 지붕 (삼각형) */}
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: 11, borderRightWidth: 11, borderBottomWidth: 9,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color,
        marginBottom: -1,
      }} />
      {/* 몸체 */}
      <View style={{ width: 14, height: 10, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function RankingIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 3 }}>
      <View style={{ width: 5, height: 11, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ width: 5, height: 17, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ width: 5, height: 8, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* 머리 */}
      <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: color, marginBottom: 2 }} />
      {/* 어깨/몸 */}
      <View style={{
        width: 16, height: 8,
        borderTopLeftRadius: 8, borderTopRightRadius: 8,
        backgroundColor: color,
      }} />
    </View>
  );
}

// ─── 탭 정의 ────────────────────────────────────────────────────────────────

const TABS: { key: NavRoute; label: string; Icon: React.FC<{ color: string }> }[] = [
  { key: '/', label: '홈', Icon: HomeIcon },
  { key: '/ranking', label: '랭킹', Icon: RankingIcon },
  { key: '/profile', label: '프로필', Icon: ProfileIcon },
];

// ─── BottomNav ────────────────────────────────────────────────────────────────

export function BottomNav({ active, navigation }: BottomNavProps) {
  const { bottom } = useSafeAreaInsets();
  const paddingBottom = bottom > 0 ? bottom : 12;

  return (
    <View style={[styles.container, { paddingBottom }]}>
      {TABS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        const iconColor = isActive ? COLORS.blue : COLORS.textDim;
        return (
          <TouchableOpacity
            key={key}
            style={styles.tab}
            onPress={() => {
              if (!isActive) navigation.navigate(key);
            }}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.indicator} />}
            <Icon color={iconColor} />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    height: BOTTOM_NAV_HEIGHT,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
    paddingTop: 8,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.blue,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textDim,
  },
  labelActive: {
    color: COLORS.blue,
    fontWeight: '800',
  },
});
