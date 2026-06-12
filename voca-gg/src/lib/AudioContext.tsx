import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Video, type VideoProps } from '@granite-js/react-native';
import { Storage } from '@apps-in-toss/framework';

type AudioFocusEvent = Parameters<NonNullable<VideoProps['onAudioFocusChanged']>>[0];

export type AudioMode = 'bgm1' | 'bgm2' | 'off';

const AUDIO_MODE_KEY = '@vocagg/audio_mode';

// GitHub Releases URL은 Content-Disposition: attachment로 인해 iOS AVFoundation에서 재생 불가
// raw.githubusercontent.com은 redirect 없이 직접 파일 제공
const BASE = 'https://raw.githubusercontent.com/lhs2257/appintoss-voca-gg/main/voca-gg/audio';
const SRC_MAIN_BGM_1 = { uri: `${BASE}/main_BGM_1.mp3` };
const SRC_MAIN_BGM_2 = { uri: `${BASE}/main_BGM_2.mp3` };
const SRC_GAME_BGM   = { uri: `${BASE}/game_BGM.mp3` };

interface AudioContextValue {
  mode: AudioMode;
  cycleMode: () => void;
  setInGame: (v: boolean) => void;
}

const AudioCtx = createContext<AudioContextValue>({
  mode: 'bgm1',
  cycleMode: () => {},
  setInGame: () => {},
});

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AudioMode>('bgm1');
  const [inGame, setInGameState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Storage.getItem(AUDIO_MODE_KEY)
      .then((v) => {
        if (v === 'bgm1' || v === 'bgm2' || v === 'off') {
          setMode(v as AudioMode);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const cycleMode = useCallback(() => {
    setMode((prev) => {
      const next: AudioMode =
        prev === 'bgm1' ? 'bgm2' : prev === 'bgm2' ? 'off' : 'bgm1';
      Storage.setItem(AUDIO_MODE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const setInGame = useCallback((v: boolean) => setInGameState(v), []);

  // onAudioFocusChanged는 Granite Video deadlock 회피용으로 반드시 제공 (no-op)
  const noop = useCallback((_e: AudioFocusEvent) => {}, []);
  const onErr = useCallback((e: any) => {
    console.warn('[AudioContext] Video onError', JSON.stringify(e?.error ?? e));
  }, []);

  console.log('[AudioContext] render — ready:', ready, 'mode:', mode, 'inGame:', inGame);

  return (
    <AudioCtx.Provider value={{ mode, cycleMode, setInGame }}>
      {children}
      {ready && mode === 'bgm1' && !inGame && (
        <Video source={SRC_MAIN_BGM_1} paused={false} repeat
          onAudioFocusChanged={noop} onError={onErr} style={AUDIO_STYLE} />
      )}
      {ready && mode === 'bgm2' && !inGame && (
        <Video source={SRC_MAIN_BGM_2} paused={false} repeat
          onAudioFocusChanged={noop} onError={onErr} style={AUDIO_STYLE} />
      )}
      {ready && mode !== 'off' && inGame && (
        <Video source={SRC_GAME_BGM} paused={false} repeat
          onAudioFocusChanged={noop} onError={onErr} style={AUDIO_STYLE} />
      )}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  return useContext(AudioCtx);
}

const AUDIO_STYLE = {
  position: 'absolute' as const,
  width: 1,
  height: 1,
  opacity: 0,
  top: -10,
  left: -10,
};
