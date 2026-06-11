import { createRoute } from '@granite-js/react-native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../lib/theme';
import { formatScore } from '../lib/gameUtils';
import { fetchScoreRanking } from '../lib/matchmaking';
import type { UserStats } from '../lib/types';

type RankedUser = UserStats & { uid: string };

export const Route = createRoute('/ranking', {
  component: RankingScreen,
});

function RankingScreen() {
  const navigation = Route.useNavigation();
  const [data, setData] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScoreRanking()
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item, index }: { item: RankedUser; index: number }) => {
    const rank = index + 1;
    const isTop3 = rank <= 3;
    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const value = `${formatScore(item.bestScore ?? 0)} P`;

    return (
      <View style={[styles.rankRow, isTop3 && styles.rankRowTop]}>
        <View style={styles.rankNum}>
          {isTop3 ? (
            <Text style={[styles.rankMedal, { color: medalColors[rank - 1] }]}>
              {rank}
            </Text>
          ) : (
            <Text style={styles.rankText}>{rank}</Text>
          )}
        </View>
        <View style={styles.rankInfo}>
          <Text style={styles.rankName}>{item.displayName}</Text>
          <Text style={styles.rankSub}>
            {item.gamesPlayed}회 플레이
          </Text>
        </View>
        <Text style={[styles.rankValue, isTop3 && { color: medalColors[rank - 1] }]}>
          {value}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>랭킹</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 리스트 */}
      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator color={COLORS.blue} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyArea}>
          <Text style={styles.emptyText}>아직 랭킹 데이터가 없어요.</Text>
          <Text style={styles.emptySub}>첫 번째 플레이어가 되어보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,  // safeAreaTop은 GameScreenContainer wrapper에서 처리
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 22,
    color: COLORS.text,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  loadingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textDim,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rankRowTop: {
    borderColor: 'rgba(255,210,100,0.2)',
  },
  rankNum: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  rankMedal: {
    fontSize: 16,
    fontWeight: '900',
  },
  rankInfo: {
    flex: 1,
    marginLeft: 10,
  },
  rankName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  rankSub: {
    fontSize: 11,
    color: COLORS.textDim,
    marginTop: 2,
  },
  rankValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
});
