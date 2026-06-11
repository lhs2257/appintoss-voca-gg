import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Video } from '@granite-js/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  // ready: 초기 렌더에서는 모든 Video를 마운트하지 않음
  // useEffect 이후 true → 조건부 마운트 시 Video가 항상 fresh 인스턴스로 시작
  // (paused=false로 처음부터 마운트 → autoplay 트리거 보장)
  const [ready, setReady] = useState(false);
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

  // 조건부 마운트: Video는 재생해야 할 때만 트리에 존재
  // 조건이 바뀔 때마다 Video가 언마운트→재마운트 → 항상 fresh start로 autoplay
  // (paused prop 전환 방식은 네트워크 소스에서 resume이 안 되는 문제가 있음)
  return (
    <AudioCtx.Provider value={{ mode, cycleMode, setInGame, playHighScore }}>
      {children}
      {ready && mode === 'bgm1' && !inGame && (
        <Video source={SRC_MAIN_BGM_1} paused={false} repeat style={AUDIO_STYLE} />
      )}
      {ready && mode === 'bgm2' && !inGame && (
        <Video source={SRC_MAIN_BGM_2} paused={false} repeat style={AUDIO_STYLE} />
      )}
      {ready && mode !== 'off' && inGame && (
        <Video source={SRC_GAME_BGM} paused={false} repeat style={AUDIO_STYLE} />
      )}
      {playHS && (
        <Video
          source={SRC_HIGH_SCORE}
          paused={false}
          repeat={false}
          onEnd={() => setPlayHS(false)}
          style={AUDIO_STYLE}
        />
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
