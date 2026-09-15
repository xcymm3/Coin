import { useEffect, useMemo, useRef, useState } from 'react';
import { Scene } from './world';
import type { SceneView } from './world';
import {
  CANNON_STAGES, CREATURE_KINDS, creatureInRoom, fireInterval, initialState, movementUnlocked, ownedAbilities,
  productionRates, readSave, resourceName, room, ROOMS, SAVE_KEY, serializeSave, volley, power,
} from './rules';
import type { GameState, Resource } from './rules';

declare global { interface Window { __COIN_TEST__?: { setStage: (stage: 'explore' | 'cannon') => void; state: () => GameState; point: (target: Parameters<Scene['targetPoint']>[0]) => { x: number; y: number } | null; shutdown: () => Promise<void> } } }
type Panel = 'book' | 'pause' | 'map' | null;

export default function ImmersiveGame() {
  const canvas = useRef<HTMLCanvasElement>(null), scene = useRef<Scene | null>(null), dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState(initialState), [view, setView] = useState<SceneView>({ ready: false, hovered: null, contextLost: false });
  const [panel, setPanel] = useState<Panel>(null), [error, setError] = useState(''), [saved, setSaved] = useState<GameState | null>(null), [muted, setMuted] = useState(false);
  const resumeAfterPanel = useRef(false), lastSaveBucket = useRef(-1);

  useEffect(() => {
    try { setSaved(readSave(localStorage.getItem(SAVE_KEY))); } catch { /* Storage is optional. */ }
    try { scene.current = new Scene(canvas.current!, setState, setView, setError) } catch { setError('无法建立 WebGL 2 视野。请开启硬件加速或更换支持 WebGL 2 的浏览器。') }
    if (navigator.webdriver) window.__COIN_TEST__ = { setStage: stage => scene.current?.setTestState(stage), state: () => scene.current?.state ?? initialState(), point: target => scene.current?.targetPoint(target) ?? null, shutdown: () => scene.current?.shutdownAudio() ?? Promise.resolve() };
    return () => { delete window.__COIN_TEST__; scene.current?.destroy(); scene.current = null };
  }, []);
  useEffect(() => { if (scene.current) scene.current.audio.muted = muted }, [muted]);
  useEffect(() => {
    if (state.status !== 'playing' && state.status !== 'paused') return;
    const bucket = Math.floor(state.effectiveSeconds / 5);
    if (bucket === lastSaveBucket.current && state.status !== 'paused') return;
    try { localStorage.setItem(SAVE_KEY, serializeSave(state)); lastSaveBucket.current = bucket } catch { /* Private browsing must not stop play. */ }
  }, [state]);
  useEffect(() => { if (panel && !dialog.current?.open) dialog.current?.showModal(); else if (!panel && dialog.current?.open) dialog.current.close() }, [panel]);
  useEffect(() => { if (state.status === 'paused' && !panel && !error) setPanel('pause') }, [state.status, panel, error]);

  const openPanel = (next: Exclude<Panel, null>) => {
    if (!scene.current || error || state.status === 'ready' || state.status === 'won') return;
    if (next === 'book') scene.current.inspectUpgrades();
    resumeAfterPanel.current = state.status === 'playing' || state.status === 'tutorial';
    if (resumeAfterPanel.current) scene.current.pause();
    setPanel(next);
  };
  const closePanel = () => { setPanel(null); if (resumeAfterPanel.current && !document.hidden) scene.current?.resume(); resumeAfterPanel.current = false; canvas.current?.focus({ preventScroll: true }) };
  const begin = () => { lastSaveBucket.current = -1; scene.current?.startTutorial(); canvas.current?.focus() };
  const restore = () => { if (!saved) return; lastSaveBucket.current = -1; scene.current?.restore(saved); setSaved(null); canvas.current?.focus() };
  const leaveRefuge = () => { setPanel(null); scene.current?.start(); canvas.current?.focus() };
  const fullscreen = () => document.fullscreenElement ? void document.exitFullscreen().catch(() => {}) : void document.documentElement.requestFullscreen?.().catch(() => {});

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.code === 'KeyB') { event.preventDefault(); if (!event.repeat) panel === 'book' ? closePanel() : openPanel('book'); return }
      if (event.code === 'KeyM') { event.preventDefault(); if (!event.repeat) panel === 'map' ? closePanel() : openPanel('map'); return }
      if (event.code === 'Escape' || event.code === 'KeyP') { if (event.code === 'Escape' && panel) return; event.preventDefault(); if (!event.repeat) panel ? closePanel() : openPanel('pause'); return }
      if (panel || error || event.target instanceof HTMLButtonElement) return;
      if (event.code === 'KeyW') { event.preventDefault(); if (!event.repeat) scene.current?.move() }
      if (event.code === 'KeyA') { event.preventDefault(); if (!event.repeat) scene.current?.turn('left') }
      if (event.code === 'KeyD') { event.preventDefault(); if (!event.repeat) scene.current?.turn('right') }
      if (event.code === 'Space') { event.preventDefault(); scene.current?.fireCenter() }
      if (event.code === 'KeyF' && !event.repeat) fullscreen();
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [panel, error, state.status]);

  const rates = productionRates(state), hostile = creatureInRoom(state), abilities = ownedAbilities(state);
  const currentRoom = room(state.room), elapsed = Math.floor(state.effectiveSeconds), cannonNext = CANNON_STAGES[state.cannonStage];
  const objective = useMemo(() => {
    if (state.status === 'tutorial') return state.message;
    if (hostile) return `净化${CREATURE_KINDS[hostile.kind].name} · ${state.creatureDamage[hostile.id]} / ${CREATURE_KINDS[hostile.kind].threshold}`;
    if (state.room === 'moonBattery' && cannonNext) return `射击炮座组装${cannonNext.name}${cannonNext.resource ? ` · 需 ${cannonNext.cost} ${resourceName(cannonNext.resource)}` : ''}`;
    if (state.room === 'moonBattery' && state.cannonStage === 4) return `瞄准月亮射击 · 阶段 ${state.moonStage + 1} / 2`;
    return state.message;
  }, [state, hostile, cannonNext]);

  return <main className={`cathedral ${state.moonStage ? 'moon-wounded' : ''}`} aria-label="最后一枚：可探索教堂">
    <canvas ref={canvas} className="cathedral__world" tabIndex={0} aria-label="Three.js 透视三维教堂。W 前进，A D 转向，鼠标瞄准，左键发射无限银币。" />
    <div className="cathedral__veil" aria-hidden="true" /><div className="crosshair" aria-hidden="true"><i /></div>
    {!view.ready && !error && <p className="loading" role="status">月光正在穿过彩窗……</p>}

    {state.status !== 'ready' && state.status !== 'won' && <>
      <section className="hud hud--place" aria-label="当前位置"><small>{currentRoom.area}</small><strong>{currentRoom.name}</strong><span>{state.facing === 'north' ? '北' : state.facing === 'east' ? '东' : state.facing === 'south' ? '南' : '西'} · {state.visited.length}/{ROOMS.length}</span></section>
      <section className="hud hud--resources" aria-label="资源与生产">
        {(['silver', 'water', 'crosses'] as Resource[]).map(key => <span key={key}><small>{resourceName(key)}</small><strong data-testid={`resource-${key}`}>{Math.floor(state.resources[key])}</strong><em>+{rates[key].toFixed(2)}/秒</em></span>)}
      </section>
      <section className="hud hud--vital" aria-label="生命与武器"><span>生命 <b>{Math.ceil(state.health)}</b></span><span>齐射 {volley(state)} · 威力 {power(state)} · {fireInterval(state).toFixed(2)}秒</span></section>
      <p className="objective" role="status">{objective}</p>
      <button className="map-toggle" onClick={() => openPanel('map')} aria-label="打开教堂地图">M</button>
    </>}

    {state.status === 'ready' && view.ready && !error && <section className="arrival" aria-label="开始游戏"><span aria-hidden="true">◯</span><p>月下低语 · 第七码头仍有回声</p><h1>最后一枚</h1><blockquote>“银币不用于购买。它用于让不该活着的东西，记起自己已经死去。”</blockquote><button className="primary" onClick={begin}>听从月下低语</button>{saved && <button className="secondary" onClick={restore}>继续上次探索</button>}</section>}

    {state.status === 'tutorial' && !panel && !error && <section className="whisper" aria-live="polite"><small>月下低语</small><p>{state.message}</p>{state.tutorialStep === 2 && <button className="primary" onClick={() => openPanel('book')}>按 B 查看能力</button>}{state.tutorialStep === 3 && <button className="primary" onClick={leaveRefuge}>推开庇护地的门</button>}</section>}
    {view.targetPoint && state.status === 'tutorial' && state.tutorialStep === 1 && <span className="target-mark" style={{ left: `${view.targetPoint.x}%`, top: `${view.targetPoint.y}%` }} aria-hidden="true" />}

    {movementUnlocked(state) && !panel && !error && <nav className="touch-controls" aria-label="触屏操作">
      <button onClick={() => scene.current?.turn('left')} aria-label="左转九十度">A</button><button onClick={() => scene.current?.move()} aria-label="前进一格">W</button><button onClick={() => scene.current?.turn('right')} aria-label="右转九十度">D</button>
      <button className="touch-fire" onPointerDown={event => { event.preventDefault(); scene.current?.beginCenterFire() }} onPointerUp={() => scene.current?.endFire()} onPointerCancel={() => scene.current?.endFire()} onPointerLeave={() => scene.current?.endFire()} aria-label="发射银币">发射</button><button onClick={() => openPanel('book')} aria-label="查看能力">B</button><button onClick={() => openPanel('pause')} aria-label="暂停">Ⅱ</button>
    </nav>}

    {error && <section className="ending" role="alert"><div><span aria-hidden="true">◌</span><h2>视野中断</h2><p>{error}</p><button className="primary" onClick={() => location.reload()}>重新载入视野</button></div></section>}
    {state.status === 'won' && !error && <section className="ending ending--won" aria-label="胜利结算"><div><span aria-hidden="true">☾</span><h2>月亮已经沉默</h2><p>{state.message}</p><small>有效游戏时间 {Math.floor(elapsed / 60)} 分 {elapsed % 60} 秒 · 净化 {state.producers.length} 个生物 · 点亮 {state.sanctuaries.length - 1} 处安全区</small><button className="primary" onClick={() => scene.current?.restart()}>重新聆听低语</button></div></section>}

    <dialog ref={dialog} className="overlay" aria-label={panel === 'book' ? '已获得能力' : panel === 'map' ? '教堂地图' : '暂停菜单'} onCancel={event => { event.preventDefault(); closePanel() }}>
      <button className="overlay__close" onClick={closePanel} aria-label="关闭">×</button>
      {panel === 'book' && <><header><small>B · 契约册</small><h2>已获得能力</h2><p>打开期间，生产和危险均冻结。未来能力不会提前显示。</p></header><ul className="abilities">{abilities.map(a => <li key={a.id}><strong>{a.name}</strong><span>{a.text}</span></li>)}</ul><section className="rate-summary"><h3>全局生产速率</h3>{(['silver', 'water', 'crosses'] as Resource[]).map(k => <p key={k}><span>{resourceName(k)}</span><b>{rates[k].toFixed(2)} / 秒</b></p>)}</section>{state.tutorialStep >= 3 && state.status !== 'playing' && <button className="primary" onClick={() => { closePanel(); leaveRefuge() }}>合上契约册</button>}</>}
      {panel === 'map' && <><header><small>M · 方位图</small><h2>被月光记住的房间</h2><p>实线为已走过的空间；未知门后仍由黑暗遮挡。</p></header><div className="map-grid" aria-label="教堂拓扑图">{ROOMS.map(r => <div key={r.id} className={`map-node ${state.room === r.id ? 'is-current' : ''} ${state.visited.includes(r.id) ? 'is-visited' : ''} ${state.sanctuaries.includes(r.id) ? 'is-safe' : ''}`} style={{ gridColumn: r.x + 3, gridRow: r.z + 3 }}><span>{state.visited.includes(r.id) ? r.name : '未知'}</span></div>)}</div><button className="primary" onClick={closePanel}>收起地图</button></>}
      {panel === 'pause' && <><header><small>暂停</small><h2>烛火替你守着</h2><p>生产、危险与有效游戏时间都已冻结；恢复时不补算。</p></header><button className="primary" onClick={closePanel}>继续探索</button><button className="menu-line" onClick={() => setMuted(v => !v)} aria-pressed={muted}>{muted ? '开启声音' : '静音'}<span>{muted ? '关' : '开'}</span></button><button className="menu-line" onClick={fullscreen}>切换全屏 <kbd>F</kbd></button><button className="menu-line" onClick={() => { setPanel(null); scene.current?.restart() }}>重新开始</button></>}
    </dialog>
  </main>;
}
