/**
 * 토스 게임 스타일 투명 오버레이 스크린 컨테이너
 *
 * Granite.registerApp의 screenContainer로 등록하여 모든 화면에 적용합니다.
 *
 * - X 버튼: useDialog.openConfirm → TDS ConfirmDialog (프레임워크 동일 디자인)
 * - ... 버튼: useState + BottomSheet.Root 직접 렌더링 (useOverlay 포털 대신 직접 상태 관리)
 *   → iOS에서 useOverlay 포털이 화면 뒤에 렌더링되는 문제 해결
 *   → BottomSheet.Root는 TDS 내부에서 Modal을 사용하므로 항상 화면 최상단에 표시됨
 *   아이템 순서: getMiniAppsSupportContact 연락처 → 홈 바로가기 → 공유하기 → 설정
 * - iOS 스와이프 뒤로가기 비활성화
 */

import React, {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import {
  PageNavbar,
  BottomSheet,
  List,
  ListHeader,
  ListRow,
  Asset,
  useDialog,
} from '@toss/tds-react-native';
import { NavigationRightContent } from '@toss/tds-react-native/private';
import { closeView } from '@granite-js/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  setIosSwipeGestureEnabled,
  getSchemeUri,
  openURL,
  getOperationalEnvironment,
  INTERNAL__appBridgeHandler,
  shareWithScheme,
} from '@apps-in-toss/native-modules';
import { josa } from 'es-hangul';

// ─── 상수 ──────────────────────────────────────────────────────────────────────

const Z_GAME_CLOSE_BUTTON = 9999;


// ─── 타입 ───────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppGlobals = Record<string, any>;

interface ContactItem {
  contactItemName: string;
  contactIconUrl: string;
  contactUri: string;
}

// ─── 아이콘 헬퍼 ────────────────────────────────────────────────────────────────

const iconNameRegExp =
  /^(icon-|icn-(?!(car|sec|bank-(fill|square|horizontal))-))(.+)/i;
const iconURLRegExp =
  /^https:\/\/static\.toss\.im\/icons\/(png\/\dx|svg|pdf)\/((icon-|icn-(?!(car|sec|bank-(fill|square|horizontal))-))(.+))\.(png|svg|pdf)$/i;

/** URL 혹은 아이콘 이름을 Asset.Icon name으로 변환 (이미지 URL이면 null) */
function getIconName(url: string): string | null {
  if (iconNameRegExp.test(url)) return url;
  return url.match(iconURLRegExp)?.[2] ?? null;
}

/** hex 색상 → [r, g, b] 배열 (파싱 실패 시 null) */
function hexToRGB(hex: string): number[] | null {
  const rgb = hex
    .toLowerCase()
    .match(/[0-9a-f]{2}/g)
    ?.map((s) => parseInt(s, 16));
  return rgb?.length === 3 ? rgb : null;
}

// ─── 메뉴 아이콘 뷰 (프레임워크 Menu 컴포넌트 동일 디자인) ───────────────────────

interface MenuIconViewProps {
  iconURL: string;
  brandPrimaryColor: string;
}

function MenuIconView({ iconURL, brandPrimaryColor }: MenuIconViewProps) {
  const rgb = hexToRGB(brandPrimaryColor);
  const bgColor = rgb ? `rgba(${rgb.join(',')},0.1)` : '#f0f0f0';
  const iconName = getIconName(iconURL);
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        backgroundColor: bgColor,
      }}
    >
      {iconName != null ? (
        <Asset.Icon
          frameShape={{ width: 20, height: 20 }}
          color={brandPrimaryColor}
          name={iconName}
        />
      ) : (
        <Asset.Image
          frameShape={{ width: 20, height: 20 }}
          source={{ uri: iconURL }}
        />
      )}
    </View>
  );
}

// ─── 스크린 컨테이너 ────────────────────────────────────────────────────────────

export default function GameScreenContainer({ children }: PropsWithChildren) {
  const { top: safeAreaTop, right: safeAreaRight } = useSafeAreaInsets();

  // iOS: 스와이프 뒤로가기 비활성화
  useEffect(() => {
    if (Platform.OS === 'ios') {
      setIosSwipeGestureEnabled({ isEnabled: false });
      return () => {
        setIosSwipeGestureEnabled({ isEnabled: true });
      };
    }
    return undefined;
  }, []);

  // Granite.registerApp에서는 safe area 자동 처리가 없으므로
  // iOS(iPhone/iPad) · Android 모두 safeAreaTop 적용하여 노치/상태바 아래에 배치
  const adjustedTop = safeAreaTop;

  // 앱 글로벌 정보 (AppsInToss 콘솔에서 설정한 앱 이름·아이콘·브랜드 색상 등)
  const appsInTossGlobals: AppGlobals =
    (global as AppGlobals).__appsInToss ?? {};
  const graniteGlobals: AppGlobals = (global as AppGlobals).__granite ?? {};
  const brandDisplayName: string =
    appsInTossGlobals.brandDisplayName ?? '보카지지';
  const appName: string = graniteGlobals.app?.name ?? 'voca-gg';
  const brandPrimaryColor: string =
    appsInTossGlobals.brandPrimaryColor ?? '#3182F6';

  const isSandbox = getOperationalEnvironment() === 'sandbox';

  // getMiniAppsSupportContact 연락처 아이템 (이용 후기, 고객센터 등)
  const [itemList, setItemList] = useState<ContactItem[]>([]);

  useEffect(() => {
    INTERNAL__appBridgeHandler.invokeAppBridgeMethod(
      'getMiniAppsSupportContact',
      {},
      {
        onSuccess: ({ items }: { items: ContactItem[] }) => setItemList(items),
        onError: () => {},
      }
    );
  }, []);

  // TDS Dialog
  const { openConfirm } = useDialog();

  // ... 버튼 더보기 메뉴 상태 (두 가지로 분리)
  // isDotsMenuMounted: 트리에 마운트 여부 (닫혀있으면 완전 제거 → 터치 이벤트 차단 방지)
  // isDotsMenuOpen:    BottomSheet open prop (애니메이션 제어)
  const [isDotsMenuMounted, setIsDotsMenuMounted] = useState(false);
  const [isDotsMenuOpen, setIsDotsMenuOpen] = useState(false);

  // X 버튼: TDS ConfirmDialog — 프레임워크(useCloseConfirm)와 동일 디자인
  const handleClose = useCallback(async () => {
    const confirmed = await openConfirm({
      title: `${josa(brandDisplayName, '을/를')} 종료할까요?`,
      leftButton: '닫기',
      rightButton: '종료하기',
      closeOnDimmerClick: true,
    });
    if (confirmed) {
      closeView();
    }
  }, [openConfirm, brandDisplayName]);

  // ... 버튼: 마운트 후 open
  const handleDotsPress = useCallback(() => {
    setIsDotsMenuMounted(true);
    setIsDotsMenuOpen(true);
  }, []);

  // 닫기: open=false → 클로즈 애니메이션 실행
  const handleDotsClose = useCallback(() => {
    setIsDotsMenuOpen(false);
  }, []);

  // 애니메이션 완료 후: 트리에서 언마운트
  const handleDotsExited = useCallback(() => {
    setIsDotsMenuMounted(false);
  }, []);

  return (
    <>
      {/* 네이티브 헤더 숨김 */}
      <PageNavbar preference={{ type: 'none' }} />

      {/* 투명 오버레이: X·... 버튼 */}
      <View
        style={[
          styles.overlay,
          {
            height: Platform.OS === 'ios' ? 44 : 54,
            marginTop: adjustedTop,
            paddingRight: safeAreaRight + 10,
          },
        ]}
        pointerEvents="box-none"
      >
        <NavigationRightContent
          fixedRightButton={undefined}
          onPressDots={handleDotsPress}
          onPressClose={handleClose}
          theme="dark"
        />
      </View>

      {/* 게임 콘텐츠
           - safeAreaTop 만큼 아래로 밀어 모든 화면이 노치/카메라 영역 아래에 표시되도록 함
           - backgroundColor: 노치 영역도 동일한 앱 배경색으로 채움 */}
      <View style={{ flex: 1, paddingTop: safeAreaTop, backgroundColor: '#0B0B0E' }}>
        {children}
      </View>

      {/* ... 버튼 더보기 메뉴 바텀시트
           - children 뒤에 렌더링 → React Native z-order상 화면 콘텐츠 위에 표시됨
           - isDotsMenuMounted가 true일 때만 트리에 존재 (닫힌 상태에서 터치 이벤트 차단 방지)
           - onExited에서 언마운트 → 클로즈 애니메이션 완전히 끝난 뒤 제거 */}
    {isDotsMenuMounted && (
        <BottomSheet.Root
          open={isDotsMenuOpen}
          header={
            <ListHeader
              title={
                <ListHeader.TitleParagraph fontWeight="bold">
                  {brandDisplayName}
                </ListHeader.TitleParagraph>
              }
            />
          }
          cta={
            <BottomSheet.CTA
              size="large"
              type="dark"
              style="weak"
              onPress={handleDotsClose}
            >
              닫기
            </BottomSheet.CTA>
          }
          onClose={handleDotsClose}
          onExited={handleDotsExited}
        >
          <List rowSeparator="none">
            {/* 1. getMiniAppsSupportContact 연락처 아이템 (이용 후기, 고객센터 등) */}
            {itemList.map((item) => (
              <ListRow
                key={item.contactItemName}
                left={
                  <MenuIconView
                    iconURL={item.contactIconUrl}
                    brandPrimaryColor={brandPrimaryColor}
                  />
                }
                contents={
                  <ListRow.Texts type="1RowTypeA" top={item.contactItemName} />
                }
                verticalPadding="extraSmall"
                onPress={() => {
                  handleDotsClose();
                  openURL(item.contactUri);
                }}
              />
            ))}

            {/* 2. 홈 화면에 추가 (샌드박스 미지원) */}
            {!isSandbox ? (
              <ListRow
                left={
                  <MenuIconView
                    iconURL="https://static.toss.im/icons/png/4x/icon-plus-circle-mono.png"
                    brandPrimaryColor={brandPrimaryColor}
                  />
                }
                contents={
                  <ListRow.Texts type="1RowTypeA" top="휴대폰 홈 화면에 추가" />
                }
                verticalPadding="extraSmall"
                onPress={() => {
                  handleDotsClose();
                  INTERNAL__appBridgeHandler.invokeAppBridgeMethod(
                    'addMiniAppShortcut',
                    {
                      title: brandDisplayName,
                      appName,
                      iconUrl: appsInTossGlobals.brandIcon as string,
                      guideUrl: 'https://service.toss.im/app-mini-home/shortcut',
                    },
                    { onSuccess: () => {}, onError: () => {} }
                  );
                }}
              />
            ) : null}

            {/* 3. 공유하기 */}
            <ListRow
              left={
                <MenuIconView
                  iconURL="https://static.toss.im/icons/png/4x/icon-share-dots-mono.png"
                  brandPrimaryColor={brandPrimaryColor}
                />
              }
              contents={<ListRow.Texts type="1RowTypeA" top="공유하기" />}
              verticalPadding="extraSmall"
              onPress={() => {
                if (isSandbox) {
                  openConfirm({
                    title: '공유하기 기능 미지원',
                    description:
                      '샌드박스 환경에서는 사용할 수 없어요. 콘솔을 통해 토스앱에서 테스트해 주세요.',
                    rightButton: '확인',
                    closeOnDimmerClick: true,
                  });
                  return;
                }
                handleDotsClose();
                shareWithScheme({
                  schemeURL: `${getSchemeUri()}?referrer=appsintoss.common_module_share`,
                });
              }}
            />

            {/* 4. 설정 (샌드박스 미지원) */}
            {!isSandbox ? (
              <ListRow
                left={
                  <MenuIconView
                    iconURL="https://static.toss.im/icons/png/4x/icon-setting-mono.png"
                    brandPrimaryColor={brandPrimaryColor}
                  />
                }
                contents={<ListRow.Texts type="1RowTypeA" top="설정" />}
                verticalPadding="extraSmall"
                onPress={() => {
                  handleDotsClose();
                  openURL(
                    `servicetoss://apps-in-toss-menu/settings?appName=${appName}&displayAppName=${encodeURIComponent(brandDisplayName)}`
                  );
                }}
              />
            ) : null}
          </List>
        </BottomSheet.Root>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'absolute',
    zIndex: Z_GAME_CLOSE_BUTTON,
  },
});
