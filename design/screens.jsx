// screens.jsx — voca.gg 5 screens
// Theme: dark + Toss blue accent + neon lime accent for game intensity

const COLORS = {
  bg: '#0B0B0E',
  bgElev: '#16161B',
  bgCard: '#1C1C22',
  bgInput: '#22222A',
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  textDim: 'rgba(255,255,255,0.35)',
  blue: '#3182F6',
  blueDeep: '#1B64DA',
  lime: '#C6F24E',     // neon accent
  red: '#FF4D5E',
  amber: '#FFB23E',
  green: '#22C55E',
};

const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif`;
const FONT_MONO = `"SF Mono", ui-monospace, Menlo, monospace`;

// ─────────────────────────────────────────────────────────────
// Shared chrome — a content wrapper that fills the iOS frame.
// We do NOT pass `title` to IOSDevice (no large nav). We render
// our own headers when needed so we can match the game feel.
// ─────────────────────────────────────────────────────────────
function Screen({ children, padTop = 56, style = {} }) {
  return (
    <div style={{
      minHeight: '100%',
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: FONT,
      paddingTop: padTop,
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. HOME
// ─────────────────────────────────────────────────────────────
function HomeScreen() {
  return (
    <Screen padTop={56}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:'#22222A', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:16, height:16, borderRadius:5, background:COLORS.blue }} />
          </div>
          <span style={{ fontSize:14, color:COLORS.textMuted, fontWeight:600 }}>김보카 님</span>
        </div>
        <div style={{ width:36, height:36, borderRadius:18, background:'#22222A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 22a2 2 0 002-2h-4a2 2 0 002 2zM19 17V11a7 7 0 10-14 0v6l-2 2v1h18v-1l-2-2z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Big logo / wordmark */}
      <div style={{ padding:'32px 20px 12px' }}>
        <div style={{ fontSize:13, fontWeight:600, color:COLORS.blue, letterSpacing:0.6, marginBottom:8, textTransform:'uppercase' }}>
          실시간 영어 단어 대결
        </div>
        <div style={{
          fontSize:54, lineHeight:1, fontWeight:900, letterSpacing:-2.5,
          fontFamily:FONT,
        }}>
          voca<span style={{ color:COLORS.blue }}>.</span>gg
        </div>
        <div style={{ marginTop:10, fontSize:15, color:COLORS.textMuted, fontWeight:500 }}>
          1대1로 단어를 맞춰 점수를 따세요
        </div>
      </div>

      {/* Stats card */}
      <div style={{ padding:'20px 16px 0' }}>
        <div style={{
          background: `linear-gradient(135deg, #1B2540 0%, #16161B 70%)`,
          borderRadius:20, padding:20, position:'relative', overflow:'hidden',
          border:`1px solid ${COLORS.border}`,
        }}>
          {/* decorative ring */}
          <div style={{
            position:'absolute', right:-40, top:-40, width:160, height:160, borderRadius:'50%',
            background: `radial-gradient(circle, rgba(49,130,246,0.25), transparent 70%)`,
          }} />
          <div style={{ fontSize:12, color:COLORS.textMuted, fontWeight:600, letterSpacing:0.4 }}>MY STATS</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:16, marginTop:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:COLORS.textMuted, fontWeight:600 }}>누적 점수</div>
              <div style={{ fontSize:34, fontWeight:800, letterSpacing:-1.4, marginTop:2 }}>
                12,480<span style={{ fontSize:14, color:COLORS.textMuted, marginLeft:4, fontWeight:600 }}>P</span>
              </div>
            </div>
            <div style={{ width:1, height:44, background:'rgba(255,255,255,0.08)' }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:COLORS.textMuted, fontWeight:600 }}>현재 랭킹</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:2 }}>
                <div style={{ fontSize:34, fontWeight:800, letterSpacing:-1.4 }}>#327</div>
                <div style={{ fontSize:12, color:COLORS.lime, fontWeight:700 }}>▲ 12</div>
              </div>
            </div>
          </div>
          <div style={{
            marginTop:16, padding:'10px 12px',
            background:'rgba(255,255,255,0.04)', borderRadius:12,
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:6, height:6, borderRadius:3, background:COLORS.green, boxShadow:`0 0 8px ${COLORS.green}` }} />
              <span style={{ fontSize:13, fontWeight:600 }}>오늘 승률 71%</span>
            </div>
            <span style={{ fontSize:12, color:COLORS.textMuted }}>17승 7패</span>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:'12px 16px 0' }}>
        {[
          { label:'최장 연승', value:'8', unit:'연승' },
          { label:'맞춘 단어', value:'1,204', unit:'개' },
        ].map((s) => (
          <div key={s.label} style={{
            background:COLORS.bgCard, borderRadius:14, padding:'12px 10px',
            border:`1px solid ${COLORS.border}`,
          }}>
            <div style={{ fontSize:10, color:COLORS.textMuted, fontWeight:600 }}>{s.label}</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:3, marginTop:4 }}>
              <span style={{ fontSize:20, fontWeight:800, letterSpacing:-0.5 }}>{s.value}</span>
              <span style={{ fontSize:10, color:COLORS.textMuted }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Spacer pushes buttons down */}
      <div style={{ flex:1, minHeight:24 }} />

      {/* CTAs */}
      <div style={{ padding:'12px 16px 24px', display:'flex', flexDirection:'column', gap:10 }}>
        <button style={{
          height:60, borderRadius:14, border:'none',
          background:COLORS.blue, color:'#fff',
          fontSize:18, fontWeight:800, fontFamily:FONT, letterSpacing:-0.3,
          boxShadow:`0 8px 24px rgba(49,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.18)`,
          cursor:'pointer', position:'relative', overflow:'hidden',
        }}>
          ⚡ 대결 시작
        </button>
        <button style={{
          height:52, borderRadius:14, border:'none',
          background:COLORS.bgCard, color:COLORS.text,
          fontSize:15, fontWeight:700, fontFamily:FONT,
          cursor:'pointer', border:`1px solid ${COLORS.border}`,
        }}>
          랭킹 보기
        </button>
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. MATCHING
// ─────────────────────────────────────────────────────────────
function MatchingScreen() {
  return (
    <Screen padTop={56} style={{ alignItems:'stretch' }}>
      {/* top dismiss row */}
      <div style={{ display:'flex', justifyContent:'flex-end', padding:'8px 16px' }}>
        <button style={{
          width:36, height:36, borderRadius:18, border:'none',
          background:'#22222A', color:COLORS.text, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 1l12 12M13 1L1 13" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px' }}>
        {/* Pulse spinner */}
        <div style={{ position:'relative', width:160, height:160, marginBottom:32 }}>
          <style>{`
            @keyframes vocagg-pulse {
              0% { transform: scale(0.6); opacity: 0.6; }
              100% { transform: scale(1.6); opacity: 0; }
            }
            @keyframes vocagg-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          {[0, 0.7, 1.4].map((d,i) => (
            <div key={i} style={{
              position:'absolute', inset:0, borderRadius:'50%',
              background:`radial-gradient(circle, rgba(49,130,246,0.4), transparent 60%)`,
              border:`2px solid ${COLORS.blue}`,
              animation:`vocagg-pulse 2.1s ${d}s infinite ease-out`,
            }} />
          ))}
          <div style={{
            position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <div style={{
              width:84, height:84, borderRadius:'50%',
              background:`linear-gradient(135deg, ${COLORS.blue}, ${COLORS.blueDeep})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:`0 0 40px rgba(49,130,246,0.6)`,
              fontSize:30, fontWeight:900, letterSpacing:-1, color:'#fff',
            }}>
              vs
            </div>
          </div>
        </div>

        <div style={{ fontSize:24, fontWeight:800, letterSpacing:-0.8, textAlign:'center' }}>
          상대를 찾는 중...
        </div>
        <div style={{ marginTop:10, fontSize:14, color:COLORS.textMuted, textAlign:'center', lineHeight:1.5 }}>
          비슷한 실력의 상대를 매칭하고 있어요
        </div>

        {/* Bot fallback notice */}
        <div style={{
          marginTop:28,
          background:'rgba(198,242,78,0.08)', border:`1px solid rgba(198,242,78,0.2)`,
          borderRadius:14, padding:'12px 14px',
          display:'flex', alignItems:'center', gap:10,
        }}>
          <div style={{
            width:24, height:24, borderRadius:6, background:COLORS.lime,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:13, fontWeight:900, color:'#0B0B0E',
          }}>!</div>
          <div style={{ fontSize:12.5, lineHeight:1.45, color:'rgba(255,255,255,0.85)' }}>
            3초 안에 상대를 못 찾으면 <b style={{ color:COLORS.lime }}>AI 봇</b>과 매칭돼요
          </div>
        </div>

        {/* Pool indicator */}
        <div style={{ marginTop:36, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex' }}>
            {['#3182F6','#C6F24E','#FF7A7A'].map((c,i) => (
              <div key={i} style={{
                width:28, height:28, borderRadius:14, background:c,
                marginLeft: i ? -8 : 0, border:`2px solid ${COLORS.bg}`,
              }} />
            ))}
          </div>
          <span style={{ fontSize:12, color:COLORS.textMuted, fontWeight:600 }}>
            지금 247명이 대기 중
          </span>
        </div>
      </div>

      {/* Cancel */}
      <div style={{ padding:'16px 16px 28px' }}>
        <button style={{
          width:'100%', height:52, borderRadius:14, border:`1px solid ${COLORS.border}`,
          background:COLORS.bgCard, color:COLORS.text,
          fontSize:15, fontWeight:700, fontFamily:FONT, cursor:'pointer',
        }}>
          취소
        </button>
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. GAME — the centerpiece
// ─────────────────────────────────────────────────────────────
function GameScreen({ overlay = false }) {
  // Timer demo state: choose a fraction to show a fixed visual state
  // We'll animate via CSS keyframes so it feels alive without React state.
  return (
    <Screen padTop={56} style={{ paddingTop:0 }}>
      <style>{`
        @keyframes vocagg-timer {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        @keyframes vocagg-timer-color {
          0%, 40% { background: ${COLORS.green}; box-shadow: 0 0 16px ${COLORS.green}; }
          40%, 75% { background: ${COLORS.amber}; box-shadow: 0 0 16px ${COLORS.amber}; }
          75%, 100% { background: ${COLORS.red}; box-shadow: 0 0 16px ${COLORS.red}; }
        }
        @keyframes vocagg-letter-pop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes vocagg-score-up {
          0% { transform: translateY(20px); opacity: 0; }
          15% { transform: translateY(-4px); opacity: 1; }
          70% { transform: translateY(-50px); opacity: 1; }
          100% { transform: translateY(-90px); opacity: 0; }
        }
        @keyframes vocagg-overlay-in {
          0% { opacity: 0; backdrop-filter: blur(0); }
          100% { opacity: 1; backdrop-filter: blur(8px); }
        }
        @keyframes vocagg-word-in {
          0% { transform: scale(0.6) translateY(20px); opacity: 0; }
          60% { transform: scale(1.06) translateY(0); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>

      <div style={{ padding:'52px 16px 0' }}>
        {/* Top bar: round + turn + close */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              padding:'5px 10px', borderRadius:8, background:'rgba(49,130,246,0.15)',
              color:COLORS.blue, fontSize:11, fontWeight:800, letterSpacing:0.6,
            }}>ROUND 1</div>
            <div style={{ fontSize:13, fontWeight:700, color:COLORS.text }}>
              <span style={{ color:COLORS.lime }}>3</span>
              <span style={{ color:COLORS.textMuted }}> / 5 턴</span>
            </div>
          </div>
          <button style={{
            width:32, height:32, borderRadius:10, background:'#22222A', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14"><path d="M1 1l12 12M13 1L1 13" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Players + scores */}
        <div style={{ marginTop:18, display:'flex', alignItems:'center', gap:10 }}>
          <PlayerChip name="박단어" score={20} avatar="#FF7A7A" right={false} />
          <div style={{
            color:COLORS.textDim, fontSize:13, fontWeight:900, letterSpacing:1,
            padding:'3px 8px',
          }}>VS</div>
          <PlayerChip name="나" score={30} avatar={COLORS.blue} right me />
        </div>

        {/* Timer */}
        <div style={{ marginTop:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <span style={{ fontSize:11, fontWeight:700, color:COLORS.textMuted, letterSpacing:0.4 }}>TIME LEFT</span>
            <span style={{ fontFamily:FONT_MONO, fontSize:13, fontWeight:700, color:COLORS.amber }}>2.4s</span>
          </div>
          <div style={{
            height:8, borderRadius:4, background:'rgba(255,255,255,0.06)', overflow:'hidden', position:'relative',
          }}>
            <div style={{
              position:'absolute', left:0, top:0, bottom:0,
              width: overlay ? '48%' : '48%',
              borderRadius:4,
              animation: overlay ? 'none' : 'vocagg-timer 5s linear infinite, vocagg-timer-color 5s linear infinite',
              background: COLORS.amber, boxShadow: `0 0 16px ${COLORS.amber}`,
            }} />
          </div>
        </div>

        {/* Word condition card */}
        <div style={{
          marginTop:22, borderRadius:20, padding:'22px 18px 24px',
          background:`linear-gradient(180deg, #1A1F2E 0%, #16161B 100%)`,
          border:`1px solid rgba(49,130,246,0.18)`,
          position:'relative', overflow:'hidden',
        }}>
          {/* corner badges */}
          <div style={{
            position:'absolute', top:14, left:18, fontSize:10, fontWeight:800, color:COLORS.textMuted, letterSpacing:0.6,
          }}>CONDITION</div>
          <div style={{
            marginTop:18, display:'flex', justifyContent:'center', alignItems:'center', gap:14,
          }}>
            <Letter ch="A" highlight />
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              color:'rgba(255,255,255,0.25)', fontSize:28, fontWeight:900, letterSpacing:2,
            }}>
              <span style={{ width:6, height:6, borderRadius:3, background:'rgba(255,255,255,0.18)' }} />
              <span style={{ width:6, height:6, borderRadius:3, background:'rgba(255,255,255,0.18)' }} />
              <span style={{ width:6, height:6, borderRadius:3, background:'rgba(255,255,255,0.18)' }} />
            </div>
            <Letter ch="E" highlight />
          </div>
          <div style={{
            marginTop:14, textAlign:'center', fontSize:13, color:COLORS.textMuted, fontWeight:500,
          }}>
            A로 시작해서 E로 끝나는 단어
          </div>
        </div>

        {/* Recent submissions feed */}
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:COLORS.textMuted, letterSpacing:0.4, marginBottom:8 }}>RECENT</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <FeedItem who="박단어" word="ABOVE" points={10} mine={false} />
            <FeedItem who="나" word="ACHIEVE" points={14} mine />
            <FeedItem who="박단어" word="ALIVE" points={10} mine={false} />
          </div>
        </div>
      </div>

      <div style={{ flex:1 }} />

      {/* Input area */}
      <div style={{
        padding:'12px 16px 28px',
        background:'linear-gradient(180deg, rgba(11,11,14,0) 0%, rgba(11,11,14,1) 30%)',
      }}>
        <div style={{
          display:'flex', gap:8, alignItems:'center',
          background:COLORS.bgInput, borderRadius:14, padding:'6px 6px 6px 16px',
          border:`1px solid rgba(49,130,246,0.35)`,
          boxShadow:`0 0 0 4px rgba(49,130,246,0.08)`,
        }}>
          <input
            placeholder="단어를 입력하세요"
            defaultValue=""
            style={{
              flex:1, height:42, background:'transparent', border:'none', outline:'none',
              color:COLORS.text, fontSize:17, fontWeight:700, fontFamily:FONT, letterSpacing:0.4,
            }}
          />
          <button style={{
            height:46, padding:'0 18px', borderRadius:10, border:'none',
            background:COLORS.blue, color:'#fff', fontSize:14, fontWeight:800, fontFamily:FONT,
            cursor:'pointer', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.18)',
          }}>제출</button>
        </div>
        <div style={{ marginTop:8, textAlign:'center', fontSize:12, color:COLORS.textMuted, fontWeight:600 }}>
          ⌨️ 내 턴이에요 — 단어를 빠르게 입력하세요
        </div>
      </div>

      {overlay && <SuccessOverlay />}
    </Screen>
  );
}

function PlayerChip({ name, score, avatar, right, me }) {
  return (
    <div style={{
      flex:1, display:'flex', alignItems:'center', gap:10,
      flexDirection: right ? 'row-reverse' : 'row',
      background: me ? 'rgba(49,130,246,0.10)' : COLORS.bgCard,
      border: `1px solid ${me ? 'rgba(49,130,246,0.3)' : COLORS.border}`,
      padding:'8px 12px', borderRadius:14,
    }}>
      <div style={{
        width:36, height:36, borderRadius:12, background:avatar, flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:14, fontWeight:900, color:'#0B0B0E',
      }}>{name[0]}</div>
      <div style={{ flex:1, textAlign: right ? 'right' : 'left', minWidth:0 }}>
        <div style={{ fontSize:11, color:COLORS.textMuted, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name}</div>
        <div style={{ fontSize:20, fontWeight:900, letterSpacing:-0.6, color: me ? COLORS.blue : COLORS.text }}>{score}<span style={{ fontSize:11, color:COLORS.textMuted, marginLeft:3 }}>pt</span></div>
      </div>
    </div>
  );
}

function Letter({ ch, highlight }) {
  const filled = ch !== '_';
  return (
    <div style={{
      width:48, height:60, borderRadius:12,
      background: highlight ? 'rgba(49,130,246,0.16)' : 'rgba(255,255,255,0.03)',
      border: `1.5px solid ${highlight ? COLORS.blue : 'rgba(255,255,255,0.08)'}`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:30, fontWeight:900, letterSpacing:-1,
      color: highlight ? COLORS.blue : COLORS.textDim,
      fontFamily: FONT,
      boxShadow: highlight ? `0 0 24px rgba(49,130,246,0.25)` : 'none',
    }}>
      {filled ? ch : (
        <span style={{ fontSize:24, color:'rgba(255,255,255,0.18)' }}>_</span>
      )}
    </div>
  );
}

function FeedItem({ who, word, points, mine }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'8px 12px', borderRadius:10,
      background: mine ? 'rgba(49,130,246,0.08)' : 'rgba(255,255,255,0.03)',
    }}>
      <span style={{ fontSize:12, fontWeight:700, color: mine ? COLORS.blue : COLORS.textMuted, width:40 }}>
        {mine ? '나' : who}
      </span>
      <span style={{ fontSize:14, fontWeight:800, color:COLORS.text, letterSpacing:0.6, flex:1 }}>{word}</span>
      <span style={{ fontSize:12, fontWeight:700, color:COLORS.green }}>+{points}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. SUCCESS OVERLAY (over game)
// ─────────────────────────────────────────────────────────────
function SuccessOverlay() {
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:100,
      background:'rgba(11,11,14,0.78)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      animation:'vocagg-overlay-in 0.25s ease-out forwards',
    }}>
      {/* Floating +10 */}
      <div style={{
        position:'absolute', top:'34%', left:'50%', transform:'translateX(-50%)',
        fontSize:36, fontWeight:900, color:COLORS.lime,
        textShadow:`0 0 24px rgba(198,242,78,0.6)`,
        animation:'vocagg-score-up 1.4s ease-out infinite',
        letterSpacing:-1,
      }}>
        +10
      </div>

      {/* Check */}
      <div style={{
        width:80, height:80, borderRadius:40,
        background:COLORS.green, display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:`0 0 50px rgba(34,197,94,0.5)`,
        animation:'vocagg-word-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div style={{
        marginTop:24, fontSize:54, fontWeight:900, letterSpacing:2, color:'#fff',
        animation:'vocagg-word-in 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1) backwards',
      }}>
        APPLE
      </div>
      <div style={{
        marginTop:6, fontSize:18, color:COLORS.textMuted, fontWeight:700,
        animation:'vocagg-word-in 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) backwards',
      }}>
        사과
      </div>

      <div style={{
        marginTop:28, padding:'10px 18px', borderRadius:999,
        background:'rgba(198,242,78,0.12)', border:`1px solid rgba(198,242,78,0.35)`,
        fontSize:13, fontWeight:800, color:COLORS.lime, letterSpacing:0.4,
        animation:'vocagg-word-in 0.5s 0.3s cubic-bezier(0.34,1.56,0.64,1) backwards',
      }}>
        2.1초 만에 정답 🎯
      </div>
    </div>
  );
}

function SuccessScreen() {
  // Renders the game with the overlay on top
  return <GameScreen overlay />;
}

// ─────────────────────────────────────────────────────────────
// 5. RESULT
// ─────────────────────────────────────────────────────────────
function ResultScreen() {
  const won = true;
  return (
    <Screen padTop={64}>
      {/* Hero */}
      <div style={{ padding:'12px 20px 0', textAlign:'center' }}>
        <div style={{
          display:'inline-block', padding:'5px 12px', borderRadius:999,
          background: won ? 'rgba(198,242,78,0.12)' : 'rgba(255,77,94,0.12)',
          border:`1px solid ${won ? 'rgba(198,242,78,0.35)' : 'rgba(255,77,94,0.35)'}`,
          fontSize:11, fontWeight:800, letterSpacing:0.8, color: won ? COLORS.lime : COLORS.red,
        }}>
          {won ? 'MATCH FINISHED' : 'GAME OVER'}
        </div>
        <div style={{
          marginTop:18, fontSize:64, fontWeight:900, letterSpacing:-2.4, lineHeight:1,
          color: won ? COLORS.lime : COLORS.red,
          textShadow: won ? `0 0 40px rgba(198,242,78,0.4)` : `0 0 40px rgba(255,77,94,0.4)`,
        }}>
          {won ? 'VICTORY' : 'DEFEAT'}
        </div>
        <div style={{ marginTop:10, fontSize:15, color:COLORS.textMuted, fontWeight:600 }}>
          {won ? '박단어 님을 이겼어요' : '박단어 님에게 졌어요'}
        </div>
      </div>

      {/* Score row */}
      <div style={{
        margin:'24px 16px 0', padding:'18px',
        background:`linear-gradient(180deg, #16161B, #0F0F13)`,
        borderRadius:20, border:`1px solid ${COLORS.border}`,
        display:'flex', alignItems:'center', gap:8,
      }}>
        <ResultPlayer name="나" score={50} winner={won} color={COLORS.blue} mine />
        <div style={{ fontSize:11, fontWeight:900, color:COLORS.textDim, letterSpacing:1, padding:'0 4px' }}>VS</div>
        <ResultPlayer name="박단어" score={40} winner={!won} color={'#FF7A7A'} />
      </div>

      {/* Summary list */}
      <div style={{ margin:'14px 16px 0', borderRadius:18, background:COLORS.bgCard, border:`1px solid ${COLORS.border}`, overflow:'hidden' }}>
        <SummaryRow label="플레이한 라운드" value="3 / 3" />
        <SummaryRow label="제출한 단어" value="14개" />
        <SummaryRow label="정답률" value="86%" accent={COLORS.green} />
        <SummaryRow label="최장 단어" value="EVALUATE (8글자)" />
        <SummaryRow label="획득 점수" value="+50P" accent={COLORS.lime} last />
      </div>

      {/* Rank change */}
      <div style={{ margin:'10px 16px 0', padding:'12px 14px', borderRadius:14,
        background:'rgba(198,242,78,0.06)', border:`1px solid rgba(198,242,78,0.15)`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div>
          <div style={{ fontSize:11, color:COLORS.textMuted, fontWeight:600 }}>랭킹 변동</div>
          <div style={{ fontSize:18, fontWeight:800, marginTop:2 }}>#339 → <span style={{ color:COLORS.lime }}>#327</span></div>
        </div>
        <div style={{
          padding:'6px 10px', borderRadius:8, background:COLORS.lime,
          fontSize:13, fontWeight:900, color:'#0B0B0E', letterSpacing:0.3,
        }}>▲ 12</div>
      </div>

      <div style={{ flex:1, minHeight:16 }} />

      {/* CTAs */}
      <div style={{ padding:'12px 16px 28px', display:'flex', flexDirection:'column', gap:10 }}>
        <button style={{
          height:58, borderRadius:14, border:'none',
          background:COLORS.blue, color:'#fff',
          fontSize:17, fontWeight:800, fontFamily:FONT, letterSpacing:-0.3,
          boxShadow:`0 8px 24px rgba(49,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.18)`,
          cursor:'pointer',
        }}>
          다시 대결
        </button>
        <button style={{
          height:50, borderRadius:14, border:`1px solid ${COLORS.border}`,
          background:COLORS.bgCard, color:COLORS.text,
          fontSize:15, fontWeight:700, fontFamily:FONT, cursor:'pointer',
        }}>
          홈으로
        </button>
      </div>
    </Screen>
  );
}

function ResultPlayer({ name, score, winner, color, mine }) {
  return (
    <div style={{
      flex:1, padding:'14px 10px', borderRadius:14,
      background: winner ? 'rgba(198,242,78,0.06)' : 'transparent',
      border: winner ? '1px solid rgba(198,242,78,0.25)' : '1px solid transparent',
      textAlign:'center', position:'relative',
    }}>
      {winner && (
        <div style={{
          position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)',
          padding:'2px 8px', borderRadius:999, background:COLORS.lime,
          fontSize:10, fontWeight:900, color:'#0B0B0E', letterSpacing:0.4,
        }}>WINNER</div>
      )}
      <div style={{
        width:44, height:44, borderRadius:14, background:color, margin:'0 auto',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:16, fontWeight:900, color:'#0B0B0E',
      }}>{name[0]}</div>
      <div style={{ marginTop:8, fontSize:13, color:COLORS.textMuted, fontWeight:600 }}>{name}</div>
      <div style={{ marginTop:2, fontSize:28, fontWeight:900, letterSpacing:-1, color: winner ? COLORS.lime : COLORS.text }}>
        {score}<span style={{ fontSize:11, color:COLORS.textMuted, marginLeft:2, fontWeight:700 }}>pt</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, accent, last }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'12px 16px',
      borderBottom: last ? 'none' : `1px solid ${COLORS.border}`,
    }}>
      <span style={{ fontSize:13, color:COLORS.textMuted, fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:14, fontWeight:800, color: accent || COLORS.text }}>{value}</span>
    </div>
  );
}

Object.assign(window, {
  HomeScreen, MatchingScreen, GameScreen, SuccessScreen, ResultScreen,
  VOCAGG_COLORS: COLORS,
});
