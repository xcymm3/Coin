import { useEffect, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { PLANTS, TIERS, UPGRADES, SAVE_KEY, newGame, parseSave, reducer, unlocked, price, reward, upgradePrice, clickPower, growthRate, formatTime, type Tier } from './game'
import { configureAudio, sound, unlockAudio } from './audio'
import './App.css'

const number = (n: number) => Math.floor(n).toLocaleString('en-US')
const asset = `${import.meta.env.BASE_URL}assets/garden-atlas.png`
function Sprite({ id, className = '' }: { id: number; className?: string }) {
  return <span aria-hidden="true" className={`sprite ${className}`} style={{ backgroundImage: `url(${asset})`, backgroundPosition: `${id % 4 * 100 / 3}% ${Math.floor(id / 4) * 100 / 3}%` }} />
}
function Icon({ name }: { name: string }) {
  const sprites: Record<string, number> = { coin: 15, seed: 13, water: 14, snail: 12, pot: 10, star: 9 }
  if (name in sprites) return <Sprite id={sprites[name]} className="icon-sprite" />
  const paths: Record<string, string> = {
    leaf: 'M2 3h4v2h2v3h2V5h2V2h4v7h-2v3h-3v5H8v-5H5v-2H3V7H2Z',
    hand: 'M5 3h2v6h1V1h2v8h1V2h2v7h1V4h2v8h-2v4h-2v2H7v-2H5v-3H3V8h2Z',
    boot: 'M5 2h7v8h3v2h3v5H3v-5h2Z',
    gear: 'M7 1h5v3h3V3h3v4h-2v5h2v4h-4v-2h-2v4H7v-4H4v2H1v-4h2V7H1V3h4v2h2ZM7 7v5h5V7Z',
    book: 'M2 3h6l2 2 2-2h6v13h-6l-2 2-2-2H2Zm7 3v9h2V6Z',
  }
  return <svg className={`pixel-icon icon-${name}`} viewBox="0 0 20 20" aria-hidden="true" shapeRendering="crispEdges"><path d={paths[name] ?? paths.leaf} fillRule="evenodd" /></svg>
}
function Progress({ value, gold = false }: { value: number; gold?: boolean }) {
  return <span className={`progress ${gold ? 'gold' : ''}`}><span style={{ transform: `scaleX(${Math.max(0, Math.min(1, value))})` }} /></span>
}
function Modal({ title, children, close, className = '' }: { title: string; children: ReactNode; close?: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} className={`wood modal ${className}`} aria-label={title} onCancel={e => { e.preventDefault(); close?.() }}>
    {close && <button className="close-button blue-button" aria-label="关闭菜单" onClick={close}>×</button>}{children}
  </dialog>
}
function PixelBurst({ kind }: { kind: string }) {
  return <span aria-hidden="true" className={`pixel-burst burst-${kind}`}>{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--dx': `${Math.cos(i * 2.4) * (24 + i * 4)}px`, '--dy': `${-25 - (i % 5) * 13}px`, '--turn': `${i * 45}deg`, '--delay': `${i % 3 * 25}ms` } as CSSProperties} />)}</span>
}
function Fireflies() {
  return <div className="fireflies" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 3) % 100}%`, top: `${(i * 23 + 7) % 100}%`, '--delay': `${-i * 1.7}s`, '--duration': `${8 + i % 5}s` } as CSSProperties} />)}</div>
}
type Settings = { sound: boolean; volume: number; music: boolean; musicVolume: number; motion: boolean }
function loadSettings(): Settings {
  try { const p = JSON.parse(localStorage.getItem('moon-garden-settings') ?? '{}'); return { sound: p.sound !== false, volume: typeof p.volume === 'number' ? Math.max(0, Math.min(1, p.volume)) : .35, music: p.music !== false, musicVolume: typeof p.musicVolume === 'number' ? Math.max(0, Math.min(1, p.musicVolume)) : .3, motion: p.motion !== false } } catch { return { sound: true, volume: .35, music: true, musicVolume: .3, motion: true } }
}
function loadGame() {
  try { return parseSave(localStorage.getItem(SAVE_KEY)) ?? newGame() } catch { return newGame() }
}
export default function Garden() {
  const [s, dispatch] = useReducer(reducer, undefined, loadGame)
  // Capture absence once at page load; time spent in menus must remain paused.
  const [offlineSeconds] = useState(() => Math.min(1800, Math.max(0, (Date.now() - s.lastSaved) / 1000)))
  const [screen, setScreen] = useState<'menu' | 'game'>('menu')
  const [panel, setPanel] = useState<'settings' | 'book' | 'help' | 'reset' | null>(null)
  const [category, setCategory] = useState(0)
  const [mobilePanel, setMobilePanel] = useState<'garden' | 'seeds' | 'upgrades'>('garden')
  const [settings, setSettings] = useState(loadSettings)
  const [toast, setToast] = useState('')
  const [saveError, setSaveError] = useState(false)
  const [victoryDismissed, setVictoryDismissed] = useState(s.wonAt !== null)
  const [floats, setFloats] = useState<{ id: number; pot: number; text: string; kind: string }[]>([])
  const current = useRef(s)
  const floatId = useRef(0)
  const offlineApplied = useRef(false)
  const won = s.wonAt !== null && !victoryDismissed && screen === 'game'
  const paused = screen !== 'game' || panel !== null || won
  const selected = PLANTS[s.selected]

  useEffect(() => { current.current = s }, [s])
  useEffect(() => {
    configureAudio(settings.sound, settings.volume, settings.music, settings.musicVolume)
    try { localStorage.setItem('moon-garden-settings', JSON.stringify(settings)) } catch { /* Gameplay remains available without storage. */ }
  }, [settings])
  useEffect(() => {
    if (paused) return
    let before = Date.now()
    const timer = window.setInterval(() => { const now = Date.now(); dispatch({ type: 'tick', dt: (now - before) / 1000 }); before = now }, 250)
    return () => clearInterval(timer)
  }, [paused])
  useEffect(() => {
    const save = () => {
      if (!current.current.started) return
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...current.current, lastSaved: Date.now() })); setSaveError(false) } catch { setSaveError(true) }
    }
    const timer = window.setInterval(save, 3000)
    window.addEventListener('pagehide', save)
    return () => { clearInterval(timer); window.removeEventListener('pagehide', save); save() }
  }, [])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4000); return () => clearTimeout(timer) }, [toast])
  useEffect(() => { if (!floats.length) return; const timer = setTimeout(() => setFloats([]), 900); return () => clearTimeout(timer) }, [floats])
  useEffect(() => { if (won) sound('win') }, [won])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !panel && screen === 'game' && !won) setPanel('settings') }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [screen, panel, won])

  function play() {
    unlockAudio(); sound('plant')
    if (s.started && !offlineApplied.current) {
      const gap = offlineSeconds
      if (gap > 10) { dispatch({ type: 'tick', dt: gap }); setToast(`离线照料了 ${formatTime(gap)}，欢迎回到花园。`) }
    }
    offlineApplied.current = true; dispatch({ type: 'start' }); setScreen('game')
  }
  function potClick(index: number) {
    if (paused) return
    const p = s.pots[index]
    let text = ''
    if (p.plant === null) {
      if (s.coins < price(s, selected)) { setToast(`金币不足：${selected.name}需要 ${price(s, selected)} 金币。低级种子始终免费。`); return }
      text = '种下了！'; sound('plant')
    } else if (p.growth >= PLANTS[p.plant].seconds) { text = `+${reward(s, PLANTS[p.plant])}`; sound('coin') }
    else { text = `+${p.plant === 9 ? '0.5' : clickPower(s).toFixed(0)}秒`; sound('water') }
    setFloats(f => [...f.slice(-9), { id: floatId.current++, pot: index, text, kind: p.plant === null ? 'plant' : p.growth >= PLANTS[p.plant].seconds ? 'coin' : 'water' }])
    dispatch({ type: 'pot', index })
  }
  function choose(id: number) { dispatch({ type: 'select', id }); sound('tap') }
  function reset() { dispatch({ type: 'reset' }); offlineApplied.current = true; setVictoryDismissed(false); setPanel(null); setScreen('game'); setCategory(0); setToast('新的花园，从一颗嫩芽豆开始。') }
  const nextGoal = s.earned < 120 ? '累计赚取 120 金币，解锁中级种子' : s.earned < 1800 ? '累计赚取 1,800 金币，解锁高级种子' : !unlocked(s, 3) ? `培育三种高级植物（${[6, 7, 8].filter(id => s.discovered.includes(id)).length}/3），解锁终极种子` : s.wonAt !== null ? '星之花已经绽放。继续创造你的奇妙花园吧。' : s.pots.some(p => p.plant === 9) ? '照料永恒星之花，让第一颗星星在花园绽放' : '积攒 6,500 金币，种下永恒星之花'
  const goalProgress = s.earned < 120 ? s.earned / 120 : s.earned < 1800 ? s.earned / 1800 : !unlocked(s, 3) ? [6, 7, 8].filter(id => s.discovered.includes(id)).length / 3 : s.pots.some(p => p.plant === 9) ? s.pots.find(p => p.plant === 9)!.growth / 480 : s.wonAt !== null ? 1 : s.coins / 6500

  return <div className={`game-shell ${!settings.motion ? 'reduce-motion' : ''} ${screen === 'menu' ? 'on-menu' : ''} ${paused ? 'is-paused' : ''}`}>
    <Fireflies />
    <header className="topbar">
      <div className="stat wood coin-stat"><Sprite id={15} /><div><small>花园金币</small><strong data-testid="coins">{number(s.coins)}</strong></div></div>
      <div className="stat wood"><Icon name="leaf" /><div><small>培育图鉴</small><strong>{s.discovered.length}<em>/ 10</em></strong></div></div>
      <div className="brand"><span>MOONLIT GARDEN</span><h1>月光奇植园</h1></div>
      <div className="time-display"><span className="live-dot" />{s.wonAt !== null ? '自由种植' : '花园时光'}<strong data-testid="elapsed">{formatTime(s.elapsed)}</strong></div>
      <button className="blue-button icon-button" aria-label="植物图鉴" onClick={() => setPanel('book')}><Icon name="book" /></button>
      <button className="blue-button icon-button" aria-label="游戏设置" onClick={() => setPanel('settings')}><Icon name="gear" /></button>
    </header>
    <nav className="mobile-nav" aria-label="游戏面板">{(['garden', 'seeds', 'upgrades'] as const).map((id, i) => <button key={id} className={mobilePanel === id ? 'active' : ''} onClick={() => setMobilePanel(id)}>{['花园', '种子', '升级'][i]}</button>)}</nav>
    <main className="game-layout">
      <aside className={`seed-panel wood ${mobilePanel === 'seeds' ? 'mobile-active' : ''}`} aria-label="种子商店">
        <h2 className="panel-title"><Icon name="leaf" />种 子<Icon name="leaf" /></h2>
        <div className="tier-list">{TIERS.map((name, i) => {
          const open = unlocked(s, i as Tier), active = selected.tier === i
          return <button key={name} className={`tier-card blue-button tier-${i} ${active ? 'selected' : ''}`} aria-pressed={active} disabled={!open} onClick={() => choose(i * 3)}>
            <span className="seed-bag"><Sprite id={13} />{!open && <span className="lock">◆</span>}</span>
            <span className="tier-copy"><strong>{name}</strong><b>{i === 0 ? '免费 · 无限' : i === 3 ? '6,500 金币' : `${i === 1 ? '30' : '200'} 金币起`}</b><small>{open ? i === 3 ? '种出星星 · 完成旅程' : `${[0, 1, 2].filter(j => s.discovered.includes(i * 3 + j)).length} / 3 已培育` : i === 3 ? '培育全部 3 种高级植物' : `累计收益 ${i === 1 ? '120' : '1,800'} 解锁`}</small></span>
          </button>
        })}</div>
        <div className="seed-selection"><div className="eyebrow">选择品种 <span>{TIERS[selected.tier]}</span></div>
          <div className="species-list">{PLANTS.filter(p => p.tier === selected.tier).map(p => <button key={p.id} className={`species-button ${s.selected === p.id ? 'selected' : ''}`} aria-label={`选择${p.name}`} aria-pressed={s.selected === p.id} onClick={() => choose(p.id)}><Sprite id={p.id} /><span>{p.name}</span></button>)}</div>
          <div className="plant-details"><h3>{selected.name}</h3><div className="plant-numbers"><span>◷ {formatTime(selected.seconds)}</span><span className="gold-text">收获 {reward(s, selected)} 金币</span></div><div className="plant-purchase">种子 {price(s, selected) === 0 ? '免费' : `${price(s, selected)} 金币`} · 约 {Math.ceil(selected.seconds / (selected.tier === 3 ? .5 : clickPower(s)))} 次浇水</div><p>{selected.effect}</p></div>
        </div>
        <div className="shop-note"><Icon name="seed" /><p>选好种子，点击空花盆<br />即购买并播种。</p></div>
      </aside>

      <section className={`garden-section ${mobilePanel === 'garden' ? 'mobile-active' : ''}`} aria-label="花园">
        <div className="garden-heading"><div><span className="live-dot" /><h2>我的小花园</h2><span className="garden-count">{s.pots.length} / 15 花盆</span></div><button className="text-button" onClick={() => setPanel('help')}>玩法指南 <span>?</span></button></div>
        <div className="garden-board wood">
          <div className="board-corner tl" /><div className="board-corner tr" /><div className="board-corner bl" /><div className="board-corner br" />
          <div className="pot-grid">{Array.from({ length: 15 }, (_, i) => {
            const pot = s.pots[i]
            if (!pot) return <button key={i} className="locked-pot" aria-label={`扩建第${i + 1}个花盆`} onClick={() => { setCategory(1); setMobilePanel('upgrades'); setToast('在右侧「花园」升级中购买花园扩建。') }}><span>＋</span><small>待扩建</small></button>
            const p = pot.plant === null ? null : PLANTS[pot.plant]
            const ready = p !== null && pot.growth >= p.seconds
            const seed = p !== null && pot.growth < p.seconds * .15
            const young = p !== null && pot.growth < p.seconds * .5
            const sprite = p === null ? 10 : seed ? 11 : young ? 0 : p.id
            return <button key={i} data-testid={`pot-${i}`} aria-label={`花盆${i + 1} ${p?.name ?? '空闲'} ${p ? ready ? '收获' : '浇水' : '播种'}`} className={`pot ${ready ? 'ready' : ''} ${p?.tier === 3 ? 'ultimate' : ''} ${p && !seed ? 'alive' : ''} plant-${p?.id ?? 'empty'}`} style={{ '--sway-delay': `${-i * .37}s` } as CSSProperties} onClick={() => potClick(i)}>
              <span className="pot-number">{(i + 1).toString().padStart(2, '0')}</span>
              {p && <span className="plant-name">{p.name}</span>}
              {p && !young && p.tier > 0 && <span className={`plant-aura aura-${p.tier}`} aria-hidden="true"><i /><i /><i /></span>}
              <Sprite key={`${sprite}-${ready}`} id={sprite} className="pot-art" />
              {ready && <span className="ripe-sparkles" aria-hidden="true">✦<i>✧</i><b>✦</b></span>}
              {p && s.elapsed - pot.wateredAt < .65 && <span key={pot.wateredAt} className="water-drop" aria-hidden="true">♦<PixelBurst kind="water" /></span>}
              <span className="pot-sign"><strong>{p ? ready ? '可收获' : seed ? '萌芽中' : young ? '生长中' : p.tier === 3 ? '凝聚星光' : '成株生长' : '空 闲'}</strong><Progress value={p ? pot.growth / p.seconds : 0} gold={p?.tier === 3} /><small>{p ? ready ? `+${reward(s, p)} 金币` : `${formatTime((p.seconds - pot.growth) / (p.tier === 3 ? 1 : growthRate(s)))}` : '点击播种'}</small></span>
              {floats.filter(f => f.pot === i).map(f => <span className={`pot-feedback feedback-${f.kind}`} key={f.id}><span className="float-label">{f.text}</span>{f.kind !== 'water' && <PixelBurst kind={f.kind} />}</span>)}
            </button>
          })}</div>
          <div className="garden-path"><span className="path-grass">✦</span>{s.upgrades.snail ? <div className="snail-parade" style={{ '--snail-position': `${(s.cursor % s.pots.length) / s.pots.length * 70}%`, '--snail-count': s.upgrades.snail } as CSSProperties}>{Array.from({ length: s.upgrades.snail }, (_, i) => <Sprite id={12} key={i} />)}<span className="snail-drops">▪ · ▪ ·</span></div> : <div className="sleepy-snail"><Sprite id={12} /><span>小蜗牛在等你雇用它…</span></div>}<span className="path-grass">✦</span></div>
        </div>
        <div className="quest-panel"><Sprite id={9} /><div><div className="quest-caption"><span>{s.wonAt !== null ? '旅程完成' : '星之花的约定'}</span><b>{Math.min(100, Math.floor(goalProgress * 100))}%</b></div><p>{nextGoal}</p><Progress value={goalProgress} gold /></div></div>
      </section>

      <aside className={`upgrade-panel ${mobilePanel === 'upgrades' ? 'mobile-active' : ''}`} aria-label="升级商店">
        <h2 className="panel-title"><Icon name="leaf" />升 级<Icon name="leaf" /></h2>
        <div className="upgrade-tabs" role="tablist" aria-label="升级分类">{['照料', '花园', '助手'].map((name, i) => <button role="tab" aria-selected={category === i} key={name} onClick={() => { setCategory(i); sound('tap') }} className={category === i ? 'selected' : ''}><Icon name={['hand', 'pot', 'snail'][i]} /><span>{name}</span></button>)}</div>
        <div className="upgrade-list">{UPGRADES.filter(u => u.category === category).map(u => {
          const level = s.upgrades[u.id], max = level === u.max, cost = upgradePrice(s, u)
          return <button key={u.id} data-testid={`upgrade-${u.id}`} className="upgrade-card" disabled={max || s.coins < cost} onClick={() => { dispatch({ type: 'buy', id: u.id }); sound('buy'); setToast(`${u.name}升至 Lv ${level + 1}`) }}>
            <span className="upgrade-art"><Icon name={u.icon} /></span><span className="upgrade-copy"><strong>{u.name}</strong><span className="upgrade-price"><small>Lv {level} / {u.max}</small><b>{max ? '已满级' : `◈ ${number(cost)}`}</b></span><Progress value={level / u.max} /><span className="upgrade-description">{u.detail}</span></span>
          </button>
        })}</div>
        <div className="garden-bonuses"><div className="eyebrow">花园加成</div><p><span>手动浇水</span><b>+{clickPower(s).toFixed(0)} 秒</b></p><p><span>自然生长</span><b>×{growthRate(s).toFixed(2)}</b></p><p><span>收获收益</span><b>+{s.upgrades.profit * 20}%</b></p><p><span>蜗牛助手</span><b>{s.upgrades.snail} 只</b></p></div>
        {(s.upgrades.harvest > 0 || s.upgrades.sow > 0) && <div className="automation-controls">{s.upgrades.harvest > 0 && <label><input type="checkbox" checked={s.autoHarvest} onChange={() => dispatch({ type: 'toggle', key: 'autoHarvest' })} />自动收获</label>}{s.upgrades.sow > 0 && <label><input type="checkbox" checked={s.autoSow} onChange={() => dispatch({ type: 'toggle', key: 'autoSow' })} />自动播种</label>}</div>}
      </aside>
    </main>
    <footer className="statusbar"><span><i className="live-dot" />{saveError ? '存档失败，请检查浏览器存储空间' : '自动存档 · 离线成长'}</span><span>点击浇水，加速成长 <span className="keycap">CLICK</span></span><span>累计收获 <b>{s.harvests}</b> 株 · 收益 <b>{number(s.earned)}</b></span></footer>
    <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>

    {screen === 'menu' && !panel && <Modal title="月光奇植园开始菜单" className="start-menu">
      <div className="menu-eyebrow">一小片泥土，一整个奇妙世界</div><h1>月光<span>奇植园</span></h1><div className="menu-english">MOONLIT GARDEN</div>
      <div className="menu-plants"><Sprite id={4} /><Sprite id={9} /><Sprite id={6} /></div>
      <p>种下奇妙的植物，雇用慢悠悠的蜗牛。<br />在这个小小花园里，等一颗星星开花。</p>
      <button className="primary-button" onClick={play}>{s.started ? '继续我的花园' : '开始种植'}<span>▶</span></button>
      <div className="menu-links"><button onClick={() => setPanel('help')}>玩法指南</button><span>◆</span><button onClick={() => setPanel('settings')}>游戏设置</button>{s.started && <><span>◆</span><button onClick={() => setPanel('reset')}>新的花园</button></>}</div>
      <small className="menu-footnote">10 种奇植 · 12 种升级 · 一段约 10–15 分钟的旅程</small>
    </Modal>}
    {panel === 'settings' && <Modal title="游戏设置" close={() => setPanel(null)}>
      <h2>游戏设置</h2><p className="modal-intro">暂歇片刻，花园里的时间也会停下来。</p>
      <div className="music-card"><span className={`music-notes ${settings.music ? 'playing' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span><div><strong>月光下，慢慢生长</strong><small>原创花园摇篮曲 · 72 BPM · 循环播放</small></div></div>
      <label className="setting-row">舒缓背景音乐<input type="checkbox" checked={settings.music} onChange={e => { unlockAudio(); setSettings({ ...settings, music: e.target.checked }) }} /></label>
      <label className="setting-row">音乐音量 <span>{Math.round(settings.musicVolume * 100)}%</span><input aria-label="音乐音量" type="range" min="0" max="1" step=".05" value={settings.musicVolume} onChange={e => { unlockAudio(); setSettings({ ...settings, musicVolume: Number(e.target.value) }) }} /></label>
      <label className="setting-row">游戏音效<input type="checkbox" checked={settings.sound} onChange={e => { unlockAudio(); setSettings({ ...settings, sound: e.target.checked }) }} /></label>
      <label className="setting-row">音效音量 <span>{Math.round(settings.volume * 100)}%</span><input aria-label="音效音量" type="range" min="0" max="1" step=".05" value={settings.volume} onChange={e => setSettings({ ...settings, volume: Number(e.target.value) })} /></label>
      <button className="text-button" onClick={() => { unlockAudio(); sound('coin') }}>试听收获音效 ♪</button>
      <label className="setting-row">植物与助手动画<input type="checkbox" checked={settings.motion} onChange={e => setSettings({ ...settings, motion: e.target.checked })} /></label>
      <p className="settings-note">切到其他标签页时音乐会暂停。每 3 秒自动保存，最多结算 30 分钟离线成长；菜单和设置暂停当前游戏。</p>
      <div className="modal-actions"><button className="primary-button" onClick={() => setPanel(null)}>返回{screen === 'game' ? '花园' : '菜单'}</button>{screen === 'game' && <button className="blue-button" onClick={() => { setPanel(null); setScreen('menu') }}>开始菜单</button>}</div>
    </Modal>}
    {panel === 'help' && <Modal title="玩法指南" close={() => setPanel(null)}><h2>园丁的小手册</h2><ol className="help-list"><li><b>选种、播种</b><p>左侧选择品种，点击空花盆购买并播种。三种低级种子永远免费。</p></li><li><b>浇水、收获</b><p>植物会自然生长，点击可加速。长出完整外观后特殊效果生效；进度满后再次点击收获金币。</p></li><li><b>扩建、雇用助手</b><p>右侧三个分类共有 12 种升级。建议先买园艺手套，再雇用浇水蜗牛。自动播种使用当前种子，金币不足时种嫩芽豆。</p></li><li><b>种出第一颗星星</b><p>培育出三种高级植物即可购买终极种子。星之花自然生长需 8 分钟，点击和蜗牛可小幅加速，其他加成无效。成熟即通关，之后可以继续种植。</p></li></ol><p className="settings-note">星之花不会被自动收获或自动播种。可关闭自动收获，保留植物光环。相邻指上下左右花盆。</p><button className="primary-button" onClick={() => setPanel(null)}>知道了</button></Modal>}
    {panel === 'book' && <Modal title="植物图鉴" className="book-modal" close={() => setPanel(null)}><h2>奇植图鉴 <small>{s.discovered.length} / 10</small></h2><p className="modal-intro">培育至成熟，便能点亮它的名字。成株阶段为 50% 进度。</p><div className="book-grid">{PLANTS.map(p => <article key={p.id} className={s.discovered.includes(p.id) ? 'discovered' : ''}><Sprite id={p.id} /><div><h3>{p.name}<small>{TIERS[p.tier].replace('种子', '')} · {s.discovered.includes(p.id) ? '已培育' : '未培育'}</small></h3><p>{p.effect}</p><span>{p.lore}</span></div></article>)}</div></Modal>}
    {panel === 'reset' && <Modal title="开始新的花园" close={() => setPanel(null)}><h2>重新种下第一颗种子？</h2><p className="modal-intro">这会替换本机的花园存档，金币、植物和升级会重新开始。音效设置会保留。</p><div className="modal-actions"><button className="blue-button" onClick={() => setPanel(null)}>保留我的花园</button><button className="primary-button" onClick={reset}>开始新的花园</button></div></Modal>}
    {won && !panel && <Modal title="星之花绽放，通关成功" className="victory-modal"><div className="victory-stars" aria-hidden="true"><PixelBurst kind="star" /><PixelBurst kind="coin" /></div><span className="menu-eyebrow">一颗星星，为你而开</span><Sprite id={9} /><h2>星之花，绽放了。</h2><p>从第一颗小小的种子，到一整个星光花园。<br />谢谢你的每一次照料。</p><div className="victory-stats"><div><small>通关用时</small><strong data-testid="win-time">{formatTime(s.wonAt ?? 0)}</strong></div><div><small>收获植物</small><strong>{s.harvests}</strong></div><div><small>发现奇植</small><strong>{s.discovered.length}/10</strong></div></div><button className="primary-button" onClick={() => setVictoryDismissed(true)}>继续照料花园</button><small className="menu-footnote">旅程完成了，花园的故事还在继续。</small></Modal>}
  </div>
}
