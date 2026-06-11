import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Video, type VideoProps } from '@granite-js/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AudioFocusEvent = Parameters<NonNullable<VideoProps['onAudioFocusChanged']>>[0];

export type AudioMode = 'bgm1' | 'bgm2' | 'off';

const AUDIO_MODE_KEY = '@vocagg/audio_mode';

const BASE = 'https://github.com/lhs2257/appintoss-voca-gg/releases/download/audio-assets';
const SRC_MAIN_BGM_1 = { uri: `${BASE}/main_BGM_1.mp3` };
const SRC_MAIN_BGM_2 = { uri: `${BASE}/main_BGM_2.mp3` };
const SRC_GAME_BGM   = { uri: `${BASE}/game_BGM.mp3` };
const SRC_HIGH_SCORE = { uri: `${BASE}/high_score.mp3` };

interface AudioContextValue {
  mode: AudioMode;
  cycleMode: () => void;
  setInGame: (v: boolean) => void;
  playHighScore: () => void;
}

const AudioCtx = createContext<AudioContextValue>({
  mode: 'bgm1',
  cycleMode: () => {},
  setInGame: () => {},
  playHighScore: () => {},
});

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AudioMode>('bgm1');
  const [inGame, setInGameState] = useState(false);
  const [playHS, setPlayHS] = useState(false);
  const [ready, setReady] = useState(false);
  // SFX 종료 후 BGM을 강제 재마운트해 오디오 포커스를 재획득시키기 위한 키
  const [bgmKey, setBgmKey] = useState(0);
  const modeRef = useRef<AudioMode>('bgm1');
  modeRef.current = mode;

  useEffect(() => {
    AsyncStorage.getItem(AUDIO_MODE_KEY)
      .then((v) => {
        if (v === 'bgm1' || v === 'bgm2' || v === 'off') {
          setMode(v as AudioMode);
        }
      })
      .catch(() => {});
    setReady(true);
  }, []);

  const cycleMode = useCallback(() => {
    setMode((prev) => {
      const next: AudioMode =
        prev === 'bgm1' ? 'bgm2' : prev === 'bgm2' ? 'off' : 'bgm1';
      AsyncStorage.setItem(AUDIO_MODE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const setInGame = useCallback((v: boolean) => setInGameState(v), []);

  const playHighScore = useCallback(() => {
    if (modeRef.current !== 'off') setPlayHS(true);
  }, []);

  // SFX 종료 시: SFX 언마운트 + BGM 재마운트(key 변경)로 오디오 포커스 재획득
  // 모바일 네이티브 오디오 세션은 기본적으로 단일 포커스만 허용하므로 SFX 재생 중
  // BGM이 중단됨. SFX 종료 후 BGM key를 바꿔 신규 마운트로 포커스를 되돌림.
  const handleSfxEnd = useCallback(() => {
    setPlayHS(false);
    setBgmKey((k) => k + 1);
  }, []);

  // onAudioFocusChanged는 Granite Video deadlock 회피용으로 반드시 제공 (no-op)
  // 제공 시: paused = !visible || props.paused (isFocused 조건 비활성화)
  // 미제공 시: paused = !visible || props.paused || (!onAudioFocusChanged && !isFocused)
  //            → 초기 isFocused=false이므로 항상 paused=true
  const noop = useCallback((_e: AudioFocusEvent) => {}, []);

  return (
    <AudioCtx.Provider value={{ mode, cycleMode, setInGame, playHighScore }}>
      {children}
      {ready && mode === 'bgm1' && !inGame && (
        <Video key={bgmKey} source={SRC_MAIN_BGM_1} paused={false} repeat
          onAudioFocusChanged={noop} style={AUDIO_STYLE} />
      )}
      {ready && mode === 'bgm2' && !inGame && (
        <Video key={bgmKey} source={SRC_MAIN_BGM_2} paused={false} repeat
          onAudioFocusChanged={noop} style={AUDIO_STYLE} />
      )}
      {ready && mode !== 'off' && inGame && (
        <Video key={bgmKey} source={SRC_GAME_BGM} paused={false} repeat
          onAudioFocusChanged={noop} style={AUDIO_STYLE} />
      )}
      {playHS && (
        <Video source={SRC_HIGH_SCORE} paused={false} repeat={false}
          onAudioFocusChanged={noop}
          onEnd={handleSfxEnd} style={AUDIO_STYLE} />
      )}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  return useContext(AudioCtx);
}

const AUDIO_STYLE = {
  position: 'absolute' as const,
  width: 0,
  height: 0,
  opacity: 0,
};
