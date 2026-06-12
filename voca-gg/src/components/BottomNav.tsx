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

const TABS: { key: NavRoute; label: string }[] = [
  { key: '/', label: '홈' },
  { key: '/ranking', label: '랭킹' },
  { key: '/profile', label: '프로필' },
];

export function BottomNav({ active, navigation }: BottomNavProps) {
  const { bottom } = useSafeAreaInsets();
  const paddingBottom = bottom > 0 ? bottom : 12;

  return (
    <View style={[styles.container, { paddingBottom }]}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => {
              if (!isActive) {
                navigation.navigate(tab.key);
              }
            }}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.indicator} />}
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
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
    position: 'relative',
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
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDim,
    marginTop: 2,
  },
  labelActive: {
    color: COLORS.text,
    fontWeight: '800',
  },
});
