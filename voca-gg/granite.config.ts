import { appsInToss } from '@apps-in-toss/framework/plugins';
import { router } from '@granite-js/plugin-router';
import { hermes } from '@granite-js/plugin-hermes';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  appName: 'voca-gg',
  scheme: 'vocagg',
  // @firebase/database: exports.node 조건 제거 (scripts/patch-firebase-database.js postinstall)
  // → enhanced-resolve가 Node.js 빌드(faye-websocket 포함) 대신 browser 빌드 선택
  // conditionNames에서 "node" 제거: 이중 방어막
  metro: {
    resolver: {
      conditionNames: ['react-native', 'browser', 'require', 'default'],
    },
  },
  plugins: [
    router(),
    hermes(),
    appsInToss({
      brand: {
        displayName: 'voca.gg',
        primaryColor: '#3182F6',
        icon: '', // 콘솔에서 업로드한 아이콘 URL로 교체하세요
      },
      permissions: [],
    }),
  ],
});
