# voca.gg - 작업 현황

## 진행 단계

```
[x] 1단계 - 기획    아이디어 확정, 스펙 정의, PROJECT.md 작성
[x] 2단계 - 설계    화면 와이어프레임, Firebase 구조 확정
[~] 3단계 - 개발    스캐폴딩 완료 → 단어 DB → 핵심 기능 구현
[ ] 4단계 - 검증    샌드박스 테스트 → 버그 수정
[ ] 5단계 - 배포    앱인토스 콘솔 출시
```

## 현재 작업

### [진행중] 3단계 개발
- [완료] Granite 프로젝트 스캐폴딩 (`voca-gg/` 디렉토리)
- [완료] npm install 및 의존성 설치 (firebase JS SDK, TDS, @apps-in-toss/framework)
- [완료] granite.config.ts 앱인토스 플러그인 설정 (appsInToss 연동)
- [완료] 단어 DB JSON 구축 (`src/data/words.json`) - 25개 조합, 약 450단어
- [완료] Firebase JS SDK 설정 (`src/lib/firebase.ts`) - config 입력 대기
- [완료] 게임 로직 구현 (`src/lib/gameUtils.ts`, `src/lib/matchmaking.ts`)
- [완료] 전체 화면 구현 (홈/매칭/게임/결과/랭킹 - 5개 스크린)
- [완료] TypeScript 타입 체크 통과

### 현재
- [완료] @firebase/database Node.js 빌드 번들 오류 수정
- [완료] intoss:// → vocagg:// 스킴 정규화 (/_404 라우팅 오류 해결)
- [완료] Firebase 빈 배열 undefined 오류 수정 (subscribeMatch 정규화)
- [완료] 봇 모드 분리 / PvP Coming Soon 처리
  - UserStats: wins 제거, bestScore 추가
  - 홈: getUserKeyForGame 연동, 최고점수+누적점수, 모드 선택 UI
  - 매칭: 큐 로직 제거 → 봇 직접 매치
  - 결과: 개인 점수 화면으로 개편
- [완료] UX 버그 7건 수정
  - 상단 여백 축소: 홈/매칭/랭킹 paddingTop 56→36, 결과 64→44
  - 플레이 횟수 +1 오류: isEndingRef 가드로 endBotGame 이중 호출 차단
  - 키보드 대응: 단어 피드 ScrollView 전환 + 자동 하단 스크롤 (Android height 동작)
  - 타이머 10초 (TURN_TIMEOUT_MS_CONST = 10000)
  - 랭킹: orderByChild → 클라이언트 정렬 (Firebase 인덱스 불필요)
  - displayName stale 레코드 자동 갱신 (initUserStats)
- [대기] 샌드박스 재테스트 (전체 플로우 재확인)

### 완료: 2단계 설계
- 화면 와이어프레임 작성 (wireframes.md)
- 게임 상태 흐름 설계 (game-state.md)
- Firebase + 단어 DB 구조 확정 (data-spec.md)

## 완료 이력

| 날짜 | 단계 | 내용 |
|------|------|------|
| 2026-05-26 | 1단계 기획 | 앱 폴더 생성, PROJECT.md 작성 완료 |
| 2026-05-26 | 2단계 설계 | 와이어프레임, 게임 상태, 데이터 구조 설계 완료 |
| 2026-05-26 | 2단계 설계 | Claude Design 시안 파일 추가 (app.jsx, screens.jsx, ios-frame.jsx, voca.gg.html) |
| 2026-05-26 | 2단계 설계 | 랭킹 2종으로 확장 (점수 랭킹 + 단어 수 랭킹), totalWords 필드 추가 |
| 2026-05-26 | 앱 등록 준비 | 서비스이용약관(terms.html) 및 개인정보처리방침(privacy.html) 작성 완료 - GitHub Pages 배포 예정 |
| 2026-05-27 | 3단계 개발 | Granite 스캐폴딩, 패키지 설치, 단어 DB(25조합/450단어), 전체 화면 구현(5개) 완료 |
| 2026-05-27 | 3단계 개발 | package-lock.json, README.md 커밋 완료. Firebase config 입력 대기 중 |
| 2026-05-27 | 환경 설정 | check-docs-sync.sh 스톱 훅 오탐 수정 (apps/*/*/*spath 제외 패턴 추가) |
| 2026-05-27 | 3단계 개발 | Firebase 설정 완료 (databaseURL asia-southeast1 추가) - 샌드박스 테스트 준비 완료 |
| 2026-05-27 | 3단계 개발 | Firestore 제거 → Realtime Database 단일화 (crypto 모듈 Metro 번들 오류 해결) |
| 2026-05-27 | 3단계 개발 | @firebase/database exports.node 제거 + postinstall 스크립트 (net/ 번들 오류 해결) |
| 2026-05-27 | 3단계 개발 | _app.tsx getInitialUrl 추가 - intoss:// 스킴을 vocagg://로 정규화 (/_404 라우팅 오류 해결) |
| 2026-05-27 | 4단계 검증 | Firebase 빈 배열 오류 수정, validateWord 디버그로 로직 검증 완료 |
| 2026-05-27 | 4단계 검증 | 봇 모드 분리 리팩토링 - PvP Coming Soon, bestScore 추가, getUserKeyForGame 연동 |
| 2026-05-27 | 4단계 검증 | UX 버그 7건 수정 - paddingTop, 플레이 횟수 오류, 키보드 ScrollView, 타이머 10초, 랭킹 클라이언트 정렬, displayName 갱신 |
