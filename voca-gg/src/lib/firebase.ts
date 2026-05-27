// voca.gg - Firebase 설정
// Firebase 콘솔(console.firebase.google.com)에서 앱을 추가하고 아래 설정값을 교체하세요.

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCueNDOO3CFqpRidzCPV0md8K2qDtp1BTk",
  authDomain: "voca-gg.firebaseapp.com",
  databaseURL: "https://voca-gg-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "voca-gg",
  storageBucket: "voca-gg.firebasestorage.app",
  messagingSenderId: "269479810899",
  appId: "1:269479810899:web:4e97ae94a2333686e373a6",
};

// 앱 중복 초기화 방지
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;

export const db = getDatabase(app);
export default app;
