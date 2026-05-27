// postinstall 스크립트: @firebase/database 패키지에서 Node.js 전용 exports 조건 제거
// React Native(Metro) 환경에서 enhanced-resolve가 faye-websocket을 요구하는
// Node.js 빌드 대신 브라우저 빌드를 선택하도록 강제합니다.

'use strict';

const fs = require('fs');
const path = require('path');

const pkgPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@firebase',
  'database',
  'package.json'
);

if (!fs.existsSync(pkgPath)) {
  console.log('[patch-firebase-database] node_modules/@firebase/database not found, skipping.');
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (pkg.exports && pkg.exports['.'] && pkg.exports['.']['node']) {
  delete pkg.exports['.']['node'];
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('[patch-firebase-database] Removed "node" condition from @firebase/database exports.');
} else {
  console.log('[patch-firebase-database] Already patched or "node" condition not found, nothing to do.');
}
