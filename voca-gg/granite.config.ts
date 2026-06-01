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
        displayName: '보카지지',
        primaryColor: '#3182F6',
        icon: 'https://static.toss.im/appsintoss/6147/967041d8-327d-4bd2-9de3-eea77da3d5f0.png',
      },
      permissions: [],
    }),
  ],
});
