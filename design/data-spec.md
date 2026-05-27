# voca.gg - 데이터 구조 명세

## Firebase Realtime Database

### 매칭 큐

```json
/queue/{uid}: {
  "uid": "user123",
  "displayName": "홍길동",
  "joinedAt": 1716700000000
}
```

- 대결 시작 클릭 시 큐에 등록
- 큐에 다른 플레이어 있으면 매치 생성 후 양쪽 큐에서 삭제
- 3초 내 미매칭 시 봇 매치 생성

### 매치

```json
/matches/{matchId}: {
  "status": "waiting | playing | finished",
  "player1": "uid1",
  "player2": "uid2 | bot",
  "currentTurn": "uid1 | uid2 | bot",
  "round": 1,
  "turnCount": 0,
  "condition": {
    "first": "a",
    "last": "e"
  },
  "words": [
    {
      "word": "apple",
      "meaning": "사과",
      "uid": "uid1",
      "timestamp": 1716700000000
    }
  ],
  "scores": {
    "uid1": 0,
    "uid2": 0
  },
  "winner": null,
  "createdAt": 1716700000000,
  "finishedAt": null
}
```

---

## Firebase Firestore

### 유저 데이터

```json
/users/{uid}: {
  "displayName": "홍길동",
  "totalScore": 1250,
  "totalWords": 87,
  "gamesPlayed": 15,
  "wins": 8,
  "createdAt": timestamp,
  "updatedAt": timestamp
}
```

- `totalScore`: 누적 점수 (점수 랭킹 기준)
- `totalWords`: 전체 게임에서 맞춘 단어 총 개수 (단어 랭킹 기준)

### 랭킹

- 점수 랭킹: totalScore 기준 내림차순 쿼리
- 단어 랭킹: totalWords 기준 내림차순 쿼리
- 별도 랭킹 컬렉션 불필요 (탭 전환 시 정렬 기준만 변경)

---

## 앱 내장 단어 DB (JSON)

### 파일 위치
```
src/data/words.json
```

### 구조

```json
{
  "a_e": [
    { "word": "apple", "meaning": "사과" },
    { "word": "archive", "meaning": "기록, 보관소" },
    { "word": "ache", "meaning": "아프다, 통증" },
    { "word": "age", "meaning": "나이, 시대" },
    { "word": "ace", "meaning": "에이스, 최고" }
  ],
  "b_k": [
    { "word": "book", "meaning": "책" },
    { "word": "brick", "meaning": "벽돌" },
    { "word": "back", "meaning": "뒤, 돌아가다" }
  ]
}
```

### 키 규칙
- `{첫알파벳}_{끝알파벳}` 형식 (소문자)
- 예: `a_e`, `b_k`, `c_t`

### 구축 범위 (v1)
- 게임에서 실제 사용할 조합만 선별
- 조합당 최소 15개 단어 확보 (턴 5번 + 여유분)
- 목표 조합 수: 50~100개
- 총 단어 수: 750~1500개

### 단어 DB 구축 방법
1. 자주 쓰이는 영단어 1500개 목록 확보 (오픈소스)
2. 첫/끝 알파벳 기준으로 자동 분류
3. 한국어 뜻 일괄 추가 (ChatGPT 활용)
4. 조합당 15개 미만인 조합은 게임 조건에서 제외

---

## 화면별 데이터 흐름

| 화면 | 읽기 | 쓰기 |
|------|------|------|
| 홈 | users/{uid} | - |
| 매칭 대기 | queue/ | queue/{uid} 추가/삭제 |
| 게임 | matches/{id} 구독 | matches/{id}/words, currentTurn |
| 결과 | matches/{id} | users/{uid}/totalScore, totalWords |
| 랭킹 | users/ (상위 100) | - |
