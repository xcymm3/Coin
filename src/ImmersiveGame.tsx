import { useEffect, useRef, useState } from 'react';
import { Scene } from './world';
import type { SceneView } from './world';
import { canShoot, chapter, chapters, devices, initialState, ownedUpgrades, readSave, recommendation, SAVE_KEY, TARGETS, timeLabel, unlocked, waveActive } from './rules';
import type { GameState } from './rules';

export default function ImmersiveGame() {
  const canvas = useRef<HTMLCanvasElement>(null), engine = useRef<Scene | null>(null);
  const [s, setState] = useState(initialState), [view, setView] = useState<SceneView>({ hovered: null, points: {}, ready: false });
  const [error, setError] = useState(''), [saved, setSaved] = useState<GameState | null>(null);
  const [panel, setPanel] = useState<'journal' | 'pause' | null>(null), [muted, setMuted] = useState(false);
  const [subtitle, setSubtitle] = useState(''), [hint, setHint] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), closeButton = useRef<HTMLButtonElement>(null);
  const resumeJournal = useRef(false), lastSave = useRef(-1), lastChapter = useRef(0), previousWave = useRef(false), previousStatus = useRef(s.status);
  const subtitleTimer = useRef<ReturnType<typeof setTimeout> | null>(null), hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try { setSaved(readSave(localStorage.getItem(SAVE_KEY))); } catch { /* Local saves are optional. */ }
    try { engine.current = new Scene(canvas.current!, setState, setView, setError); }
    catch { setError('圣堂的视野未能建立。请开启浏览器硬件加速后重新接入。'); }
    return () => {
      engine.current?.destroy(); engine.current = null;
      if (subtitleTimer.current) clearTimeout(subtitleTimer.current);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    };
  }, []);
  useEffect(() => { if (engine.current) engine.current.audio.muted = muted; }, [muted]);
  useEffect(() => {
    try {
      if (s.status === 'playing' || (s.status === 'paused' && s.guide >= 4)) {
        const bucket = Math.floor(s.elapsed / 5);
        if (bucket !== lastSave.current || s.status === 'paused') { localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 2, state: s })); lastSave.current = bucket; }
      } else if (s.status === 'failed' || s.status === 'won') {
        localStorage.removeItem(SAVE_KEY);
        const record = Number(localStorage.getItem('last-coin-best')) || 0;
        localStorage.setItem('last-coin-best', String(Math.max(record, s.elapsed)));
      }
    } catch { /* Private mode must not interrupt the vigil. */ }
  }, [s]);

  function speak(text: string) {
    setSubtitle(text);
    if (subtitleTimer.current) clearTimeout(subtitleTimer.current);
    subtitleTimer.current = setTimeout(() => setSubtitle(''), 6500);
  }
  useEffect(() => {
    if (s.status === 'playing') {
      if (previousStatus.current === 'ready' || previousStatus.current === 'tutorial') {
        setHint(true); if (hintTimer.current) clearTimeout(hintTimer.current);
        hintTimer.current = setTimeout(() => setHint(false), 5500);
        speak('临时庇护已撤除。让丧钟继续呼吸，守到黎明。');
      }
      const currentChapter = chapter(s), wave = waveActive(s);
      if (currentChapter > lastChapter.current) speak(chapters[currentChapter].note);
      else if (wave && !previousWave.current) speak('不要回应。门外的声音不是活人。');
      lastChapter.current = currentChapter; previousWave.current = wave;
    }
    previousStatus.current = s.status;
    if (s.status === 'paused' && panel === null && !error) setPanel('pause');
  }, [s.status, s.elapsed, panel, error]);

  useEffect(() => {
    if (panel && !dialog.current?.open) dialog.current?.showModal();
    if (!panel && dialog.current?.open) dialog.current.close();
    if (panel) closeButton.current?.focus();
  }, [panel]);

  function openJournal() {
    const current = engine.current;
    if (!current || !['playing', 'tutorial', 'paused'].includes(current.state.status) || error) return;
    resumeJournal.current = canShoot(current.state);
    if (resumeJournal.current) current.pause();
    current.inspectUpgrades(); setPanel('journal'); setSubtitle(''); setHint(false);
  }
  function closePanel() {
    if (panel === 'journal' && !resumeJournal.current) { setPanel('pause'); return; }
    setPanel(null);
    if (engine.current?.state.status === 'paused' && !document.hidden) engine.current.resume();
    canvas.current?.focus({ preventScroll: true });
  }
  function pause() {
    if (panel) { closePanel(); return; }
    if (engine.current && canShoot(engine.current.state)) { engine.current.pause(); setPanel('pause'); }
  }
  function fullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else if (document.documentElement.requestFullscreen) void document.documentElement.requestFullscreen().catch(() => {});
  }
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'KeyB') { e.preventDefault(); if (!e.repeat) { if (panel === 'journal') closePanel(); else openJournal(); } return; }
      if (e.code === 'Escape' || e.code === 'KeyP') { if (panel && e.code === 'Escape') return; e.preventDefault(); if (!e.repeat) pause(); return; }
      if (panel || error || e.target instanceof HTMLButtonElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === 'KeyF' && !e.repeat) { e.preventDefault(); fullscreen(); }
      if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) engine.current?.fireSelected(); }
      const index = Number(e.code.replace('Digit', '')) - 1;
      if (e.code.startsWith('Digit') && TARGETS[index]) { e.preventDefault(); engine.current?.select(TARGETS[index]); }
    };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, [panel, error]);

  function begin(tutorial: boolean) {
    lastSave.current = -1; lastChapter.current = 0; previousWave.current = false;
    if (tutorial) engine.current?.startTutorial(); else engine.current?.start();
    canvas.current?.focus();
  }
  function restore() {
    if (!saved) return;
    lastChapter.current = chapter(saved); previousWave.current = waveActive(saved); lastSave.current = -1;
    engine.current?.restore(saved); canvas.current?.focus();
  }
  function restart() {
    setPanel(null); setSubtitle(''); lastSave.current = -1; lastChapter.current = 0; previousWave.current = false;
    engine.current?.restart(); canvas.current?.focus();
  }
  const owned = ownedUpgrades(s), guidePoint = view.points[recommendation(s).target];
  return <main className="game-screen" aria-label="最后一枚：全屏守夜">
    <canvas ref={canvas} className="game-world" tabIndex={0} aria-label="圣堂三维场景，手持铸币枪。鼠标瞄准并发射，B 查看已有契约，Esc 暂停。" aria-description={`剩余庇护 ${Math.ceil(s.time)} 秒；${s.status === 'paused' ? '时间暂停' : s.status === 'playing' ? '守夜进行中' : '等待契约'}。`} />
    <div className="game-vignette" aria-hidden="true" />
    {!view.ready && !error && <div className="game-loading" role="status">烛火正在重新点燃……</div>}

    {s.status === 'ready' && !error && view.ready && <section className="arrival" aria-label="守夜接入"><span className="arrival-mark" aria-hidden="true">✥</span><p className="arrival-identity">末日生存系统 · 找到尚存的心跳</p><h1>最后一枚</h1><p className="arrival-voice">守夜人，握紧你的枪。<br />面前的圣约机，能抵御门外的恐怖诡异。<br />献上铜币，让它继续庇护你。</p><button className="covenant-button" onClick={() => begin(true)}>握紧铸币枪 <span>↗</span></button>{saved && <button className="arrival-secondary" onClick={restore}>继续上次守夜</button>}<button className="arrival-secondary subdued" onClick={() => begin(false)}>我已知晓契约</button></section>}

    {s.status === 'tutorial' && !panel && !error && <>
      {s.guide < 3 && guidePoint && <div className="ritual-beacon" style={{ left: `${guidePoint.x}%`, top: `${guidePoint.y}%` }} aria-hidden="true"><i /></div>}
      <section className="guide-voice" aria-live="polite"><span className="voice-identity">末日生存系统</span><p>{s.message}</p>{s.guide === 1 && <small>瞄准亮起的祭器 · 左键 / 按住发射</small>}{s.guide === 2 && <small>最右侧的丧钟正在等待你的献祭</small>}{s.guide === 3 && !s.journalRead && <button className="journal-invitation" onClick={openJournal}><kbd>B</kbd> 展开契约烙印</button>}{s.guide === 3 && s.journalRead && <button className="covenant-button" onClick={() => begin(false)}>我将守到黎明 <span>↗</span></button>}</section>
    </>}
    {s.status === 'playing' && !panel && subtitle && <p className="passing-voice" role="status">{subtitle}</p>}
    {s.status === 'playing' && !panel && hint && <span className="fading-controls"><kbd>B</kbd> 契约烙印 <i /> <kbd>Esc</kbd> 暂停</span>}
    {canShoot(s) && !panel && !error && <div className="touch-gestures"><button aria-label="查看已有契约" onClick={openJournal}>B</button><button aria-label="暂停守夜" onClick={pause}>Ⅱ</button></div>}

    {error && <section className="ending-veil" role="alert"><div className="ending-content"><span aria-hidden="true">✥</span><h2>视野中断</h2><p>{error}</p><button className="covenant-button" onClick={() => location.reload()}>重新接入</button></div></section>}
    {(s.status === 'failed' || s.status === 'won') && !error && <section className={`ending-veil ${s.status === 'won' ? 'sunrise' : ''}`} aria-label="守夜结算"><div className="ending-content"><span aria-hidden="true">{s.status === 'won' ? '☼' : '♰'}</span><h2>{s.status === 'won' ? '这一次，黎明是真的。' : '别回头。它已在你身后。'}</h2><p>{s.message}</p><small>你守了 {timeLabel(s.elapsed)}，抵御了 {s.waveCount} 次侵袭。</small><button className="covenant-button" onClick={restart}>{s.status === 'won' ? '再守一夜' : '重新签订契约'} <span>↻</span></button></div></section>}

    <dialog ref={dialog} className={`in-world-menu ${panel === 'journal' ? 'contract-book' : 'pause-ritual'}`} aria-label={panel === 'journal' ? '已有契约烙印' : '暂停守夜'} onCancel={e => { e.preventDefault(); closePanel(); }}>
      <button ref={closeButton} className="seal-close" onClick={closePanel} aria-label={panel === 'journal' ? '合上契约烙印' : '继续守夜'}>×</button>
      {panel === 'journal' ? <><div className="book-heading"><span aria-hidden="true">✥</span><p>灵魂记得每一次回响</p><h2>已有契约烙印</h2></div>{owned.length ? <ul className="owned-contracts">{owned.map(item => <li key={item.id}><span className="owned-rune" aria-hidden="true">{devices[item.id].rune}</span><div><h3>{item.name}</h3><p>{item.description}</p></div><span className="owned-seals" aria-label={`${item.level} 道烙印`}>{'✧'.repeat(item.level)}</span></li>)}</ul> : <p className="unmarked-soul">你的灵魂还没有新的烙印。<br />向祭器献上铜币，留意它与手中枪械的变化。</p>}{s.levels.choir > 0 && <section className="spirit-orders"><label htmlFor="spirit-orders">让灵仆聆听你的意志</label><select id="spirit-orders" value={s.autoTarget} onChange={e => engine.current?.setAutoTarget(e.target.value as typeof s.autoTarget)}>{TARGETS.filter(t => unlocked(s, t)).map(t => <option key={t} value={t}>{t === 'clock' ? '末日丧钟' : devices[t].name}</option>)}</select></section>}<p className="book-footnote">这里只铭记你已经获得的力量。<br /><kbd>B</kbd> 或 <kbd>Esc</kbd> 合上 · 查阅时庇护不会流失</p><button className="covenant-button" onClick={closePanel}>合上烙印，回到圣堂 <span>↗</span></button></> : <><span className="pause-symbol" aria-hidden="true">✥</span><h2>烛火替你守着。</h2><p>时间与献祭已暂停。</p><button className="covenant-button" onClick={closePanel}>继续守夜 <span>↗</span></button><button className="menu-line" onClick={openJournal}>查看已有契约 <kbd>B</kbd></button><button className="menu-line" onClick={() => setMuted(!muted)} aria-pressed={muted}>{muted ? '开启声音' : '关闭声音'}</button><button className="menu-line" onClick={fullscreen}>切换全屏 <kbd>F</kbd></button><p className="pause-controls">移动鼠标瞄准 · 左键 / 按住发射<br />1–7 选择祭器 · 空格开枪 · 7 为右侧丧钟<br />B 查阅已有契约 · Esc / P 暂停</p></>}
    </dialog>
  </main>;
}
