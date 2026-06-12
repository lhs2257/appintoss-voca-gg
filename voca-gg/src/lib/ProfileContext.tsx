import React, { createContext, useCallback, useContext, useState } from 'react';
import { DEFAULT_AVATAR_COLOR } from './theme';
import type { UserStats } from './types';

interface ProfileValue {
  uid: string;
  nickname: string;
  color: string;
  loaded: boolean;
  initProfile: (uid: string, stats: UserStats) => void;
  refreshProfile: (stats: UserStats) => void;
}

const ProfileCtx = createContext<ProfileValue>({
  uid: '',
  nickname: '',
  color: DEFAULT_AVATAR_COLOR,
  loaded: false,
  initProfile: () => {},
  refreshProfile: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState('');
  const [nickname, setNickname] = useState('');
  const [color, setColor] = useState(DEFAULT_AVATAR_COLOR);
  const [loaded, setLoaded] = useState(false);

  const initProfile = useCallback((resolvedUid: string, stats: UserStats) => {
    setUid(resolvedUid);
    setNickname(stats.displayName);
    setColor(stats.color ?? DEFAULT_AVATAR_COLOR);
    setLoaded(true);
  }, []);

  const refreshProfile = useCallback((stats: UserStats) => {
    setNickname(stats.displayName);
    setColor(stats.color ?? DEFAULT_AVATAR_COLOR);
  }, []);

  return (
    <ProfileCtx.Provider value={{ uid, nickname, color, loaded, initProfile, refreshProfile }}>
      {children}
    </ProfileCtx.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileCtx);
}
