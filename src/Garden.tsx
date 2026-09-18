import { GardenBackdrop } from './GardenBackdrop'
import { GardenAnimal } from './GardenAnimal'
import { ModalScroll } from './ModalScroll'
import { GardenHabitat } from './GardenHabitat'
import { ToolArt } from './ToolArt'
import { DecorationArt } from './DecorationArt'
import { useEffect, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { PLANTS, TIERS, UPGRADES, SAVE_KEY, newGame, parseSave, reducer, unlocked, price, upgradePrice, clickPower, growthRate, formatTime, capacity, STATIONS, WATER_DURATION, upgradeLock, nextResearch, ULTIMATE_ID, ULTIMATE_TIER, TIER_PLANTS, seedPlantId, GARDENS, gardenCount, teamFor, hireCatalog, hireAvailable, hireLock, seedLock, crewFor, MATERIALS, CREW_NAMES, decorationPrice, GARDEN_PRICES, potPrice, expansionLock, variantFor, plantedReward, DECORATIONS, WEATHER, WEATHER_EFFECTS, WEATHER_DURATION, activeWeather, infiniteWater, type Tier, type GameState } from './game'
import { configureAudio, sound, unlockAudio } from './audio'
import { ExtraPlant } from './ExtraPlant'
import { Sprout } from './Sprout'
import { plantPosition } from './gardenScene'
import './App.css'
import './garden-scene.css'
import './mobile-garden.css'
import './landscape-garden.css'
import './squirrel-picker.css'
import './modal-scroll.css'
import './game-interaction.css'

const number = (n: number) => n >= 1e12 ? `${(n/1e12).toFixed(1)}兆` : n >= 1e8 ? `${(n/1e8).toFixed(1)}亿` : n >= 1e5 ? `${(n/1e4).toFixed(1)}万` : Math.floor(n).toLocaleString('en-US')
const asset = `${import.meta.env.BASE_URL}assets/garden-atlas.png`
function Sprite({ id, className = '' }: { id: number; className?: string }) {
  return <span aria-hidden="true" className={`sprite ${className}`} style={{ backgroundImage: `url(${asset})`, backgroundPosition: `${id % 4 * 100 / 3}% ${Math.floor(id / 4) * 100 / 3}%` }} />
}
function PlantSprite({ id, className = '', variant=false }: { id: number; className?: string; variant?:boolean }) {
  return id < 10 ? <Sprite id={id} className={className} /> : <ExtraPlant id={id} className={className} variant={variant}/>
}
function Animal({kind}:{kind:'harvest'|'sow'}) { return <GardenAnimal kind={kind}/> }
function Icon({ name }: { name: string }) {
  if (name === 'snail') return <GardenAnimal kind="water"/>
  if (name === 'beetle' || name === 'squirrel') return <Animal kind={name === 'beetle' ? 'harvest' : 'sow'} />
  const sprites: Record<string, number> = { coin: 15, seed: 13, water: 14, snail: 12, pot: 10, star: 9 }
  if (name in sprites) return <Sprite id={sprites[name]} className="icon-sprite" />
  const paths: Record<string, string> = {
    leaf: 'M2 3h4v2h2v3h2V5h2V2h4v7h-2v3h-3v5H8v-5H5v-2H3V7H2Z',
    hand: 'M5 3h2v6h1V1h2v8h1V2h2v7h1V4h2v8h-2v4h-2v2H7v-2H5v-3H3V8h2Z',
    boot: 'M5 2h7v8h3v2h3v5H3v-5h2Z',
    shovel: 'M7 1h7v5h-2v6h4v5l-5 3-5-3v-5h4V6H7Zm2 2v2h3V3Z',
    cart: 'M1 3h4l2 9h10l2-7H6V3Zm6 11h3v3H7Zm8 0h3v3h-3Z',
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
  return <dialog ref={ref} className={`wood modal ${close ? 'closable-modal' : ''} ${className}`} aria-label={title} onCancel={e => { e.preventDefault(); close?.() }}>
    {close ? <><header className="modal-header"><strong>{title}</strong><button className="close-button blue-button" aria-label="关闭菜单" onClick={close}>×</button></header><ModalScroll>{children}</ModalScroll></> : children}
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
export default function Garden({ initialState, persist = true }: { initialState?: GameState; persist?: boolean } = {}) {
  const [s, dispatch] = useReducer(reducer, undefined, () => initialState ?? loadGame())
  // Capture absence once at page load; time spent in menus must remain paused.
  const [offlineSeconds] = useState(() => Math.min(1800, Math.max(0, (Date.now() - s.lastSaved) / 1000)))
  const [screen, setScreen] = useState<'menu' | 'game'>('menu')
  const [panel, setPanel] = useState<'settings' | 'book' | 'help' | 'reset' | 'squirrel' | null>(null)
  const [tool, setTool] = useState<'water' | 'cart' | 'shovel' | 'fertilizer' | null>(null)
  const [moveFrom, setMoveFrom] = useState<number | null>(null)
  const [observing, setObserving] = useState(false)
  const [category, setCategory] = useState(0)
  const shopRef = useRef<HTMLElement>(null)
  useEffect(() => { shopRef.current?.scrollTo({top:0}) }, [category, s.activeGarden])
  const garden = GARDENS[s.activeGarden], team = teamFor(s, s.activeGarden)
  const [inspectedPot, setInspectedPot] = useState<number | null>(null)
  const [landscapeShopOpen, setLandscapeShopOpen] = useState(true)
  const [mobilePanel, setMobilePanel] = useState<'garden' | 'seeds' | 'upgrades'>('garden')
  const [settings, setSettings] = useState(loadSettings)
  const [toast, setToast] = useState('')
  const [saveError, setSaveError] = useState(false)
  const [victoryDismissed, setVictoryDismissed] = useState(s.wonAt !== null)
  const [floats, setFloats] = useState<{ id: number; pot: number; text: string; kind: string }[]>([])
  const latestReveal = Math.max(-1, ...s.pots.map(p => p.revealedAt ?? -1))
  const playedReveal = useRef(latestReveal)
  useEffect(() => {
    if (latestReveal > playedReveal.current && s.elapsed - latestReveal < 1) sound('reveal')
    playedReveal.current = latestReveal
  }, [latestReveal, s.elapsed])
  const current = useRef(s)
  const floatId = useRef(0)
  const offlineApplied = useRef(false)
  const won = s.wonAt !== null && !victoryDismissed && screen === 'game' && !observing
  const paused = screen !== 'game' || panel !== null || won
  const harvestedKinds = s.harvestCounts.filter(count => count > 0).length
  const selected = PLANTS[s.selected]
  const rainbow = infiniteWater(s)
  const weather = activeWeather(s)
  const waterLevel = rainbow?3: s.player.stock===0?0:s.player.stock/capacity(s,'player')<=.25?1:s.player.stock/capacity(s,'player')<=.65?2:3
  const waterState = rainbow?'无限水量':s.player.phase==='service'?'补水中':['空壶','将空','半满','满水'][waterLevel]

  useEffect(() => { current.current = s }, [s, persist])
  useEffect(() => {
    configureAudio(settings.sound && !observing, settings.volume, settings.music, settings.musicVolume)
    try { localStorage.setItem('moon-garden-settings', JSON.stringify(settings)) } catch { /* Gameplay remains available without storage. */ }
  }, [settings, observing])
  useEffect(() => {
    if (paused) return
    let before = Date.now()
    const timer = window.setInterval(() => { const now = Date.now(); dispatch({ type: 'tick', dt: (now - before) / 1000 }); before = now }, 250)
    return () => clearInterval(timer)
  }, [paused])
  useEffect(() => {
    const save = () => {
      if (!persist || !current.current.started) return
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...current.current, lastSaved: Date.now() })); setSaveError(false) } catch { setSaveError(true) }
    }
    const timer = window.setInterval(save, 3000)
    window.addEventListener('pagehide', save)
    return () => { clearInterval(timer); window.removeEventListener('pagehide', save); save() }
  }, [persist])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4000); return () => clearTimeout(timer) }, [toast])
  useEffect(() => { if (!floats.length) return; const timer = setTimeout(() => setFloats([]), 900); return () => clearTimeout(timer) }, [floats])
  useEffect(() => { if (s.clicks > 0) sound('water') }, [s.clicks])
  useEffect(() => { if (persist && s.started && s.elapsed === 0) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)) } catch { /* The periodic save reports storage errors. */ } } }, [s, persist])
  useEffect(() => { if (won) sound('win') }, [won])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !(e.target instanceof Element && e.target.closest('input,textarea,[contenteditable=true]'))) { e.preventDefault(); window.getSelection()?.removeAllRanges(); return }
      if (e.key === 'Escape' && observing) { setObserving(false); return }
      if (e.key === 'Escape' && !panel && screen === 'game' && !won) setPanel('settings') }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [screen, panel, won, observing])

  function play() {
    unlockAudio(); sound('plant')
    if (s.started && !offlineApplied.current) {
      const gap = offlineSeconds
      if (gap > 10) { dispatch({ type: 'tick', dt: gap }); setToast(`离线照料了 ${formatTime(gap)}，欢迎回到花园。`) }
    }
    offlineApplied.current = true; dispatch({ type: 'start' }); setScreen('game')
  }
  const landscapeLayout = () => window.matchMedia('(orientation: landscape) and (max-height: 600px) and (max-width: 1200px)').matches
  const compactLayout = () => landscapeLayout() || window.matchMedia('(max-width: 620px), (max-width: 980px) and (orientation: portrait), (pointer: coarse) and (max-width: 980px)').matches
  function showMobilePanel(next: 'garden' | 'seeds' | 'upgrades') {
    setMobilePanel(next)
    if (next === 'upgrades') setLandscapeShopOpen(true)
    if (compactLayout()) window.scrollTo({top:0,behavior:'instant'})
  }
  function potClick(index: number) {
    if (paused || observing) return
    setInspectedPot(index)
    const p = s.pots[index]
    if (!tool && p.plant !== null && compactLayout()) return
    if (tool === 'fertilizer') {
      if(p.plant===null || p.plant===ULTIMATE_ID || p.growth>=PLANTS[p.plant].seconds || s.fertilizer===0){setToast('肥料仅能用于未成熟的非终极植物，每次消耗一份。');return}
      dispatch({type:'fertilize',index});sound('reveal');setFloats(f=>[...f,{id:floatId.current++,pot:index,text:'立即成熟！',kind:'star'}]);return
    }
    if (tool === 'shovel') {
      if (p.plant === null) { setToast('这是空花盆，无需挖除。再次点击铲子可取消选择。'); return }
      dispatch({ type: 'dig', index }); sound('tap')
      setFloats(f => [...f.slice(-9), { id: floatId.current++, pot: index, text: '已挖除 · 无收益', kind: 'dig' }]); return
    }
    if (tool === 'cart') {
      if (moveFrom === null) {
        if (p.plant === null) { setToast('先选择要移动的植物，再点击目标花盆。'); return }
        setMoveFrom(index); sound('tap'); return
      }
      if (moveFrom === index) { setMoveFrom(null); return }
      if (s.pots[moveFrom]?.plant === null) { setMoveFrom(null); setToast('这株植物已经被收获，请重新选择。'); return }
      dispatch({ type: 'move', from: moveFrom, to: index }); setMoveFrom(null); sound('plant')
      setFloats(f => [...f.slice(-7), ...[moveFrom, index].map(pot => ({ id: floatId.current++, pot, text: '搬运完成', kind: 'move' }))]); return
    }
    if (tool === 'water' && p.plant !== null && p.growth < PLANTS[p.plant].seconds) {
      if ((p.watering ?? 0) > 0) return
      if(p.plant===ULTIMATE_ID && s.elapsed-p.wateredAt<5){setToast('星之花正在吸收水分，每5秒可浇水一次。');return}
      if (!rainbow && s.player.phase !== 'idle') { setToast('水壶正在装填，请稍等。'); return }
      if (!rainbow && s.player.stock === 0) { setToast('水壶空了，请点击花园左下角的水池打水。'); return }
      dispatch({ type: 'water', index }); return
    }
    let text = ''
    if (p.plant === null) {
      if (seedLock(s,selected.tier)) { setToast(seedLock(s,selected.tier)!); return }
      if (s.coins < price(s, selected)) { setToast(`金币不足：${TIERS[selected.tier]}需要 ${price(s, selected)} 金币。普通种子始终免费。`); return }
      text = '种下了！'; sound('plant')
    } else if (p.growth >= PLANTS[p.plant].seconds) { text = `+${number(plantedReward(s,index))}`; sound('coin') }
    else { setToast('选择顶部水壶，再点击植物浇水。'); return }
    setFloats(f => [...f.slice(-9), { id: floatId.current++, pot: index, text, kind: p.plant === null ? 'plant' : p.growth >= PLANTS[p.plant].seconds ? 'coin' : 'water' }])
    dispatch({ type: 'pot', index })
  }
  function choose(id: number) { setTool(null); setMoveFrom(null); dispatch({ type: 'select', id }); sound('tap'); showMobilePanel('garden') }
  function reset() { setTool(null); setMoveFrom(null); setObserving(false); setInspectedPot(null); setFloats([]); setMobilePanel('garden'); dispatch({ type: 'reset' }); offlineApplied.current = true; setVictoryDismissed(false); setPanel(null); setScreen('game'); setCategory(0); setToast('新的花园，从一包免费种子开始。') }


  const squirrelPicker = team.workers.sow.length>0 && <button className="squirrel-picker-button tool-button" aria-label={`松鼠播种选种，当前${TIERS[team.sowTier]}`} aria-haspopup="dialog" title={`本园松鼠播种：${TIERS[team.sowTier]}`} onClick={()=>setPanel('squirrel')}>
    <GardenAnimal kind="sow"/>
    <span className={`squirrel-current-seed tier-${team.sowTier}`}><span className="seed-bag"><Sprite id={13}/></span></span><span>松鼠</span>
  </button>

  return <div onDragStart={e=>e.preventDefault()} className={`game-shell ${landscapeShopOpen ? 'landscape-shop-open' : 'landscape-shop-closed'} ${!settings.motion ? 'reduce-motion' : ''} ${screen === 'menu' ? 'on-menu' : ''} ${paused ? 'is-paused' : ''} ${observing ? 'observation-mode' : ''}`}>
    <Fireflies />
    {observing && <div className="observation-toolbar"><span>{s.wonAt !== null ? '星之花已绽放 · 花园仍在生长' : '静静生长 · 助手继续照料'}</span><button className="blue-button" onClick={() => setObserving(false)}>退出观赏 <small>Esc</small></button></div>}
    <header className="topbar">
      <div className="stat wood coin-stat"><Sprite id={15} /><div><small>花园金币</small><strong data-testid="coins">{number(s.coins)}</strong></div></div>
      <div className="stat wood"><Icon name="leaf" /><div><small>收获图鉴</small><strong>{harvestedKinds}<em>/ {PLANTS.length}</em></strong></div></div>
      <div className="brand"><span>MOONLIT GARDEN</span><h1>月光奇植园</h1></div>
      <div className="time-display"><span className="live-dot" />{s.wonAt !== null ? '自由种植' : '花园时光'}<strong data-testid="elapsed">{formatTime(s.elapsed)}</strong></div>
      <button className="landscape-shop-toggle blue-button" aria-expanded={landscapeShopOpen} aria-controls="garden-shop" onClick={() => setLandscapeShopOpen(!landscapeShopOpen)}>{landscapeShopOpen ? '收起商店' : '打开商店'}</button>
      <button className="blue-button icon-button" aria-label="植物图鉴" onClick={() => setPanel('book')}><Icon name="book" /></button>
      <button className="blue-button icon-button" aria-label="游戏设置" onClick={() => setPanel('settings')}><Icon name="gear" /></button>
    </header>
    <nav className="mobile-nav" aria-label="游戏面板">{(['garden', 'seeds', 'upgrades'] as const).map((id, i) => <button key={id} className={mobilePanel === id ? 'active' : ''} aria-current={mobilePanel === id ? 'page' : undefined} onClick={() => showMobilePanel(id)}>{['花园', '种子', '商店'][i]}</button>)}</nav>
    <main className="game-layout">
      <aside className={`seed-panel wood ${mobilePanel === 'seeds' ? 'mobile-active' : ''}`} aria-label="种子商店">
        <h2 className="panel-title"><Icon name="leaf" />种 子<Icon name="leaf" /></h2>
        <div className="tier-list">{TIERS.map((name, i) => {
          const open = unlocked(s, i as Tier), active = selected.tier === i
          return <button key={name} className={`tier-card blue-button tier-${i} ${active ? 'selected' : ''}`} aria-pressed={active} disabled={!open} onClick={() => choose(seedPlantId(i as Tier))}>
            <span className="seed-bag"><Sprite id={13} /></span>
            <span className="tier-copy"><strong>{name}</strong><b>{i === 0 ? '免费 · 无限' : `${number(price(s, PLANTS[seedPlantId(i as Tier)]))} 金币`}</b><small>{i === ULTIMATE_TIER ? '种出星星 · 完成旅程' : seedLock(s,i as Tier)??`${TIER_PLANTS[i].filter(id => s.harvestCounts[id] > 0).length} / 4 已收获`}</small></span>
          </button>
        })}</div>
        <div className="landscape-seed-picker">{squirrelPicker}</div>
        <div className="shop-note"><Icon name="seed" /><p>选好等级，点击空花盆<br />购买并随机播种。</p></div>
      </aside>

      <section className={`garden-section ${mobilePanel === 'garden' ? 'mobile-active' : ''}`} aria-label="花园">
        <div className={`garden-board garden-${garden.theme} wood zen-garden ${team.workers.sow.length?'has-squirrels':''}`}>
          <GardenBackdrop page={s.activeGarden}/>
        <div className="garden-tools" role="group" aria-label="园艺工具">
          <div className="tool-slots">
            <div className="watering-cubby">
              <button className={`tool-button water-tool ${tool === 'water' ? 'selected' : ''} ${s.player.phase==='service'?'is-refilling':''}`} data-water-state={waterState} title={`水壶 · ${waterState}。点击选择水壶；到花园左下角的水池打水。`} aria-label={`水壶工具 · ${waterState}`} aria-pressed={tool === 'water'} onClick={() => { setTool(tool==='water'?null:'water');setMoveFrom(null) }}><ToolArt kind="water" waterLevel={waterLevel}/>{rainbow && <b className="tool-quantity">∞</b>}<span>水壶</span></button>
            </div>
            <button className={`tool-button ${tool === 'fertilizer' ? 'selected' : ''}`} title="肥料 · 使非终极植物立即成熟" aria-label="肥料工具" aria-pressed={tool === 'fertilizer'} onClick={()=>{setTool(tool === 'fertilizer' ? null : 'fertilizer');setMoveFrom(null)}}><ToolArt kind="fertilizer"/><b className="tool-quantity">×{s.fertilizer}</b><span>肥料</span></button>
            <button className={`tool-button ${tool === 'cart' ? 'selected' : ''}`} title="小推车 · 选择植物，切换花园后点击花盆搬运或交换" aria-label="小推车工具" aria-pressed={tool === 'cart'} onClick={() => { setTool(tool === 'cart' ? null : 'cart'); setMoveFrom(null) }}><ToolArt kind="cart"/>{moveFrom !== null && s.pots[moveFrom]?.plant != null && <span className="cart-passenger" aria-hidden="true"><PlantSprite id={s.pots[moveFrom].plant!} variant={!!s.pots[moveFrom].variant}/></span>}<span>小推车</span></button>
            <button className={`tool-button ${tool === 'shovel' ? 'selected' : ''}`} title="铲子 · 挖除植物，不获得收益" aria-label="铲子工具" aria-pressed={tool === 'shovel'} onClick={() => { setTool(tool === 'shovel' ? null : 'shovel'); setMoveFrom(null) }}><ToolArt kind="shovel"/><span>铲子</span></button>
            {squirrelPicker}
          </div>
          <div className="tool-shelf-actions"><button className="text-button" onClick={()=>{setObserving(true);setMobilePanel('garden');setFloats([]);setToast('')}}>观赏</button><button className="text-button" aria-label="玩法指南" onClick={()=>setPanel('help')}>?</button></div>
          <div className="seed-shortcuts" role="group" aria-label="快捷选种">
            {TIERS.map((name, i) => {
              const tier=i as Tier
              if (!unlocked(s,tier)) return null
              const id=seedPlantId(tier), cost=price(s,PLANTS[id]), active=selected.tier===tier
              return <button key={tier} className={`seed-shortcut blue-button tier-${tier} ${active?'selected':''} ${s.coins<cost?'unaffordable':''}`} aria-pressed={active} aria-label={`${name}，${cost===0?'免费':`${number(cost)}金币`}${s.coins<cost?'，金币不足':''}`} onClick={()=>choose(id)}>
                <span className="seed-bag"><Sprite id={13}/></span><span><strong>{name.replace('种子','')}</strong><small>{s.coins<cost?'不足 · ':''}{cost===0?'免费':number(cost)}</small></span>
              </button>
            })}
          </div>
          <p className="tool-hint">{tool === 'fertilizer' ? '消耗 1 份，让未成熟的非终极植物立即成熟 · 手动收获时 5% 掉落' : tool === 'shovel' ? '点击挖除任何植物 · 无收益 · 再点铲子取消' : tool === 'cart' ? moveFrom === null ? '选择植物 → 用花园左右箭头跨园 → 点击花盆搬运或交换' : `已选 ${GARDENS[Math.floor(moveFrom/15)].name} · ${moveFrom%15+1} 号盆，可跨园搬运；再点小推车取消` : tool === 'water' ? '点击植物浇水 · 点击左下角水池打水' : '点击空盆播种，点击成熟植物收获'}</p>
        </div>
          <h2 className="scene-garden-name" aria-live="polite">{garden.name}</h2>
          <button className="scene-arrow scene-prev" aria-label="上一座花园" disabled={s.activeGarden===0} onClick={()=>{dispatch({type:'garden',index:s.activeGarden-1});setInspectedPot(null)}}><svg viewBox="0 0 32 40" aria-hidden="true"><path d="M29 9H17V2L2 20l15 18v-8h12Z"/></svg></button>
          <button className="scene-arrow scene-next" aria-label="下一座花园" disabled={s.activeGarden>=gardenCount(s)-1} onClick={()=>{dispatch({type:'garden',index:s.activeGarden+1});setInspectedPot(null)}}><svg viewBox="0 0 32 40" aria-hidden="true"><path d="M3 9h12V2l15 18-15 18v-8H3Z"/></svg></button>
          {weather !== null && <div className={`weather-overlay weather-${s.weather.kind}`} aria-label={`${WEATHER[s.weather.kind]}天气，${WEATHER_EFFECTS[s.weather.kind]}，剩余${Math.ceil(s.weather.started+WEATHER_DURATION-s.elapsed)}秒`}><span>{WEATHER[s.weather.kind]} · {WEATHER_EFFECTS[s.weather.kind]} · {Math.ceil(s.weather.started+WEATHER_DURATION-s.elapsed)} 秒</span>{s.weather.kind===2&&<svg className="pixel-rainbow" viewBox="0 0 64 32" shapeRendering="crispEdges" aria-hidden="true">{["#bba1d3","#8fcbdc","#b0d398","#e6cf88","#dc94a0"].map((color,i)=><path key={color} d={`M${4+i*2} 30V${16+i*2}h6v-6h8V${4+i*2}h${28-i*4}v6h8v6h6V30`} fill="none" stroke={color} strokeWidth="2"/>)}</svg>}{Array.from({length:28},(_,i)=><i key={i} style={{left:`${i*37%100}%`,top:`${i*23%100}%`,animationDelay:`-${i*.19}s`}}/>)}</div>}
          <div className="garden-decorations" aria-hidden="true">{team.decorations.filter(id=>!team.hiddenDecorations.includes(id)).map(id=><div key={id} className={`decoration decoration-${id}`}><DecorationArt id={id}/></div>)}</div>
          <div className="greenhouse-rail" aria-hidden="true"><span /> <span /> <span /></div>
          <div className="board-corner tl" /><div className="board-corner tr" /><div className="board-corner bl" /><div className="board-corner br" />
          <div className="garden-floor" inert={observing}><GardenHabitat page={s.activeGarden}/><svg className="garden-landmark" viewBox="0 0 120 40" preserveAspectRatio={s.activeGarden === 1 ? "none" : "xMidYMid meet"} aria-hidden="true" shapeRendering="crispEdges">{s.activeGarden===0?<path fill="#476848" d="M12 36V8h4v28h-4M4 12h8v4H4m12 4h10v4H16m-12 2h8v4H4"/>:s.activeGarden===1?<><path fill="#428eaa" d="M0 22h26v-8h30v8h30v-9h34v17H86v7H56v-9H26v8H0Z"/><path fill="#a0dfd0" d="M0 23h26v-6h28v4H28v6H0m64 0h22v-6h24v4H90v6H64Z"/></>:s.activeGarden===2?<><path fill="#80552e" d="M41 29h38v8H41zM48 23h24v6H48z"/><path fill="#ead18b" d="M47 18h27v7H47z"/><path fill="#5e4530" d="M59 1h4v21h-4z"/></>:s.activeGarden===3?<><path fill="#58a4b1" d="M30 35V16l8-12 8 12v19zm24 0V12L65 0l11 12v23zm30 0V21l8-10 8 10v14z"/><path fill="#d2fcf0" d="M38 4v26h-4V16zm27-4v30h-5V12zm27 11v21h-4V21z"/></>:<><path fill="none" stroke="#c7a559" strokeWidth="3" d="M38 5h45v23H38zM50 0h20v36H50z"/><path fill="#f5db78" d="M56 12h10v10H56z"/><path fill="#66517c" d="M45 34h34v5H45z"/></>}</svg>
            <div className="floor-details" aria-hidden="true"><i className="moss moss-a" /><i className="moss moss-b" /><i className="moss moss-c" /><span className="garden-stones">▪ ▰ ▪</span></div>
            {Array.from({ length: 15 }, (_, localIndex) => {
            const i = s.activeGarden*15+localIndex
            const pot = s.pots[i]
            const pos = plantPosition(localIndex)
            const placement = { left: `${pos.x}%`, top: `${pos.y}%`, zIndex: Math.round(pos.y), '--sway-delay': `${-i * .37}s` } as CSSProperties
            if (localIndex>team.potCount) return <span key={i} className="locked-pot ground-marker future-pot" style={placement} aria-hidden="true"><span>·</span></span>
            if (localIndex===team.potCount) return <button key={i} data-testid="buy-pot" className="locked-pot ground-marker purchase-pot" style={placement} disabled={s.coins<potPrice(s)} aria-label={`购买第${localIndex+1}个花盆，${potPrice(s)}金币`} onClick={() => { dispatch({type:'expand'}); sound('buy'); setToast(`已添加第 ${team.potCount+1} 个花盆`); }}><span>＋</span><small>◈ {number(potPrice(s))}</small></button>
            const p = pot.plant === null ? null : PLANTS[pot.plant]
            const ready = p !== null && pot.growth >= p.seconds
            const seed = p !== null && pot.growth < p.seconds * .15
            const young = p !== null && pot.growth < p.seconds * .5
            const sprite = p === null || young ? null : p.id
            return <button key={i} data-testid={`pot-${i}`} aria-label={`花盆${i + 1} ${p?.name ?? '空闲'} ${tool === 'fertilizer' ? '施肥' : tool === 'shovel' ? '挖除' : tool === 'cart' ? moveFrom === null ? '选择移动' : '移动到此处' : !p ? '播种' : ready ? '收获' : tool === 'water' ? '使用水壶' : '生长中'}`} className={`pot ${inspectedPot === i ? 'inspected' : ''} ${moveFrom === i ? 'move-source' : ''} ${tool === 'cart' && moveFrom !== null ? 'move-destination' : ''} ${(pot.watering ?? 0) > 0 ? 'watering-cooldown' : ''} ${ready ? 'ready' : ''} ${p === null ? 'empty-pot' : ''} ${p?.tier === ULTIMATE_TIER ? 'ultimate' : ''} ${p && !seed ? 'alive' : ''} plant-${p?.id ?? 'empty'}`} style={placement} onClick={() => potClick(i)}>

              {p && <span className="plant-name">{`${pot.variant ? variantFor(p!.id)?.name + ' · ' : ''}${p.name}`}</span>}
              {p && !young && p.tier > 0 && <span className={`plant-aura aura-${p.tier}`} aria-hidden="true"><i /><i /><i /></span>}
              <span key={`${sprite}-${ready}`} className="plant-art-slot">{sprite === null ? <Sprite id={10} className="pot-art" /> : <PlantSprite id={sprite} className="pot-art" variant={!!pot.variant} />}</span>
              {pot.revealedAt !== undefined && s.elapsed - pot.revealedAt < 1 && <span key={`reveal-${pot.revealedAt}`} className="rare-reveal" aria-hidden="true">✦<PixelBurst kind="star" /></span>}
              {p && young && <Sprout id={p.id} tiny={seed} />}
              {(pot.watering ?? 0) > 0 && <span className="tool-pour" style={{ animationDuration: `${WATER_DURATION}s` }} aria-hidden="true"><ToolArt kind="water" waterLevel={waterLevel}/><span className="tool-water-stream">▪<i>▪</i><b>▪</b></span></span>}
              {(pot.watering ?? 0) > 0 && <span className="watering-timer" data-testid={`watering-${i}`} aria-label="本株浇水冷却中"><Progress value={(pot.watering ?? 0) / WATER_DURATION} /></span>}
              {floats.some(f => f.pot === i && f.kind === 'move') && <span className="tool-cart-animation" aria-hidden="true"><ToolArt kind="cart" /></span>}
              {floats.some(f => f.pot === i && f.kind === 'dig') && <span className="tool-dig-animation" aria-hidden="true"><Icon name="shovel" /><i /><i /><i /></span>}
              {ready && <span className="ripe-sparkles" aria-hidden="true">✦<i>✧</i><b>✦</b></span>}
              {p && s.elapsed - pot.wateredAt < .65 && <span key={`water-${pot.wateredAt}`} className="water-drop" aria-hidden="true">♦<PixelBurst kind="water" /></span>}
              <span className="pot-sign"><strong>{p ? ready ? '可收获' : seed ? '萌芽中' : young ? '生长中' : p.tier === ULTIMATE_TIER ? '凝聚星光' : '成株生长' : '空 闲'}</strong><Progress value={p ? pot.growth / p.seconds : 0} gold={p?.tier === ULTIMATE_TIER} /><small>{tool === 'shovel' ? p ? '挖除 · 无收益' : '空花盆' : p ? ready ? `+${number(plantedReward(s,i))} 金币` : `${formatTime((p.seconds - pot.growth) / growthRate(s))}` : '点击播种'}</small></span>
              {floats.filter(f => f.pot === i).map(f => <span className={`pot-feedback feedback-${f.kind}`} key={f.id}><span className="float-label">{f.text}</span>{f.kind !== 'water' && <PixelBurst kind={f.kind} />}</span>)}
            </button>
          })}
            <div className={`supply-station water-station ${s.player.phase==='service'?'pool-refilling':''}`} style={{ left: `${STATIONS.water.x}%` }}>
              <button className="pool-refill-button" aria-label={rainbow?'彩虹期间无需补水':s.player.phase==='service'?'水池 · 打水中':s.player.stock===capacity(s,'player')?'水池 · 水壶已满':'水池 · 给水壶打水'} title="点击水池给水壶打水，蜗牛也在这里补水" disabled={paused||rainbow||s.player.phase!=='idle'||s.player.stock===capacity(s,'player')} onClick={()=>{setTool('water');setMoveFrom(null);dispatch({type:'refill'});sound('tap')}}>
                <span className="pixel-pool" aria-hidden="true"/>
                {s.player.phase==='service'&&<span className="pool-dipping-can" aria-hidden="true"><ToolArt kind="water" waterLevel={waterLevel}/><i/><i/></span>}
                <b>{rainbow?'彩虹 · 无限水量':s.player.phase==='service'?'打水中…':s.player.stock===capacity(s,'player')?'水池 · 壶已满':'水池 · 点击打水'}</b>
              </button>
            </div>
            <div className="supply-station seed-station" style={{ left: `${STATIONS.sow.x}%` }}><span className="pixel-crate"><Sprite id={13} /></span><b>种子箱</b></div>
            <div className="supply-station harvest-station" style={{ left: `${STATIONS.harvest.x}%` }}><span className="pixel-crate" /><b>收获站</b></div>
            {s.upgrades.lantern > 0 && <div className="scene-lanterns" aria-hidden="true">{Array.from({ length: s.upgrades.lantern }, (_, i) => <span key={i} style={{ left: `${24 + i * 26}%` }}>▥</span>)}</div>}
            {([
              ...team.snails.map((w, i) => ({ kind: 'water' as const, w, on: true, name: `浇水蜗牛${i + 1}`, level: team.equipment.water })),
              ...(['harvest','sow'] as const).flatMap(kind=>team.workers[kind].map((w,i)=>({kind,w,on:kind==='harvest'?team.autoHarvest:team.autoSow&&s.coins>=PLANTS[seedPlantId(team.sowTier)].cost,name:`${CREW_NAMES[kind]}${i+1}`,level:team.equipment[kind]})))
            ]).map(({ kind, w, on, name, level }, i) => <div key={`${kind}-${i}`} data-testid={`worker-${kind}`} data-phase={w.phase} data-target={w.target ?? ''} className={`garden-resident task-animal actor-${kind} ${on ? `worker-${w.phase}` : 'worker-paused'} living-animal material-${level}`} style={{ left: `${w.x}%`, top: `${w.y}%`, zIndex: Math.round(w.y) + 1, '--facing': w.facing, '--equipment-scale': 1, '--gait-delay': `${-i*.29}s`, '--gear-color': MATERIALS[level].color, '--gear-light': MATERIALS[level].light } as CSSProperties} aria-label={`${name} · ${MATERIALS[level].name}装备：${!on ? '休息中' : w.phase === 'return' ? '返回补给站' : w.phase === 'service' ? kind === 'harvest' ? '交付收获' : '装填补给' : w.phase === 'act' ? '正在照料' : w.phase === 'walk' ? '前往花盆' : '等待目标'}`}>
              <span className="resident-shadow" />
              <span className="resident-body"><GardenAnimal kind={kind}/>
                {on && kind==='water' && w.phase==='act' && <span className="animal-water-drops" aria-hidden="true"><i/><i/><i/></span>}
                {on && kind==='sow' && w.phase==='act' && <span className="creature-seeds" aria-hidden="true"><i/><i/><i/></span>}
                {on && kind==='harvest' && w.phase==='act' && <span className="creature-leaf" aria-hidden="true"><svg viewBox="0 0 12 12" shapeRendering="crispEdges"><path d="M2 1h7v2h2v5H8v2H4v1H2V8H1V3h1Z" fill="#b6cc65"/><path d="M3 8h2V6h2V4h2V3H7v2H5v2H3Z" fill="#466c35"/></svg></span>}
              </span>
            </div>)}
          </div>
          <div className="garden-scene-caption"><small>{garden.subtitle} · 产值 ×{garden.reward} · 环境生长 ×{garden.growth}</small><span>{inspectedPot !== null && s.pots[inspectedPot] ? (() => { const pot = s.pots[inspectedPot]; const p = pot.plant === null ? null : PLANTS[pot.plant]; return p ? `${p.name} · ${pot.growth >= p.seconds ? '已成熟，点击收获' : `成长 ${Math.floor(pot.growth / p.seconds * 100)}%`} · 收获 ${plantedReward(s,inspectedPot)} 金币` : '空花盆 · 点击种下当前选择的种子' })() : '选择顶部工具，再点击盆栽使用'}</span><small>{team.snails.length ? `${team.snails.length} 只蜗牛在园中漫游` : '雇用蜗牛后，它会往返水池与花盆'}</small></div>
        </div>
        <div className={`mobile-plant-info ${inspectedPot !== null ? 'has-selection' : ''}`} aria-label="植物信息" data-testid="plant-inspector">
          <button className="landscape-info-close blue-button" aria-label="关闭植物信息" onClick={() => setInspectedPot(null)}>×</button>
          {inspectedPot !== null && s.pots[inspectedPot] ? (() => {
            const pot=s.pots[inspectedPot], plant=pot.plant===null?null:PLANTS[pot.plant]
            if (!plant) return <div><strong>第 {inspectedPot%15+1} 盆 · 空花盆</strong><p>点击花盆种下{TIERS[selected.tier]}</p></div>
            const ready=pot.growth>=plant.seconds
            return <><div className="mobile-plant-copy"><strong>{pot.variant ? variantFor(plant.id)?.name+' · ' : ''}{plant.name}</strong><p>成长 {Math.floor(pot.growth/plant.seconds*100)}% · {ready?'已成熟':formatTime((plant.seconds-pot.growth)/growthRate(s,Math.floor(inspectedPot/15)))}</p><Progress value={pot.growth/plant.seconds}/><p>收获 <b>◈ {number(plantedReward(s,inspectedPot))}</b></p></div><button className="blue-button" disabled={paused} onClick={()=>{if(ready){dispatch({type:'pot',index:inspectedPot});sound('coin');setToast(plant.name+' · 收获 +'+number(plantedReward(s,inspectedPot)))}else{setTool('water');setMoveFrom(null);setToast('水壶已选中，点击植物浇水')}}}>{ready?'收获':'选水壶'}</button></>
          })() : <div><strong>点击植物查看详情</strong><p>名称、成长与收益显示在这里</p></div>}
        </div>
      </section>

      <aside id="garden-shop" ref={shopRef} className={`upgrade-panel ${mobilePanel === 'upgrades' ? 'mobile-active' : ''}`} aria-label="花园商店">
        <h2 className="panel-title"><Icon name="leaf"/>商 店<Icon name="leaf"/></h2>
        <div className="shop-location">{category===0?'全园研究':garden.name}<small>{category===0?'等级全园同步 · 新花园解锁下一等级':'购买与效果仅限当前花园'}</small></div>
        <div className="upgrade-tabs" role="tablist" aria-label="商店分类">{['升级','雇佣','装饰'].map((name,i)=><button role="tab" aria-selected={category===i} key={name} onClick={()=>{setCategory(i);sound('tap')}} className={category===i?'selected':''}><Icon name={['leaf','snail','star'][i]}/><span>{name}</span></button>)}</div>
        <div className="upgrade-list">
          {category===0 && <>{nextResearch(s).map(u=><button key={u.id} data-testid={`upgrade-${u.id}`} className="upgrade-card" disabled={s.coins<upgradePrice(s,u)||!!upgradeLock(s,u.id)} onClick={()=>{dispatch({type:'buy',id:u.id});sound('buy');setToast(`${u.name} · ${u.detail}`)}}><span className="upgrade-art"><Icon name={u.icon}/></span><span className="upgrade-copy"><strong>{u.name}</strong><b>◈ {number(u.cost)}</b><span className="upgrade-description">{upgradeLock(s,u.id)??u.detail}</span><small>第{u.page+1}园解锁 · 全园共享</small></span></button>)}{UPGRADES.every(u=>s.purchases.includes(u.id))&&<p className="shop-empty">全园研究已满级。<br/>可继续招募助手，或开辟下一座花园。</p>}</>}
          {category===1 && <>{hireCatalog(s.activeGarden).filter(u=>hireAvailable(team,u)).map(u=><button key={u.id} data-testid={`hire-${u.id}`} className="upgrade-card" disabled={s.coins<u.cost||!!hireLock(s,u)} onClick={()=>{dispatch({type:'hire',id:u.id});sound('buy');setToast(`${garden.name} · ${u.name}`)}}><span className="upgrade-art"><Icon name={u.kind==='water'?'snail':u.kind==='harvest'?'beetle':'squirrel'}/></span><span className="upgrade-copy"><strong>{u.name}</strong><b>◈ {number(u.cost)}</b><span className="upgrade-description">{hireLock(s,u)??u.detail}</span></span></button>)}{hireCatalog(s.activeGarden).every(u=>!hireAvailable(team,u))&&<p className="shop-empty">本园团队已满编，装备全部达到钻石制。</p>}</>}
          {category===2 && <>{DECORATIONS.filter(d=>!team.decorations.includes(d.id)).map(d=><button key={d.id} data-testid={`decorate-${d.id}`} className="upgrade-card" disabled={s.coins<decorationPrice(d.cost,s.activeGarden)} onClick={()=>{dispatch({type:'decorate',id:d.id});sound('buy')}}><span className="upgrade-art"><Icon name="star"/></span><span className="upgrade-copy"><strong>{d.name}</strong><b>◈ {number(decorationPrice(d.cost,s.activeGarden))}</b><span className="upgrade-description">{d.detail} · 仅本园外观</span></span></button>)}{team.decorations.length===DECORATIONS.length&&<p className="shop-empty">本园装饰已购齐。可在设置中调整展示。</p>}</>}
        </div>
        <div className="garden-expansion" aria-label="花园扩建">{gardenCount(s)<5&&<button className="blue-button" disabled={!!expansionLock(s)||s.coins<GARDEN_PRICES[gardenCount(s)]} onClick={()=>{dispatch({type:'open-garden'});setInspectedPot(null);setMoveFrom(null);sound('buy')}}>{expansionLock(s)??`开辟${GARDENS[gardenCount(s)].name} · ◈ ${number(GARDEN_PRICES[gardenCount(s)])}`}</button>}</div>
        <div className="garden-bonuses"><div className="eyebrow">本园团队 · 独立经营</div>{(['water','harvest','sow'] as const).map(kind=><p key={kind}><span>{CREW_NAMES[kind]}</span><b>{crewFor(team,kind).length}/5 · {MATERIALS[team.equipment[kind]].name}</b></p>)}<div className="eyebrow">全园能力 · {s.purchases.length}/{UPGRADES.length} 次研究</div><p><span>手动浇水</span><b>+{clickPower(s)} 秒</b></p><p><span>本页自然成长</span><b>×{growthRate(s).toFixed(1)}</b></p><p><span>本页收获收益</span><b>×{Number((2**s.upgrades.profit*garden.reward).toFixed(2))}</b></p></div>
        <div className="automation-controls">{team.workers.harvest.length>0&&<label><input type="checkbox" checked={team.autoHarvest} onChange={()=>dispatch({type:'toggle',key:'autoHarvest'})}/>本园自动收获</label>}{team.workers.sow.length>0&&<label><input type="checkbox" checked={team.autoSow} onChange={()=>dispatch({type:'toggle',key:'autoSow'})}/>本园自动播种</label>}</div>
        <button className="mobile-return blue-button" onClick={()=>{showMobilePanel('garden');if(landscapeLayout())setLandscapeShopOpen(false)}}>← 返回花园</button>
      </aside>
    </main>
    <footer className="statusbar"><span><i className="live-dot" />{saveError ? '存档失败，请检查浏览器存储空间' : '自动存档 · 离线成长'}</span><span>选择水壶，点击浇水 <span className="keycap">CLICK</span></span><span>累计收获 <b>{s.harvests}</b> 株 · 收益 <b>{number(s.earned)}</b></span></footer>
    <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>

    {screen === 'menu' && !panel && <Modal title="月光奇植园开始菜单" className="start-menu">
      <div className="menu-eyebrow">一小片泥土，一整个奇妙世界</div><h1>月光<span>奇植园</span></h1><div className="menu-english">MOONLIT GARDEN</div>
      <div className="menu-plants"><Sprite id={4} /><Sprite id={9} /><Sprite id={6} /></div>
      <p>种下奇妙的植物，雇用慢悠悠的蜗牛。<br />在这个小小花园里，等一颗星星开花。</p>
      <button className="primary-button" onClick={play}>{s.started ? '继续我的花园' : '开始种植'}<span>▶</span></button>
      <div className="menu-links"><button onClick={() => setPanel('help')}>玩法指南</button><span>◆</span><button onClick={() => setPanel('settings')}>游戏设置</button>{s.started && <><span>◆</span><button onClick={() => setPanel('reset')}>新的花园</button></>}</div>
      <small className="menu-footnote">{PLANTS.length} 种奇植 · 五园专属研究 · 独立动物团队 · 慢慢种下自己的星空</small>
    </Modal>}
    {panel === 'squirrel' && <Modal title="松鼠播种选种" className="squirrel-seed-modal" close={()=>setPanel(null)}>
      <h2>松鼠播种选种</h2><p className="modal-intro">{garden.name} · 仅设置本园松鼠，手动选种保持不变。</p>
      <p className="squirrel-sow-status">{!team.autoSow?'自动播种已关闭，可在商店开启。':'金币或收益条件不足时松鼠会等待，满足后继续播种。'}</p>
      <div className="squirrel-seed-options">{TIERS.slice(0,ULTIMATE_TIER).map((name,tier)=>{
        const cost=PLANTS[seedPlantId(tier as Tier)].cost, lock=seedLock(s,tier as Tier)
        return <button key={tier} className={`blue-button squirrel-seed-option tier-${tier}`} aria-pressed={team.sowTier===tier} onClick={()=>{dispatch({type:'sow-tier',tier});sound('tap');setPanel(null)}}>
          <span className="seed-bag"><Sprite id={13}/></span><span><strong>{name}</strong><small>{cost===0?'免费':`${number(cost)} 金币 / 颗`}</small>{lock?<small>{lock} · 选后等待</small>:s.coins<cost&&<small>金币不足 · 选后等待</small>}</span><b>{team.sowTier===tier?'✓':''}</b>
        </button>
      })}</div>
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
      {team.decorations.length>0&&<div className="decoration-settings"><h3>{garden.name} · 装饰展示</h3>{team.decorations.map(id=><label className="setting-row" key={id}>{DECORATIONS.find(d=>d.id===id)?.name}<input type="checkbox" checked={!team.hiddenDecorations.includes(id)} onChange={()=>dispatch({type:'decoration-toggle',id})}/></label>)}</div>}<button className="text-button reset-link" onClick={() => setPanel('reset')}>重置花园 · 重新开始</button><p className="settings-note">切到其他标签页时音乐会暂停。每 3 秒自动保存，最多结算 30 分钟离线成长；菜单和设置暂停当前游戏。</p>
      <div className="modal-actions"><button className="primary-button" onClick={() => setPanel(null)}>返回{screen === 'game' ? '花园' : '菜单'}</button>{screen === 'game' && <button className="blue-button" onClick={() => { setPanel(null); setScreen('menu') }}>开始菜单</button>}</div>
    </Modal>}
    {panel === 'help' && <Modal title="玩法指南" close={() => setPanel(null)}><h2>园丁的小手册</h2><ol className="help-list"><li><b>选种、播种</b><p>八档种子依次为普通、稀有、珍贵、超凡、神话、远古、星界、终极。前七档各有四种植物，普通种子免费；各档均能抽到全部二十八种非终极植物，终极种子固定种出星之花。播种后立即显示品种名称、对应幼芽和成长进度，并直接开始生长；挖除不退种子费用。</p></li><li><b>浇水、收获</b><p>植物会自然生长。不同品种会长出不同幼芽。顶部选择水壶，再点击单株植物播放 1.2 秒浇水动画，期间该株无法重复浇水，但可以同时浇其他植物，每次消耗一份水量；需要补水时，点击花园左下角的水池，水壶会播放打水动画，装满后可继续浇水。手机默认点击植物查看下方资料，再点“收获”按钮采收；空盆直接播种。PC 默认点击成熟植物收获，无需选择专门工具；水壶选中时也可直接播种和收获。铲子选中后可挖除任何阶段的植物，且不获得金币或收获次数。再次点击已选工具可取消选择。选择小推车后先点植物，可用花园左右箭头切换花园，再点空盆搬运或另一株植物交换位置；成长进度和外观变体会保留。只有手动收获有 5% 概率获得肥料，甲虫自动收获不掉落肥料。选择肥料工具后点击未成熟的非终极植物，消耗一份立即养成；终极、空盆或已成熟植物不会消耗肥料。植物没有额外特殊效果；进度满后再次点击收获金币。</p></li><li><b>扩建、雇用助手</b><p>商店分为升级、雇佣、装饰，只列出尚未购买的选项。全园共用丰收、沃土和灌注三条研究路线。每座新花园解锁下一等级，丰收每级分四次小幅强化；未解锁的下一等级灰显并标明条件，切园不改变研究列表，效果对全园生效。每次招募或装备升级后有45秒磨合期，后续项目还需完成本园收获目标。每座花园独立雇佣蜗牛、甲虫和松鼠，每种最多五只；木制装备可依次强化为铜制、铁制、金质、钻石制，仅影响本园同种动物。新园不会自动获得动物或装饰。雇佣松鼠后，可在花园顶部为本园指定播种种子；金币或收益条件不足时松鼠等待，满足后自动继续，不会改种其他种子。甲虫运回金币，蜗牛回池补水。每园从4个花盆开始，点击花园内标价的＋号直接购买，每次增加1盆，最多15盆。最新花园扩至15盆并完成该园解锁的全部研究后，可付费开辟下一园。</p></li><li><b>种出第一颗星星</b><p>普通到星界种子同时检查金币与常态收益条件，天气不会临时解锁种子；每次付费播种的成熟收获至少返还种子成本的105%，变种与天气收益另算。终极种子价格 {number(PLANTS[ULTIMATE_ID].cost)} 金币，不要求研究数量或花园数量。星之花基础成长需450分钟，在第五园完成成长研究后自然成熟约5.6分钟，配合浇水约5分钟；每5秒可吸收一次浇水，与其他植物一样接受手动浇水、蜗牛浇水、土壤加成。成熟即通关，之后可以继续种植。</p></li></ol><p className="settings-note">装饰仅改变本园外观，高级花园价格更高；购买后可在设置中隐藏。每隔 5–10 分钟出现一次细雨、萤火虫之夜或彩虹，持续 15 秒：细雨使全园植物自然成长速度翻倍；萤火虫之夜使手动和自动收获收益 ×7，按采摘时刻结算；彩虹期间玩家水壶不耗水，空壶也能使用，结束后恢复原有水量。星之花不会被自动收获或自动播种。可关闭自动收获，保留喜欢的植物观赏。所有浇水只作用于单株植物。水壶空了请点击左下角水池打水。观赏模式保留音乐和自动照料，隐藏数值提示与通关弹窗。</p><button className="primary-button" onClick={() => setPanel(null)}>知道了</button></Modal>}
    {panel === 'book' && <Modal title="植物图鉴" className="book-modal" close={() => setPanel(null)}><h2>奇植图鉴 <small>{harvestedKinds} / {PLANTS.length}</small></h2><p className="modal-intro">实际收获点亮品种；外观变体只要培育成熟即永久记录。七个常规品阶中，每档最稀有品种拥有一个专属变种，出现概率10%，收获价值×2。</p>{s.untrackedHarvests > 0 && <p className="settings-note">旧存档的 {number(s.untrackedHarvests)} 次收获未记录品种；各品种次数从本次更新后开始累计。</p>}<div className="book-grid">{TIER_PLANTS.flat().map(id => PLANTS[id]).map(p => {
      const count = s.harvestCounts[p.id], known = count > 0
      return <article key={p.id} data-testid={`book-plant-${p.id}`} className={known ? 'discovered' : 'undiscovered'}><PlantSprite id={p.id} /><div><h3>{known ? p.name : '未知植物'}<small>{TIERS[p.tier].replace('种子', '')} · {known ? '已收获' : '未收获'}</small></h3>{variantFor(p.id)&&<div className="variant-collection">{(()=>{const v=variantFor(p.id)!,collected=s.variants.includes(`${p.id}:1`);return <span className={collected?'variant-known':'variant-unknown'} title={collected?v.name:'专属变种 · 尚未培育'}><span className={collected?'':'variant-silhouette'}><PlantSprite id={p.id} variant/></span><small>{collected?v.name:'未知变种'} {collected?'✓':'?'}</small><small>10% · 收获×2</small></span>})()}</div>}<p className="harvest-count">累计收获 <b>{number(count)}</b> 次</p>{known ? <><p>基础成长 {formatTime(p.seconds)} · 基础产值 {number(p.reward)} 金币{p.id === ULTIMATE_ID ? ' · 成熟即通关' : ''}</p><span>{p.lore}</span></> : <span>收获后解锁名字与详细资料</span>}</div></article>
    })}</div></Modal>}
    {panel === 'reset' && <Modal title="开始新的花园" close={() => setPanel(null)}><h2>重新种下第一颗种子？</h2><p className="modal-intro">这会替换本机的花园存档，金币、植物和升级会重新开始。音效设置会保留。</p><div className="modal-actions"><button className="blue-button" onClick={() => setPanel(null)}>保留我的花园</button><button className="primary-button" onClick={reset}>开始新的花园</button></div></Modal>}
    {won && !panel && <Modal title="星之花绽放，通关成功" className="victory-modal"><div className="victory-stars" aria-hidden="true"><PixelBurst kind="star" /><PixelBurst kind="coin" /></div><span className="menu-eyebrow">一颗星星，为你而开</span><Sprite id={9} /><h2>星之花，绽放了。</h2><p>从第一颗小小的种子，到一整个星光花园。<br />谢谢你的每一次照料。</p><div className="victory-stats"><div><small>通关用时</small><strong data-testid="win-time">{formatTime(s.wonAt ?? 0)}</strong></div><div><small>收获植物</small><strong>{s.harvests}</strong></div><div><small>收获品种</small><strong>{harvestedKinds}/{PLANTS.length}</strong></div></div><button className="primary-button" onClick={() => setVictoryDismissed(true)}>继续照料花园</button><small className="menu-footnote">旅程完成了，花园的故事还在继续。</small></Modal>}
  </div>
}
