import { createRoute } from '@granite-js/react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS, AVATAR_COLORS } from '../lib/theme';
import { checkNicknameAvailable, saveProfile, getUserStats } from '../lib/matchmaking';
import { useProfile } from '../lib/ProfileContext';
import { Avatar } from '../components/Avatar';

export const Route = createRoute('/profile-edit', {
  component: ProfileEditScreen,
});

// 닉네임 유효성: 2~8자, 한글/영문/숫자만
function validateNickname(v: string): string | null {
  if (v.length < 2) return '2자 이상 입력해 주세요.';
  if (v.length > 8) return '8자 이하로 입력해 주세요.';
  if (!/^[가-힣a-zA-Z0-9]+$/.test(v)) return '한글, 영문, 숫자만 사용할 수 있어요.';
  return null;
}

function ProfileEditScreen() {
  const navigation = Route.useNavigation();
  const { uid, nickname: currentNickname, color: currentColor, refreshProfile } = useProfile();

  const [nickname, setNickname] = useState(currentNickname);
  const [color, setColor] = useState(currentColor);

  // 닉네임 중복 체크 상태
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 저장 진행 상태
  const [saving, setSaving] = useState(false);

  // 닉네임 변경 시 debounce 중복 체크
  const handleNicknameChange = useCallback(
    (text: string) => {
      setNickname(text);
      setCheckMsg(null);
      setIsAvailable(false);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const validErr = validateNickname(text);
      if (validErr) {
        setCheckMsg(validErr);
        return;
      }

      // 현재 닉네임과 동일하면 즉시 통과
      if (text.trim() === currentNickname.trim()) {
        setIsAvailable(true);
        setCheckMsg(null);
        return;
      }

      setChecking(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const available = await checkNicknameAvailable(text.trim(), uid);
          setIsAvailable(available);
          setCheckMsg(available ? '사용 가능한 닉네임이에요.' : '이미 사용 중인 닉네임이에요.');
        } catch {
          setIsAvailable(false);
          setCheckMsg('확인 중 오류가 발생했어요. 다시 시도해 주세요.');
        } finally {
          setChecking(false);
        }
      }, 700);
    },
    [uid, currentNickname],
  );

  // 초기 닉네임 설정 시 유효성만 표시
  useEffect(() => {
    const err = validateNickname(currentNickname);
    if (!err) setIsAvailable(true);
  }, [currentNickname]);

  const canSave =
    !saving &&
    !checking &&
    isAvailable &&
    validateNickname(nickname) === null &&
    (nickname.trim() !== currentNickname.trim() || color !== currentColor);

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveProfile(uid, nickname.trim(), color, currentNickname);
      const updated = await getUserStats(uid);
      if (updated) refreshProfile(updated);
      navigation.goBack();
    } catch {
      // 저장 실패 - 추후 에러 토스트 추가 가능
    } finally {
      setSaving(false);
    }
  }, [canSave, uid, nickname, color, currentNickname, refreshProfile, navigation]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 수정</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 아바타 미리보기 */}
      <View style={styles.avatarPreview}>
        <Avatar name={nickname} color={color} size={80} />
      </View>

      {/* 닉네임 입력 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>닉네임</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={handleNicknameChange}
          placeholder="2~8자, 한글/영문/숫자"
          placeholderTextColor={COLORS.textDim}
          maxLength={8}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.checkRow}>
          {checking ? (
            <ActivityIndicator size="small" color={COLORS.blue} style={{ marginRight: 4 }} />
          ) : null}
          {checkMsg ? (
            <Text style={[styles.checkMsg, isAvailable && styles.checkMsgOk]}>
              {checkMsg}
            </Text>
          ) : null}
        </View>
      </View>

      {/* 색상 팔레트 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>아바타 색상</Text>
        <View style={styles.palette}>
          {AVATAR_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorChip,
                { backgroundColor: c },
                color === c && styles.colorChipSelected,
              ]}
              onPress={() => setColor(c)}
              activeOpacity={0.8}
            >
              {color === c && <View style={styles.colorChipCheck} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={handleSave}
        activeOpacity={0.85}
        disabled={!canSave}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveBtnText}>저장하기</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  avatarPreview: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 28,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    minHeight: 18,
    paddingHorizontal: 4,
  },
  checkMsg: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.red,
  },
  checkMsgOk: {
    color: COLORS.green,
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChipSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  colorChipCheck: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(49,130,246,0.3)',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
