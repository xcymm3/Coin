import { useEffect, useRef, useState } from 'react';
import { Scene } from './world';
import type { SceneView } from './world';
import { autoRate, capacity, chapter, chapters, clockGain, cost, DAWN_TIME, devices, drain, effect, initialState, netDrain, power, readSave, recommendation, SAVE_KEY, TARGETS, timeLabel, unlocked, volley, waveActive } from './rules';
import type { Device, GameState, Target } from './rules';

function Sigil({ className = '' }: { className?: string }) { return <svg className={className} viewBox="0 0 180 138" fill="none" aria-hidden="true"><path d="M90 6 130 70 90 123 50 70 90 6Z" stroke="currentColor" opacity=".45"/><circle cx="90" cy="70" r="42" stroke="currentColor" opacity=".6"/><path d="M30 70Q90 7 150 70Q90 133 30 70Z" stroke="currentColor"/><path d="M90 41Q74 70 90 99Q106 70 90 41Z" fill="currentColor"/><path d="m20 111 140-81M20 30l140 81M90 0v22M90 117v21M0 70h29m122 0h29" stroke="currentColor" opacity=".4"/><path d="m25 27-4-9m4 9-10-1m140 1 4-9m-4 9 10-1M25 114l-4 9m4-9-10 1m140-1 4 9m-4-9 10 1" stroke="currentColor"/></svg>; }

export default function NightGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null), engine = useRef<Scene | null>(null);
  const [s, setState] = useState(initialState), [view, setView] = useState<SceneView>({ hovered: null, points: {}, ready: false });
  const [muted, setMuted] = useState(false), [help, setHelp] = useState(false), [error, setError] = useState('');
  const [saved, setSaved] = useState<GameState | null>(null), [best, setBest] = useState(0), [selected, setSelected] = useState<Target>('splitter');
  const dialog = useRef<HTMLDialogElement>(null), helpTrigger = useRef<HTMLButtonElement>(null), resumeHelp = useRef(false), lastSave = useRef(-1);
  useEffect(() => {
    try { setSaved(readSave(localStorage.getItem(SAVE_KEY))); setBest(Number(localStorage.getItem('last-coin-best')) || 0); } catch { /* Persistence is optional. */ }
    try { engine.current = new Scene(canvasRef.current!, setState, setView, setError); }
    catch (e) { setError(`圣约视野未能建立。请开启浏览器硬件加速后重新载入。${e instanceof Error ? `（${e.message}）` : ''}`); }
    return () => { engine.current?.destroy(); engine.current = null; };
  }, []);
  useEffect(() => { if (engine.current) engine.current.audio.muted = muted; }, [muted]);
  useEffect(() => {
    try {
      if (s.status === 'playing' || (s.status === 'paused' && s.guide >= 4)) {
        const bucket = Math.floor(s.elapsed / 5);
        if (bucket !== lastSave.current || s.status === 'paused') { localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 2, state: s })); lastSave.current = bucket; }
      }
      if (s.status === 'failed' || s.status === 'won') {
        localStorage.removeItem(SAVE_KEY); const record = Math.max(best, s.elapsed); localStorage.setItem('last-coin-best', String(record)); if (record !== best) setBest(record);
      }
    } catch { /* Private browsing must not interrupt play. */ }
  }, [s, best]);
  function choose(target: Target) { setSelected(target); engine.current?.select(target); canvasRef.current?.focus({ preventScroll: true }); }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (help || event.ctrlKey || event.metaKey || event.altKey || event.target instanceof HTMLSelectElement) return;
      if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); if (!event.repeat) engine.current?.pause(); return; }
      if (event.target instanceof HTMLButtonElement) return;
      if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) engine.current?.fireSelected(); }
      const index = Number(event.code.replace('Digit', '')) - 1;
      if (event.code.startsWith('Digit') && TARGETS[index] && unlocked(engine.current?.state || s, TARGETS[index])) { event.preventDefault(); choose(TARGETS[index]); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [help, s.status]);
  function openHelp() { const status = engine.current?.state.status; resumeHelp.current = status === 'playing' || status === 'tutorial'; if (resumeHelp.current) engine.current?.pause(); setHelp(true); dialog.current?.showModal(); }
  function closeHelp() { dialog.current?.close(); setHelp(false); if (resumeHelp.current) engine.current?.resume(); helpTrigger.current?.focus(); }
  function start(tutorial = false) { lastSave.current = -1; if (tutorial) engine.current?.startTutorial(); else engine.current?.start(); canvasRef.current?.focus(); }
  function restart() { lastSave.current = -1; engine.current?.restart(); canvasRef.current?.focus(); }
  const urgent = s.time / netDrain(s) < 25, wave = s.status === 'playing' && waveActive(s), chapterIndex = chapter(s);
  const focus = view.hovered || selected, goal = recommendation(s), progress = Math.min(100, s.elapsed / DAWN_TIME * 100);
  const guidePoint = view.points[goal.target];
  return <div className="night-app">
    <header className="night-header"><a href="#" onClick={e => e.preventDefault()} className="night-brand"><span className="brand-seal">✥</span><span>最后一枚<small>THE LAST COIN · VIGIL</small></span></a><span className="place-name">失落圣堂 <i /> 第七避难所</span><div className="night-tools"><span className="edition">第二契约 / II</span><button onClick={() => { setMuted(!muted); engine.current?.audio.unlock(); }} aria-label={muted ? '开启声音' : '关闭声音'} aria-pressed={muted}>{muted ? '静音' : '声音'}</button><button ref={helpTrigger} onClick={openHelp} aria-label="守夜手册">手册</button><button onClick={() => engine.current?.pause()} disabled={['ready', 'won', 'failed'].includes(s.status)} aria-label={s.status === 'paused' ? '继续守夜' : '暂停守夜'}>{s.status === 'paused' ? '继续' : '暂停'} <kbd>P</kbd></button></div></header>
    <main>
      <div className="night-title"><div><span className="overline">A COVENANT AGAINST THE DARK</span><h1>长夜未尽，<span>莫让丧钟归零。</span></h1></div><p>献上铜币。守住烛火。等一个真正的黎明。</p></div>
      <div className="night-layout">
        <section className={`sanctuary ${wave ? 'under-siege' : ''}`} aria-label="三维圣堂与圣约机">
          <div className="scene-topline"><span><i className="living-dot" /> {s.status === 'tutorial' || s.status === 'ready' ? '临时庇护 · 等待契约' : chapters[chapterIndex].name}</span><span>{wave ? '门外之物正在撞击结界' : 'SANCTUARY / VII'}</span></div>
          <div className="world-frame">
            <canvas ref={canvasRef} tabIndex={0} aria-label="真实三维圣堂，手持铸币枪。左侧为铸币炉和分魂祭器，最右侧是丧钟。鼠标点击或按住发射；数字一至七选择祭器，空格开枪。" />
            <div className="world-shade" />
            {view.ready && !error && <div className="view-corners" aria-hidden="true"><span>✧ 北廊 · 无人圣堂</span><span>庇护契约 0007</span></div>}
            {!view.ready && !error && <div className="world-loading">正在建立圣约视野……</div>}
            {error && <div className="world-error" role="alert"><Sigil /><h2>视野中断</h2><p>{error}</p><button className="covenant-button" onClick={() => location.reload()}>重新接入</button></div>}
            {s.status === 'ready' && !error && <div className="initiation"><span className="system-sign">✧ 末日生存系统 · 意识接入</span><h2>找到你了，<br />最后的守夜人。</h2><p>你面前的，是一台拥有神秘力量的<strong>圣约机</strong>。它能抵御门外的恐怖诡异。代价，是你手中不断射出的铜币。</p><p>握紧铸币枪。我会教你如何活过这场长夜。</p><button className="covenant-button" onClick={() => start(true)} disabled={!view.ready}>握紧铸币枪 <span>↗</span></button>{saved && <button className="resume-save" onClick={() => { engine.current?.restore(saved); canvasRef.current?.focus(); }}>继续上次守夜 · {timeLabel(saved.elapsed)}</button>}<button className="skip-guide" onClick={() => start()} disabled={!view.ready}>我已知晓契约，直接守夜</button></div>}
            {s.status === 'tutorial' && s.guide < 3 && guidePoint && <div className="guidance-marker" style={{ left: `${guidePoint.x}%`, top: `${guidePoint.y}%` }} aria-hidden="true"><span />{s.guide === 1 ? '向祭器献上 10 枚铜币' : '向丧钟射出 3 枚铜币'}</div>}
            {s.status === 'tutorial' && <div className="system-guide" aria-live="polite"><div><span>✧ 末日生存系统</span><small>契约引导 {s.guide} / 3 · 时间已冻结</small></div><p>{s.message}</p>{s.guide === 3 ? <button className="covenant-button" onClick={() => start()}>我将守到黎明 <span>↗</span></button> : <span className="guide-progress">{s.guide === 1 ? `${s.progress.splitter.toFixed(0)} / 10 次献祭` : `${Math.min(s.guideHits, 3)} / 3 枚铜币`} <i /> 移动瞄准 · 左键或按住发射</span>}</div>}
            {s.status === 'playing' && <><div className="weapon-caption"><span>守夜人的铸币枪</span><strong>{volley(s)} 重回响 <i /> 祭品效力 ×{power(s).toFixed(1)}</strong><small>左键 / 按住 连续射击 · 铜币无限</small></div><div className="target-caption"><span>正在凝视</span><strong>{focus === 'clock' ? '末日丧钟' : devices[focus].name}</strong><small>{focus === 'clock' ? `每枚命中 +${clockGain(s).toFixed(1)} 秒庇护` : cost(s, focus) ? `${Math.floor(s.progress[focus]).toLocaleString()} / ${cost(s, focus).toLocaleString()} 献祭` : '契约已圆满'}</small></div></>}
            {s.status === 'paused' && !help && <div className="night-overlay"><div className="ritual-panel"><Sigil /><span className="overline">THE DARK CAN WAIT</span><h2>烛火替你守着。</h2><p>时间与献祭已暂停。准备好后，再举起枪。</p><button className="covenant-button" onClick={() => { engine.current?.resume(); canvasRef.current?.focus(); }}>继续守夜 <span>↗</span></button></div></div>}
            {(s.status === 'failed' || s.status === 'won') && <div className={`night-overlay ${s.status === 'won' ? 'dawn' : 'death'}`}><div className="ritual-panel"><Sigil /><span className="overline">{s.status === 'won' ? 'THE FIRST LIGHT IS REAL' : 'THE COVENANT IS BROKEN'}</span><h2>{s.status === 'won' ? '这一次，黎明是真的。' : '别回头。它已在你身后。'}</h2><p>{s.message}</p><div className="night-results"><span><b>{timeLabel(s.elapsed)}</b>守夜时长</span><span><b>{s.upgrades}</b>唤醒契约</span><span><b>{s.waveCount}</b>抵御侵袭</span></div><button className="covenant-button" onClick={restart}>{s.status === 'won' ? '再守一夜' : '重新签订契约'} <span>↻</span></button></div></div>}
          </div>
          <div className="night-mission"><span className="mission-rune">✥</span><div><small>{s.status === 'tutorial' ? '系统引导' : '当前契约'}</small><p>{s.status === 'won' ? '裂隙封闭。圣堂已迎来黎明。' : goal.text}</p></div><button onClick={() => choose(goal.target)} disabled={s.status === 'ready' || !!error}>瞄准祭器 <span>↗</span></button></div>
        </section>
        <aside className={`doom-column ${urgent ? 'doom-urgent' : ''} ${wave ? 'doom-wave' : ''}`} aria-label="最右侧灾难日倒计时">
          <section className="death-clock"><div className="doom-spires" aria-hidden="true">♰ <span>✧</span> ♰</div><Sigil className="doom-eye"/><span className="overline">MEMENTO MORI</span><h2>灾难日倒计时</h2><div className="doom-number" data-testid="countdown">{String(Math.ceil(s.time)).padStart(3, '0')}</div><span className="doom-unit">秒 庇 护</span><div className="doom-meter" role="meter" aria-label="剩余庇护" aria-valuemin={0} aria-valuemax={capacity(s)} aria-valuenow={Math.round(s.time)}><i style={{ width: `${s.time / capacity(s) * 100}%` }}/></div><p className="doom-whisper">{s.status === 'failed' ? '它已经进来了。' : s.status === 'won' ? '低语停了。' : urgent ? '它听见了你的心跳。' : wave ? '不要回应门外的声音。' : '丧钟归零之时，门将不再是门。'}</p><div className="doom-rates"><span>黑暗侵蚀 <b>−{drain(s).toFixed(2)}/秒</b></span><span>祷声修复 <b>+{(s.levels.ward * 0.38).toFixed(2)}/秒</b></span><span>铜币续命 <b>+{clockGain(s).toFixed(1)}/枚</b></span></div><button className="aim-clock" onClick={() => choose('clock')} disabled={!!error}>瞄准丧钟 <kbd>7</kbd></button><span className="clock-ornament" aria-hidden="true">───── ✧ ─────</span></section>
          <section className="night-journey"><div><span>距离黎明</span><b>{timeLabel(Math.max(0, DAWN_TIME - s.elapsed))}</b></div><div className="journey-track"><i style={{ width: `${progress}%` }}/></div><p>守至 12:00，并充满黎明圣龛。</p><div className="next-siege"><span>{wave ? '侵袭退去' : '下次侵袭'}</span><b>{timeLabel(wave ? 120 - s.elapsed % 120 : 95 - s.elapsed % 120)}</b></div></section>
        </aside>
      </div>
      <section className="covenants" aria-label="祭器升级链路"><div className="covenants-heading"><h2>圣约机的六道契约</h2><span>用铜币唤醒它们 · 新祭器将随长夜显现</span><small>{Object.keys(devices).filter(t => unlocked(s, t as Device)).length} / 6 已显现</small></div><div className="device-grid">{(Object.keys(devices) as Device[]).map((t, i) => {
        const device = devices[t], available = unlocked(s, t), maxed = !cost(s, t), ratio = maxed ? 100 : s.progress[t] / cost(s, t) * 100;
        return <button key={t} className={`covenant-card ${available ? '' : 'dormant'} ${focus === t ? 'chosen' : ''} ${maxed ? 'fulfilled' : ''}`} disabled={!available || !!error} onClick={() => choose(t)} aria-label={`${device.name}${available ? '，选择瞄准' : `，${timeLabel(device.at)} 显现`}`}><div className="covenant-top"><span className="device-glyph">{device.rune}</span><span>{available ? `第 ${s.levels[t]} 阶` : '尚未显现'}</span><kbd>{i + 1}</kbd></div><h3>{device.name}</h3><p>{available ? effect(s, t) : device.description}</p><div className="sacrament-track"><i style={{ width: `${ratio}%` }}/></div><div className="sacrament-value" data-testid={`${t}-progress`}>{available ? maxed ? '契约圆满' : <>{Math.floor(s.progress[t]).toLocaleString()} <span>/ {cost(s, t).toLocaleString()}</span></> : <span>{timeLabel(device.at)} 后显现</span>}</div></button>;
      })}</div></section>
      <div className="bottom-row"><div className="system-transmission" aria-live="polite"><span>✧ 末日生存系统</span><p>{s.message}</p></div><div className={`spirit-control ${s.levels.choir ? 'awake' : ''}`}><label htmlFor="spirit-target">灵仆献祭 <small>{autoRate(s) ? `${autoRate(s).toFixed(1)} 次/秒` : '等待摇篮苏醒'}</small></label><select id="spirit-target" value={s.autoTarget} disabled={!s.levels.choir} onChange={e => engine.current?.setAutoTarget(e.target.value as Target)}>{TARGETS.filter(t => unlocked(s, t)).map(t => <option key={t} value={t}>{t === 'clock' ? '末日丧钟' : devices[t].name}</option>)}</select></div></div>
      <footer className="night-footer"><span>VII <i /> 所有献祭，皆有回响。</span><div><span>本次守夜 <b>{timeLabel(s.elapsed)}</b></span><span>最长记录 <b>{timeLabel(best)}</b></span><span className="save-note">{s.status === 'playing' ? '契约每 5 秒自动铭记' : '末日生存系统 · 连线中'}</span></div></footer>
    </main>
    <dialog ref={dialog} className="night-manual" onCancel={e => { e.preventDefault(); closeHelp(); }}><button className="manual-close" onClick={closeHelp} aria-label="关闭手册">×</button><span className="overline">SURVIVAL SYSTEM / FIELD NOTES</span><h2>守夜手册</h2><p>守夜人，你手中的铸币枪，是与圣约机沟通的唯一语言。</p><dl><dt>移动鼠标</dt><dd>轻微转头与瞄准。视角固定，无法离开石桌。</dd><dt>左键 / 按住</dt><dd>发射铜币 / 连续射击，枪口到祭器约 0.28 秒。</dd><dt>1 — 7 / 空格</dt><dd>选择对应祭器 / 发射。7 始终指向最右侧丧钟。</dd><dt>P / Esc</dt><dd>暂停守夜。切换到后台或查阅手册也会暂停。</dd></dl><h3>十二分钟之约</h3><ol>{chapters.map(c => <li key={c.at}><b>{timeLabel(c.at)} · {c.name}</b><span>{c.note}</span></li>)}</ol><p>每两分钟的最后 25 秒，门外之物都会侵袭。升级越多，黑暗侵蚀越强。祷告风琴可以减缓侵蚀；灵仆可切换为自动守护丧钟。</p><p>圣龛在 08:30 显现，需 18,000 点献祭。充能后守至 12:00 即可封闭裂隙。逾期仍能继续，但黑暗会继续增强。灵仆会将已圆满祭器的后续献祭转向丧钟。</p><p>庇护上限初始 160 秒，祷告风琴可将其扩至 260 秒。存档只记住本次守夜，没有离线收益。</p><button className="covenant-button" onClick={closeHelp}>让烛火继续 <span>↗</span></button></dialog>
  </div>;
}
