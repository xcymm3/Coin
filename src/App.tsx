import { useEffect, useRef, useState } from 'react';
import { autoInterval, forgeCost, initialState, materialNames, splitterCost, splitterName } from './game';
import type { GameState, Target } from './game';
import { Scene } from './scene';

function CoinIcon({ small = false }: { small?: boolean }) { return <span className={`coin-icon ${small ? 'small' : ''}`} aria-hidden="true"><i /></span>; }
function SoundIcon({ muted }: { muted: boolean }) { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" />{muted ? <path d="m16 9 6 6m0-6-6 6" /> : <><path d="M15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14" /></>}</svg>; }
function Bars({ value, total, green = false }: { value: number; total: number; green?: boolean }) { return <div className={`bars ${green ? 'green' : ''}`} aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <i key={i} className={value / total > i / 20 ? 'filled' : ''} />)}</div>; }
function elapsed(seconds: number) { const whole = Math.floor(seconds + 0.000001); return `${Math.floor(whole / 60).toString().padStart(2, '0')}:${(whole % 60).toString().padStart(2, '0')}`; }

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null), scene = useRef<Scene | null>(null);
  const [s, setState] = useState<GameState>(initialState);
  const [muted, setMuted] = useState(false), [help, setHelp] = useState(false), [best, setBest] = useState(0);
  const helpButton = useRef<HTMLButtonElement>(null), helpDialog = useRef<HTMLDialogElement>(null);
  const resumeAfterHelp = useRef(false);
  useEffect(() => {
    const engine = new Scene(canvasRef.current!, setState); scene.current = engine;
    try { setBest(Number(localStorage.getItem('last-coin-best')) || 0); } catch { /* Storage is optional. */ }
    return () => { engine.destroy(); scene.current = null; };
  }, []);
  useEffect(() => { if (scene.current) scene.current.audio.muted = muted; }, [muted]);
  useEffect(() => {
    if (s.status === 'failed') {
      setBest(previous => { const value = Math.max(previous, s.elapsed); try { localStorage.setItem('last-coin-best', String(value)); } catch { /* Game continues without persistence. */ } return value; });
    }
  }, [s.status, s.elapsed]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (help || event.target instanceof HTMLButtonElement || event.target instanceof HTMLSelectElement || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); scene.current?.pause(); }
      if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) scene.current?.fireSelected(); }
      const target: Record<string, Target> = { Digit1: 'forge', Digit2: 'clock', Digit3: 'splitter' };
      if (target[event.code]) { event.preventDefault(); scene.current?.select(target[event.code]); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [help]);
  function openHelp() {
    resumeAfterHelp.current = scene.current?.state.status === 'playing';
    if (resumeAfterHelp.current) scene.current?.pause();
    setHelp(true); helpDialog.current?.showModal();
  }
  function closeHelp() {
    helpDialog.current?.close(); setHelp(false);
    if (resumeAfterHelp.current) scene.current?.start();
    helpButton.current?.focus();
  }
  function begin(restart = false) { if (restart) scene.current?.restart(); else scene.current?.start(); canvasRef.current?.focus(); }
  const danger = s.time < 30, critical = s.time < 10;
  const statusText = { ready: '等待接入', playing: '运行中', paused: '已暂停', failed: '信号丢失' }[s.status];
  const forgePhase = ['冷炉点火', '铜料熔化', '模具合拢', '冲压成形'][Math.min(3, Math.floor(s.forge / forgeCost(s) * 4))];
  return <div className="app-shell">
    <header className="masthead">
      <a className="brand" href="#" onClick={e => e.preventDefault()} aria-label="最后一枚"><CoinIcon /><span><strong>最后一枚<span className="brand-dot">.</span></strong><small>THE LAST COIN</small></span></a>
      <div className="header-center"><span className="signal-dot" /> 避难所 07 <span className="slash">/</span> 地下三层</div>
      <div className="header-actions"><span className="demo-tag">PROTOTYPE 0.1</span><button className="icon-button" aria-label={muted ? '开启声音' : '关闭声音'} aria-pressed={muted} onClick={() => { setMuted(!muted); scene.current?.audio.unlock(); }}><SoundIcon muted={muted} /></button><button className="icon-button help-button" aria-label="操作说明" onClick={openHelp} ref={helpButton}>?</button></div>
    </header>

    <main>
      <div className="page-heading"><div><div className="eyebrow">SURVIVAL IS A MATTER OF SECONDS</div><h1>再争取一秒。</h1></div><p>门外是末日。桌上，还有机会。</p></div>
      <div className="workbench">
        <section className="play-column" aria-label="投币工作台">
          <div className={`viewport ${critical && s.status === 'playing' ? 'critical' : ''}`}>
            <div className="viewport-bar"><span><i className={`signal-dot ${s.status === 'failed' ? 'lost' : ''}`} /> B-07 <span className="bar-separator">/</span> 工作台视野</span><div><span className="live-label">{statusText}</span><span className="frame-mark">[ LIVE FEED ]</span></div></div>
            <div className="scene-wrap">
              <canvas ref={canvasRef} tabIndex={0} aria-label="像素地堡工作台。左侧是铸币熔炉，中央是续命发条，右侧是机械分流器。点击设备发射铜币，也可按 1、2、3 选择设备，按空格发射。" />
              <div className="scene-vignette" /><div className="scanlines" />
              <div className="scene-coordinates" aria-hidden="true"><span>CAM_01 · FIXED PERSPECTIVE</span><span>地下 -30 m</span></div>
              {s.status === 'ready' && <div className="start-panel"><span className="start-kicker">值班员，欢迎回来。</span><h2>用铜币，让这间屋子继续呼吸。</h2><p>先向右侧分流器射击 10 次，展开第二根发射管。</p><button className="primary" onClick={() => begin()}><span>启动工作台</span><span aria-hidden="true">↗</span></button><span className="start-note">启动后开始倒计时 · 铜币无限供应</span></div>}
              {s.status === 'paused' && !help && <div className="state-overlay"><div className="state-panel"><span className="eyebrow">CONNECTION ON HOLD</span><h2>喘口气。</h2><p>倒计时与铜币都已暂停。</p><button className="primary" onClick={() => begin()}>继续值班 <span aria-hidden="true">▷</span></button></div></div>}
              {s.status === 'failed' && <div className="state-overlay failure"><div className="state-panel"><span className="eyebrow">SIGNAL LOST / B-07</span><h2>最后一秒，耗尽了。</h2><p>应急发条停转，防爆门失守。</p><div className="failure-stats"><div><strong>{elapsed(s.elapsed)}</strong><span>本次生存</span></div><div><strong>{s.shots}</strong><span>发射铜币</span></div><div><strong>{s.upgrades}</strong><span>完成改装</span></div></div><button className="primary" onClick={() => begin(true)}>再值一次班 <span aria-hidden="true">↻</span></button><small>下一次，别忘了给中央的发条续命。</small></div></div>}
            </div>
            <div className="viewport-footer"><span><span className="mouse-icon" aria-hidden="true" /> 左键发射 <i /> 移动鼠标 · 轻微转头</span><button className="text-button" disabled={s.status === 'ready' || s.status === 'failed'} onClick={() => scene.current?.pause()}>{s.status === 'paused' ? '▷ 继续' : 'Ⅱ 暂停'} <kbd>P</kbd></button></div>
          </div>
          <div className="loadout">
            <div className="ammo-art"><CoinIcon /></div><div className="ammo-info"><span className="eyebrow">当前装填</span><strong>{materialNames[Math.min(s.level, 3)]}币 <span>MK.{String(s.level + 1).padStart(2, '0')}</span></strong><small>设备进度 +{2 ** s.level} / 枚</small></div>
            <div className="loadout-stat"><span>齐射数量</span><strong>{String(s.volley).padStart(2, '0')} <small>枚 / 次</small></strong></div><div className="loadout-stat"><span>累计发射</span><strong>{s.shots.toLocaleString()} <small>枚</small></strong></div><div className="supply"><span className="signal-dot" /> 无限供应</div>
          </div>
          <div className="event-log" aria-live="polite"><span className="log-prefix">SYS &gt;</span><p key={s.message}>{s.message}</p><span className="blinking-cursor" aria-hidden="true">_</span></div>
        </section>

        <aside className="sidebar" aria-label="设备状态">
          <section className={`countdown-panel ${danger ? 'danger' : ''}`} aria-label="灾难日倒计时"><div className="section-label"><span><span className="warning-symbol">△</span> 灾难日倒计时</span><span className="tag">{s.status === 'failed' ? '失守' : danger ? '危险' : '维持中'}</span></div><div className="timer"><strong data-testid="countdown">{String(Math.ceil(s.time)).padStart(3, '0')}</strong><span>SEC<br /><small>剩余时间</small></span></div><Bars value={Math.min(s.time, 100)} total={100} green /><div className="timer-foot"><span>自然消耗 −1 / 秒</span><strong>命中 +1 秒</strong></div></section>
          <div className="devices-heading"><span>工作台设备</span><small>02 MODULES</small></div>
          <section className="device forge-device"><div className="device-title"><span className="device-number">01</span><div><h2>铸币熔炉</h2><span>弹体升级</span></div><span className="tiny-mark" aria-hidden="true">▤</span></div><div className="device-description">{forgePhase}<span>→ {materialNames[Math.min(s.level + 1, 3)]}币</span></div><Bars value={s.forge} total={forgeCost(s)} /><div className="progress-caption"><strong data-testid="forge-progress">{s.forge.toLocaleString()} <span>/ {forgeCost(s).toLocaleString()}</span></strong><span>命中进度</span></div><div className="device-benefit"><span>改装效果</span><strong>设备命中效率 ×{2 ** (s.level + 1)}</strong></div></section>
          <section className="device splitter-device"><div className="device-title"><span className="device-number">03</span><div><h2>机械分流器</h2><span>{s.stage < 2 ? '齐射升级' : '自动化升级'}</span></div><span className="tiny-mark" aria-hidden="true">⑂</span></div><div className="device-description">下一项改装<span>{splitterName(s)}</span></div><div className="physical-slots" aria-label={`改装进度 ${s.splitter}/${splitterCost(s)}`}>{Array.from({ length: 10 }, (_, i) => <i key={i} className={s.splitter / splitterCost(s) >= (i + 1) / 10 ? 'loaded' : ''} />)}</div><div className="progress-caption"><strong data-testid="splitter-progress">{s.splitter} <span>/ {splitterCost(s)}</span></strong><span>命中进度</span></div><div className="device-benefit"><span>改装效果</span><strong>{s.stage < 2 ? `每次发射 ${s.volley + 1} 枚铜币` : `每 ${(2 / (s.autoLevel + 1)).toFixed(1)} 秒自动齐射`}</strong></div></section>
          {s.autoLevel > 0 ? <div className="auto-control"><label htmlFor="auto-target"><span className="signal-dot" /> 自动供币 · 每 {autoInterval(s).toFixed(1)} 秒</label><select id="auto-target" value={s.autoTarget} onChange={e => scene.current?.setAutoTarget(e.target.value as Target)}><option value="forge">铸币熔炉</option><option value="clock">应急发条</option><option value="splitter">机械分流器</option></select></div> : <div className="hint"><span aria-hidden="true">↳</span><p>先解锁双发，再兼顾升级与续命。<br /><span>每一枚命中的铜币都算数。</span></p></div>}
        </aside>
      </div>
      <footer className="page-footer"><span><span className="signal-dot" /> SHELTER SYSTEMS <span className="footer-id">/ B-07</span></span><div><span>本次生存 <b>{elapsed(s.elapsed)}</b></span><span>最长记录 <b>{elapsed(best)}</b></span></div><span className="footer-motto">只要齿轮还在转。</span></footer>
    </main>
    <dialog ref={helpDialog} onCancel={e => { e.preventDefault(); closeHelp(); }} className="help-dialog"><button className="dialog-close icon-button" onClick={closeHelp} aria-label="关闭说明">×</button><span className="eyebrow">OPERATOR'S MANUAL / 07</span><h2>值班手册</h2><p>向设备发射铜币，让工作台维持运转。</p><dl><dt><kbd>鼠标</kbd></dt><dd>移动瞄准，左右轻微转头；左键点击发射。</dd><dt><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></dt><dd>选择熔炉、发条、分流器，再按空格发射。</dd><dt><kbd>P</kbd> / <kbd>Esc</kbd></dt><dd>暂停或继续。切换到后台会自动暂停。</dd></dl><div className="manual-rules"><p><strong>01 / 铸币熔炉</strong>初始需要 1000 点进度。升级后，单枚铜币提供的设备进度翻倍，下一等级需求翻倍。</p><p><strong>02 / 应急发条</strong>从 100 秒开始，每秒消耗 1 秒；每枚命中始终 +1 秒。归零立即失败。</p><p><strong>03 / 机械分流器</strong>固定顺序：10 点解锁双发 → 50 点解锁三发 → 150 点解锁自动供币 → 继续加速自动供币。</p></div><p className="manual-note">铜币需要飞行时间。请提前续命。首次玩建议先升级右侧分流器。</p><button className="primary" onClick={closeHelp}>明白，回到工作台 <span aria-hidden="true">↗</span></button></dialog>
  </div>;
}
