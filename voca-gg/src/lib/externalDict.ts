// voca.gg - 외부 사전 API 모듈
//
// Free Dictionary API: 영단어 유효성 검사 (무료, 키 불필요)
// DeepL API: 한국어 의미 번역 (무료 플랜 500,000자/월)
//   - Firebase 캐시로 중복 호출 최소화 → 한도 내 충분히 운용 가능
//   - https://www.deepl.com/pro#developer

const FREE_DICT_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const DEEPL_URL = 'https://api-free.deepl.com/v2/translate';
const TIMEOUT_MS = 4000;

/** fetch에 타임아웃을 적용하는 래퍼 */
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = TIMEOUT_MS,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('request_timeout')),
      timeoutMs,
    );
    fetch(url, options).then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

/**
 * 영단어가 실제 존재하는지 Free Dictionary API로 검증
 * @returns true = 유효한 영단어 / false = 없는 단어
 * @throws 타임아웃 또는 네트워크 오류 시
 */
export async function isValidEnglishWord(word: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `${FREE_DICT_BASE}/${encodeURIComponent(word)}`,
      {},
      TIMEOUT_MS,
    );
    return res.ok; // 200 = 유효, 404 = 없는 단어
  } catch {
    throw new Error('network_error');
  }
}

/**
 * 영단어를 DeepL API로 한국어로 번역
 * @param word 번역할 영단어
 * @param apiKey DeepL API 키 (config.ts에서 주입)
 * @returns 한국어 의미 문자열 or null (실패 시)
 */
export async function translateToKorean(
  word: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      DEEPL_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
        },
        body: JSON.stringify({
          text: [word],
          source_lang: 'EN',
          target_lang: 'KO',
        }),
      },
      TIMEOUT_MS,
    );
    if (!res.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const translated: string | undefined =
      data?.translations?.[0]?.text;
    if (!translated) return null;

    // 번역 결과가 원문과 동일한 경우 (번역 불가) null 처리
    if (translated.toLowerCase() === word.toLowerCase()) return null;

    return translated;
  } catch {
    return null;
  }
}
