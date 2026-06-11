import React, { type PropsWithChildren } from 'react';
import { Granite } from '@granite-js/react-native';
import { type InitialProps } from '@granite-js/react-native';
import { TDSProvider } from '@toss/tds-react-native';
import { getSchemeUri } from '@apps-in-toss/native-modules';
import { context } from '../require.context';
import GameScreenContainer from './lib/GameScreenContainer';

/**
 * AppContainer: 앱 전체 루트 컨테이너
 * - TDSProvider: NavigationRightContent(X 버튼) 등 TDS 컴포넌트에 필요한 테마 컨텍스트 제공
 */
function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return (
    <TDSProvider colorPreference="light" token={{ color: { primary: '#3182F6' } }}>
      {children}
    </TDSProvider>
  );
}

/**
 * Granite.registerApp 사용:
 *
 * - 게임 로딩 정상 동작 (AppsInToss.registerApp의 Analytics.Screen 래퍼가 없음)
 * - screenContainer: GameScreenContainer
 *   → PageNavbar none (네이티브 헤더 숨김)
 *   → 토스 게임 스타일 투명 오버레이 X 버튼 (NavigationRightContent)
 * - TDSProvider: AppContainer에서 직접 추가
 * - initialScheme + getInitialUrl: intoss:// → vocagg:// 변환으로 라우팅 정상화
 */
export default Granite.registerApp(AppContainer, {
  context,
  appName: 'voca-gg',
  initialScheme: 'vocagg://voca-gg',
  getInitialUrl: async () => {
    const uri = getSchemeUri();
    return uri.replace(/^intoss:\/\//, 'vocagg://');
  },
  router: {
    screenContainer: GameScreenContainer,
    defaultScreenOption: {
      // 'light' = 흰색 아이콘 (다크 테마 앱용)
      // 'dark'  = 검은 아이콘 (라이트 테마 앱용) ← 이전 설정, 상단바가 흰색으로 표시되던 원인
      statusBarStyle: 'light',
    },
  },
});
