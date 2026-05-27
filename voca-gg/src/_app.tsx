import React, { type PropsWithChildren } from 'react';
import { Granite, type InitialProps } from '@granite-js/react-native';
import { context } from '../require.context';

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return <>{children}</>;
}

/**
 * 앱인토스 샌드박스는 'intoss://' 스킴을 사용하지만,
 * granite.config.ts에 설정된 앱 스킴은 'vocagg://'입니다.
 * React Navigation의 prefix 매칭이 동작하려면 실제 URL 스킴을
 * 앱 설정 스킴으로 정규화해야 합니다.
 * 예: intoss://voca-gg → vocagg://voca-gg
 *     intoss://voca-gg/game → vocagg://voca-gg/game
 */
function getInitialUrl(url: string): string {
  return url.replace(/^[a-z][a-z0-9+\-.]*:\/\//i, 'vocagg://');
}

export default Granite.registerApp(AppContainer, {
  appName: 'voca-gg',
  context,
  getInitialUrl,
});
