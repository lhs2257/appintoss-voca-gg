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
  // Granite Video 래퍼는 onAudioFocusChanged 미제공 시 내부 isFocused=false로 시작하여
  // paused가 항상 true로 고정됨 (deadlock). audioFocused로 포커스 상태를 직접 관리.
  const [audioFocused, setAudioFocused] = useState(true);
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

  // onAudioFocusChanged를 제공해야 Granite Video 래퍼의 deadlock 회피:
  // - 제공 시: paused = !visible || props.paused (포커스 조건 비활성화 → 즉시 재생)
  // - 미제공 시: paused = !visible || props.paused || (!onAudioFocusChanged && !isFocused)
  //              → 초기 isFocused=false이므로 항상 paused=true (절대 재생 안 됨)
  const handleAudioFocus = useCallback((e: AudioFocusEvent) => {
    setAudioFocused(e.hasAudioFocus);
  }, []);

  const canPlay = ready && audioFocused;

  return (
    <AudioCtx.Provider value={{ mode, cycleMode, setInGame, playHighScore }}>
      {children}
      {canPlay && mode === 'bgm1' && !inGame && (
        <Video source={SRC_MAIN_BGM_1} paused={false} repeat
          onAudioFocusChanged={handleAudioFocus} style={AUDIO_STYLE} />
      )}
      {canPlay && mode === 'bgm2' && !inGame && (
        <Video source={SRC_MAIN_BGM_2} paused={false} repeat
          onAudioFocusChanged={handleAudioFocus} style={AUDIO_STYLE} />
      )}
      {canPlay && mode !== 'off' && inGame && (
        <Video source={SRC_GAME_BGM} paused={false} repeat
          onAudioFocusChanged={handleAudioFocus} style={AUDIO_STYLE} />
      )}
      {playHS && (
        <Video source={SRC_HIGH_SCORE} paused={false} repeat={false}
          onAudioFocusChanged={handleAudioFocus}
          onEnd={() => setPlayHS(false)} style={AUDIO_STYLE} />
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
