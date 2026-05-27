// app.jsx — voca.gg multi-screen preview shell

const SCREENS = [
  { id: 'home',     label: '홈',           comp: HomeScreen },
  { id: 'match',    label: '매칭',         comp: MatchingScreen },
  { id: 'game',     label: '게임',         comp: GameScreen },
  { id: 'success',  label: '단어 성공',    comp: SuccessScreen },
  { id: 'result',   label: '결과',         comp: ResultScreen },
];

function App() {
  const [active, setActive] = React.useState('home');
  const Comp = SCREENS.find(s => s.id === active).comp;
  const C = window.VOCAGG_COLORS;

  // The iOS frame needs to live in a relative container so the SuccessOverlay
  // (absolute, inset:0) can fill the screen area cleanly.
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      padding: '24px 16px 32px',
      fontFamily: '-apple-system, system-ui, sans-serif',
      color: '#fff',
    }}>
      {/* Header */}
      <div style={{ width:'100%', maxWidth:520, marginBottom:18 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:22, fontWeight:900, letterSpacing:-1 }}>voca<span style={{ color:C.blue }}>.</span>gg</span>
          <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.4)' }}>· UI 시안</span>
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>
          토스 미니앱 · 실시간 1대1 영어 단어 대결 · 375×812
        </div>
      </div>

      {/* Tabs */}
      <div data-screen-label="Tab Switcher" style={{
        display:'flex', gap:6, marginBottom:20, padding:4,
        background:'#111', borderRadius:14, border:'1px solid rgba(255,255,255,0.06)',
        flexWrap:'wrap', justifyContent:'center',
      }}>
        {SCREENS.map((s, i) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              style={{
                padding:'8px 14px', borderRadius:10, border:'none',
                background: isActive ? C.blue : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                fontSize:13, fontWeight: isActive ? 800 : 600,
                cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', gap:6,
              }}>
              <span style={{
                fontSize:10, fontWeight:800,
                opacity: isActive ? 0.85 : 0.5,
                fontFamily:'"SF Mono", ui-monospace, monospace',
              }}>{String(i+1).padStart(2,'0')}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Device frame */}
      <div data-screen-label={SCREENS.find(s => s.id === active).label} style={{ position:'relative' }}>
        <IOSDevice width={375} height={812} dark>
          <div style={{ position:'relative', width:'100%', height:'100%' }}>
            <Comp />
          </div>
        </IOSDevice>
      </div>

      {/* Footer hint */}
      <div style={{ marginTop:16, fontSize:11, color:'rgba(255,255,255,0.35)' }}>
        탭을 눌러 화면을 전환하세요
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
