import { GardenBackdrop } from './GardenBackdrop'
import { GardenAnimal } from './GardenAnimal'
import { ModalScroll } from './ModalScroll'
import { GardenHabitat } from './GardenHabitat'
import { ToolArt } from './ToolArt'
import { DecorationArt } from './DecorationArt'
import { useEffect, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PLANTS, TIERS, UPGRADES, SAVE_KEY, newGame, parseSave, reducer, unlocked, price, upgradePrice, growthRate, formatTime, capacity, STATIONS, WATER_DURATION, upgradeLock, nextResearch, ULTIMATE_ID, ULTIMATE_TIER, TIER_PLANTS, seedPlantId, seedVisible, GARDENS, gardenCount, teamFor, hireCatalog, hireAvailable, hireLock, seedLock, MATERIALS, decorationPrice, GARDEN_PRICES, potPrice, expansionLock, variantFor, plantedReward, DECORATIONS, WEATHER_DURATION, activeWeather, infiniteWater, type Tier, type GameState } from './game'
import { configureAudio, sound, unlockAudio } from './audio'
import { ExtraPlant } from './ExtraPlant'
import { Sprout } from './Sprout'
import { plantPosition } from './gardenScene'
import { formatNumber } from './format'
import './App.css'
import './garden-scene.css'
import './mobile-garden.css'
import './landscape-garden.css'
import './squirrel-picker.css'
import './modal-scroll.css'
import './game-interaction.css'
import './menu-settings.css'

const number = formatNumber
const multiplier = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
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
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} className={`wood modal ${close ? 'closable-modal' : ''} ${className}`} aria-label={title} onCancel={e => { e.preventDefault(); close?.() }}>
    {close ? <><header className="modal-header"><strong>{title}</strong><button className="close-button blue-button" aria-label={t('关闭菜单')} onClick={close}>×</button></header><ModalScroll>{children}</ModalScroll></> : children}
  </dialog>
}
function PixelBurst({ kind }: { kind: string }) {
  return <span aria-hidden="true" className={`pixel-burst burst-${kind}`}>{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--dx': `${Math.cos(i * 2.4) * (24 + i * 4)}px`, '--dy': `${-25 - (i % 5) * 13}px`, '--turn': `${i * 45}deg`, '--delay': `${i % 3 * 25}ms` } as CSSProperties} />)}</span>
}
function Fireflies() {
  return <div className="fireflies" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 3) % 100}%`, top: `${(i * 23 + 7) % 100}%`, '--delay': `${-i * 1.7}s`, '--duration': `${8 + i % 5}s` } as CSSProperties} />)}</div>
}
type Language = 'zh' | 'en'
type SettingsSection = 'audio' | 'game' | 'language'
type Settings = { sound: boolean; volume: number; music: boolean; musicVolume: number; motion: boolean; language: Language }
function loadSettings(): Settings {
  try { const p = JSON.parse(localStorage.getItem('moon-garden-settings') ?? '{}'); return { sound: p.sound !== false, volume: typeof p.volume === 'number' ? Math.max(0, Math.min(1, p.volume)) : .35, music: p.music !== false, musicVolume: typeof p.musicVolume === 'number' ? Math.max(0, Math.min(1, p.musicVolume)) : .3, motion: p.motion !== false, language: p.language === 'en' ? 'en' : 'zh' } } catch { return { sound: true, volume: .35, music: true, musicVolume: .3, motion: true, language: 'zh' } }
}
function loadGame() {
  try { return parseSave(localStorage.getItem(SAVE_KEY)) ?? newGame() } catch { return newGame() }
}
export default function Garden({ initialState, persist = true }: { initialState?: GameState; persist?: boolean } = {}) {
  const { t, i18n } = useTranslation()
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
  const [mobilePanel, setMobilePanel] = useState<'garden' | 'upgrades'>('garden')
  const [settings, setSettings] = useState(loadSettings)
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('audio')
  const english = settings.language === 'en'
  const tierName = (tier: number) => t(`data.tiers.${tier}`)
  const gardenName = (page: number) => t(`data.gardens.${page}.name`)
  const gardenSubtitle = (page: number) => t(`data.gardens.${page}.subtitle`)
  const plantName = (id: number) => t(`data.plants.${id}`)
  const variantName = (id: number) => t(`data.variants.${id}`)
  const decorationName = (id: string) => t(`data.decorations.${id}`)
  const lockText = (lock: string | null) => {
    if (!lock) return lock
    let match = lock.match(/^累计获得 (.+) 金币后开放$/)
    if (match) return t('locks.earned',{amount:match[1]})
    match = lock.match(/^本园收获 (\d+)\/(\d+) 株后开放$/)
    if (match) return t('locks.localHarvest',{current:match[1],required:match[2]})
    match = lock.match(/^第(\d+)园收获 (\d+)\/(\d+) 株后开放$/)
    if (match) return t('locks.gardenHarvest',{garden:match[1],current:match[2],required:match[3]})
    match = lock.match(/^团队磨合中 (.+)$/)
    if (match) return t('locks.settling',{time:match[1]})
    const exact:Record<string,string> = {'先提升丰收研究或前往高收益花园':'locks.improveHarvest','继续经营花园后开放':'locks.keepPlaying','先将最新花园扩至15盆':'locks.expandPots','先完成最新花园解锁的研究':'locks.completeResearch','先完成上一级丰收研究':'locks.previousHarvest'}
    if (exact[lock]) return t(exact[lock])
    return lock
  }
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
  const research = nextResearch(s)
  const rainbow = infiniteWater(s)
  const weather = activeWeather(s)
  const currentHarvestMultiplier = 2 ** s.upgrades.profit * garden.reward * (weather === 1 ? 7 : 1)
  const currentGrowthMultiplier = 2 ** s.upgrades.soil * garden.growth * (weather === 0 ? 2 : 1)
  const waterLevel = rainbow?3: s.player.stock===0?0:s.player.stock/capacity(s,'player')<=.25?1:s.player.stock/capacity(s,'player')<=.65?2:3
  const waterState = rainbow?t('无限水量'):s.player.phase==='service'?t('补水中'):t(`data.waterStates.${waterLevel}`)
  const openGardenIndex = gardenCount(s)
  const canVisitNextGarden = s.activeGarden < openGardenIndex - 1
  const canOpenNextGarden = s.activeGarden === openGardenIndex - 1 && openGardenIndex < GARDENS.length
  const nextGardenPrice = canOpenNextGarden ? GARDEN_PRICES[openGardenIndex] : 0
  const nextGardenBlock = canOpenNextGarden ? lockText(expansionLock(s)) ?? (s.coins < nextGardenPrice ? t('dynamic.insufficientCoins',{amount:number(nextGardenPrice)}) : null) : null
  const nextGardenLabel = canVisitNextGarden ? t('dynamic.nextGarden',{name:gardenName(s.activeGarden+1)}) : canOpenNextGarden ? t('dynamic.openGarden',{name:gardenName(openGardenIndex),status:nextGardenBlock ?? t('dynamic.openCost',{amount:number(nextGardenPrice)})}) : t('已是最后一座花园')

  useEffect(() => { current.current = s }, [s, persist])
  useEffect(() => {
    configureAudio(settings.sound && !observing, settings.volume, settings.music, settings.musicVolume)
    void i18n.changeLanguage(settings.language)
    document.documentElement.lang = settings.language === 'en' ? 'en' : 'zh-CN'
    try { localStorage.setItem('moon-garden-settings', JSON.stringify(settings)) } catch { /* Gameplay remains available without storage. */ }
  }, [settings, observing, i18n])
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
      if (gap > 10) { dispatch({ type: 'tick', dt: gap }); setToast(t('dynamic.offlineWelcome',{time:formatTime(gap)})) }
    }
    offlineApplied.current = true; dispatch({ type: 'start' }); setScreen('game')
  }
  const landscapeLayout = () => window.matchMedia('(orientation: landscape) and (max-height: 600px) and (max-width: 1200px)').matches
  const compactLayout = () => landscapeLayout() || window.matchMedia('(max-width: 620px), (max-width: 980px) and (orientation: portrait), (pointer: coarse) and (max-width: 980px)').matches
  function showMobilePanel(next: 'garden' | 'upgrades') {
    setMobilePanel(next)
    if (next === 'upgrades') setLandscapeShopOpen(true)
    if (compactLayout()) window.scrollTo({top:0,behavior:'instant'})
  }
  function potClick(index: number) {
    if (paused || observing) return
    setInspectedPot(index)
    const p = s.pots[index]
    if (!tool && p.plant !== null && compactLayout()) return
    if (p.plant === null && !(tool === 'cart' && moveFrom !== null)) {
      if (seedLock(s,selected.tier)) { setToast(lockText(seedLock(s,selected.tier))!); return }
      if (s.coins < price(s, selected)) { setToast(t('dynamic.seedInsufficient',{tier:tierName(selected.tier),amount:number(price(s,selected))})); return }
      sound('plant')
      setFloats(f => [...f.slice(-9), { id: floatId.current++, pot: index, text: t('种下了！'), kind: 'plant' }])
      dispatch({ type: 'pot', index }); return
    }
    if (tool === 'fertilizer') {
      if(p.plant===null || p.plant===ULTIMATE_ID || p.growth>=PLANTS[p.plant].seconds || s.fertilizer===0){setToast(t('肥料仅能用于未成熟的非终极植物，每次消耗一份。'));return}
      dispatch({type:'fertilize',index});sound('reveal');setFloats(f=>[...f,{id:floatId.current++,pot:index,text:t('立即成熟！'),kind:'star'}]);return
    }
    if (tool === 'shovel') {
      if (p.plant === null) { setToast(t('这是空花盆，无需挖除。再次点击铲子可取消选择。')); return }
      dispatch({ type: 'dig', index }); sound('tap')
      setFloats(f => [...f.slice(-9), { id: floatId.current++, pot: index, text: t('已挖除 · 无收益'), kind: 'dig' }]); return
    }
    if (tool === 'cart') {
      if (moveFrom === null) {
        if (p.plant === null) { setToast(t('先选择要移动的植物，再点击目标花盆。')); return }
        setMoveFrom(index); sound('tap'); return
      }
      if (moveFrom === index) { setMoveFrom(null); return }
      if (s.pots[moveFrom]?.plant === null) { setMoveFrom(null); setToast(t('这株植物已经被收获，请重新选择。')); return }
      dispatch({ type: 'move', from: moveFrom, to: index }); setMoveFrom(null); sound('plant')
      setFloats(f => [...f.slice(-7), ...[moveFrom, index].map(pot => ({ id: floatId.current++, pot, text: t('搬运完成'), kind: 'move' }))]); return
    }
    if (tool === 'water' && p.plant !== null && p.growth < PLANTS[p.plant].seconds) {
      if ((p.watering ?? 0) > 0) return
      if(p.plant===ULTIMATE_ID && s.elapsed-p.wateredAt<5){setToast(t('星之花正在吸收水分，每5秒可浇水一次。'));return}
      if (!rainbow && s.player.phase !== 'idle') { setToast(t('水壶正在装填，请稍等。')); return }
      if (!rainbow && s.player.stock === 0) { setToast(t('水壶空了，请点击花园左下角的水池打水。')); return }
      dispatch({ type: 'water', index }); return
    }
    let rewardText = ''
    if (p.plant !== null && p.growth >= PLANTS[p.plant].seconds) { rewardText = `+${number(plantedReward(s,index))}`; sound('coin') }
    else { setToast(t('选择顶部水壶，再点击植物浇水。')); return }
    setFloats(f => [...f.slice(-9), { id: floatId.current++, pot: index, text: rewardText, kind: 'coin' }])
    dispatch({ type: 'pot', index })
  }

  function advanceGarden() {
    if (canVisitNextGarden) {
      dispatch({type:'garden',index:s.activeGarden+1})
      setInspectedPot(null)
      return
    }
    if (!canOpenNextGarden) return
    if (nextGardenBlock) {
      setToast(t('dynamic.cannotOpen',{name:gardenName(openGardenIndex),reason:nextGardenBlock}))
      sound('tap')
      return
    }
    const name = gardenName(openGardenIndex)
    dispatch({type:'open-garden'})
    setInspectedPot(null)
    setMoveFrom(null)
    sound('buy')
    setToast(t('dynamic.gardenOpened',{name}))
  }
  function choose(id: number) { dispatch({ type: 'select', id }); sound('tap'); showMobilePanel('garden') }
  function reset() { setTool(null); setMoveFrom(null); setObserving(false); setInspectedPot(null); setFloats([]); setMobilePanel('garden'); dispatch({ type: 'reset' }); offlineApplied.current = true; setVictoryDismissed(false); setPanel(null); setScreen('game'); setCategory(0); setToast(t('新的花园，从一包免费种子开始。')) }


  const squirrelPicker = team.workers.sow.length>0 && <button className="squirrel-picker-button tool-button" aria-label={t('dynamic.squirrelChoice',{tier:tierName(team.sowTier)})} aria-haspopup="dialog" title={t('dynamic.squirrelsSow',{tier:tierName(team.sowTier)})} onClick={()=>setPanel('squirrel')}>
    <GardenAnimal kind="sow"/>
    <span className={`squirrel-current-seed tier-${team.sowTier}`}><span className="seed-bag"><Sprite id={13}/></span></span><span>{t('松鼠')}</span>
  </button>

  return <div onDragStart={e=>e.preventDefault()} className={`game-shell ${landscapeShopOpen ? 'landscape-shop-open' : 'landscape-shop-closed'} ${!settings.motion ? 'reduce-motion' : ''} ${screen === 'menu' ? 'on-menu' : ''} ${paused ? 'is-paused' : ''} ${observing ? 'observation-mode' : ''}`}>
    <Fireflies />
    {observing && <div className="observation-toolbar"><span>{s.wonAt !== null ? t('星之花已绽放 · 花园仍在生长') : t('静静生长 · 助手继续照料')}</span><button className="blue-button" onClick={() => setObserving(false)}>{t('退出观赏')} <small>Esc</small></button></div>}
    <header className="topbar">
      <div className="stat wood coin-stat"><Sprite id={15} /><div><small>{t('花园金币')}</small><strong data-testid="coins">{number(s.coins)}</strong></div></div>
      <div className="stat wood"><Icon name="leaf" /><div><small>{t('收获图鉴')}</small><strong>{harvestedKinds}<em>/ {PLANTS.length}</em></strong></div></div>
      <div className="brand"><span>MOONLIT GARDEN</span><h1>{t('月光奇植园')}</h1></div>
      <div className="time-display"><span className="live-dot" />{s.wonAt !== null ? t('自由种植') : t('花园时光')}<strong data-testid="elapsed">{formatTime(s.elapsed)}</strong></div>
      <button className="landscape-shop-toggle blue-button" aria-expanded={landscapeShopOpen} aria-controls="garden-shop" onClick={() => setLandscapeShopOpen(!landscapeShopOpen)}>{landscapeShopOpen ? t('收起商店') : t('打开商店')}</button>
      <button className="blue-button icon-button" aria-label={t('植物图鉴')} onClick={() => setPanel('book')}><Icon name="book" /></button>
      <button className="blue-button icon-button" aria-label={t('游戏设置')} onClick={() => setPanel('settings')}><Icon name="gear" /></button>
    </header>
    <nav className="mobile-nav" aria-label={t('游戏面板')}>{(['garden', 'upgrades'] as const).map((id, i) => <button key={id} className={mobilePanel === id ? 'active' : ''} aria-current={mobilePanel === id ? 'page' : undefined} onClick={() => showMobilePanel(id)}>{t(`shop.mobileTabs.${i}`)}</button>)}</nav>
    <main className="game-layout">
      <aside className="seed-panel wood" aria-label={t('种子商店')}>
        <h2 className="panel-title"><Icon name="leaf" />{t('种 子')}<Icon name="leaf" /></h2>
        <div className="tier-list">{TIERS.map((name, i) => {
          if(!seedVisible(s,i as Tier))return null
          const open = unlocked(s, i as Tier), active = selected.tier === i
          return <button key={name} className={`tier-card blue-button tier-${i} ${active ? 'selected' : ''}`} aria-pressed={active} disabled={!open} onClick={() => choose(seedPlantId(i as Tier))}>
            <span className="seed-bag"><Sprite id={13} /></span>
            <span className="tier-copy"><strong>{tierName(i)}</strong><b>{i === 0 ? t('免费 · 无限') : t('dynamic.seedPrice',{amount:number(price(s, PLANTS[seedPlantId(i as Tier)]))})}</b><small>{i === ULTIMATE_TIER ? t('种出星星 · 完成旅程') : lockText(seedLock(s,i as Tier))??t('dynamic.harvestedCount',{count:TIER_PLANTS[i].filter(id => s.harvestCounts[id] > 0).length})}</small></span>
          </button>
        })}</div>
        <div className="landscape-seed-picker">{squirrelPicker}</div>
        <div className="shop-note"><Icon name="seed" /><p>{t('选好等级，点击空花盆')}<br />{t('购买并随机播种。')}</p></div>
      </aside>

      <section className={`garden-section ${mobilePanel === 'garden' ? 'mobile-active' : ''}`} aria-label={t('花园')}>
        <div className={`garden-board garden-${garden.theme} wood zen-garden ${team.workers.sow.length?'has-squirrels':''}`}>
          <GardenBackdrop page={s.activeGarden}/>
        <div className="garden-tools" role="group" aria-label={t('园艺工具')}>
          <div className="tool-slots">
            <div className="watering-cubby">
              <button className={`tool-button water-tool ${tool === 'water' ? 'selected' : ''} ${s.player.phase==='service'?'is-refilling':''}`} data-water-state={waterState} title={t('dynamic.waterToolTitle',{state:waterState})} aria-label={t('dynamic.waterToolLabel',{state:waterState})} aria-pressed={tool === 'water'} onClick={() => { setTool(tool==='water'?null:'water');setMoveFrom(null) }}><ToolArt kind="water" waterLevel={waterLevel}/>{rainbow && <b className="tool-quantity">∞</b>}<span>{t('水壶')}</span></button>
            </div>
            <button className={`tool-button ${tool === 'fertilizer' ? 'selected' : ''}`} title={t('肥料 · 使非终极植物立即成熟')} aria-label={t('肥料工具')} aria-pressed={tool === 'fertilizer'} onClick={()=>{setTool(tool === 'fertilizer' ? null : 'fertilizer');setMoveFrom(null)}}><ToolArt kind="fertilizer"/><b className="tool-quantity">×{s.fertilizer}</b><span>{t('肥料')}</span></button>
            <button className={`tool-button ${tool === 'cart' ? 'selected' : ''}`} title={t('小推车 · 选择植物，切换花园后点击花盆搬运或交换')} aria-label={t('小推车工具')} aria-pressed={tool === 'cart'} onClick={() => { setTool(tool === 'cart' ? null : 'cart'); setMoveFrom(null) }}><ToolArt kind="cart"/>{moveFrom !== null && s.pots[moveFrom]?.plant != null && <span className="cart-passenger" aria-hidden="true"><PlantSprite id={s.pots[moveFrom].plant!} variant={!!s.pots[moveFrom].variant}/></span>}<span>{t('小推车')}</span></button>
            <button className={`tool-button ${tool === 'shovel' ? 'selected' : ''}`} title={t('铲子 · 挖除植物，不获得收益')} aria-label={t('铲子工具')} aria-pressed={tool === 'shovel'} onClick={() => { setTool(tool === 'shovel' ? null : 'shovel'); setMoveFrom(null) }}><ToolArt kind="shovel"/><span>{t('铲子')}</span></button>
            {squirrelPicker}
          </div>
          <div className="tool-shelf-actions"><button className="text-button" onClick={()=>{setObserving(true);setMobilePanel('garden');setFloats([]);setToast('')}}>{t('观赏')}</button><button className="text-button" aria-label={t('玩法指南')} onClick={()=>setPanel('help')}>?</button></div>
          <div className="seed-shortcuts" role="group" aria-label={t('快捷选种')}>
            {TIERS.map((_name, i) => {
              const tier=i as Tier
              if (!seedVisible(s,tier)||!unlocked(s,tier)) return null
              const id=seedPlantId(tier), cost=price(s,PLANTS[id]), active=selected.tier===tier
              return <button key={tier} className={`seed-shortcut blue-button tier-${tier} ${active?'selected':''} ${s.coins<cost?'unaffordable':''}`} aria-pressed={active} aria-label={t('dynamic.seedShortcut',{tier:tierName(tier),price:cost===0?t('免费'):t('dynamic.seedPrice',{amount:number(cost)}),short:s.coins<cost?t('dynamic.notEnoughSuffix'):''})} onClick={()=>choose(id)}>
                <span className="seed-bag"><Sprite id={13}/></span><span><strong>{t(`data.tierShorts.${tier}`)}</strong><small>{s.coins<cost?t('不足 · '):''}{cost===0?t('免费'):number(cost)}</small></span>
              </button>
            })}
          </div>
          <p className="tool-hint">{tool === 'fertilizer' ? t('点击植物施肥 · 点击空盆仍播种当前种子') : tool === 'shovel' ? t('点击植物挖除 · 点击空盆仍播种当前种子 · 再点铲子取消') : tool === 'cart' ? moveFrom === null ? t('选择植物搬运 · 点击空盆仍播种当前种子') : t('dynamic.cartSelected',{garden:gardenName(Math.floor(moveFrom/15)),pot:moveFrom%15+1}) : tool === 'water' ? t('点击植物浇水 · 点击空盆仍播种当前种子 · 点击左下角水池打水') : t('点击空盆播种，点击成熟植物收获')}</p>
        </div>
          <h2 className="scene-garden-name" aria-live="polite">
            <span className="scene-garden-title">{gardenName(s.activeGarden)}</span>
            <span className="scene-garden-effects" aria-label={t('dynamic.currentEffects',{harvest:multiplier(currentHarvestMultiplier),growth:multiplier(currentGrowthMultiplier)})}>
              <span className="garden-effect harvest-effect">{t('收获')} <strong>×{multiplier(currentHarvestMultiplier)}</strong></span>
              <span className="garden-effect growth-effect">{t('生长')} <strong>×{multiplier(currentGrowthMultiplier)}</strong></span>
            </span>
          </h2>
          <button className="scene-arrow scene-prev" aria-label={t('上一座花园')} disabled={s.activeGarden===0} onClick={()=>{dispatch({type:'garden',index:s.activeGarden-1});setInspectedPot(null)}}><svg viewBox="0 0 32 40" aria-hidden="true"><path d="M29 9H17V2L2 20l15 18v-8h12Z"/></svg></button>
          <button data-testid="next-garden" className={`scene-arrow scene-next ${canOpenNextGarden?'scene-open-next':''} ${nextGardenBlock?'scene-open-blocked':''}`} aria-label={nextGardenLabel} title={nextGardenLabel} disabled={!canVisitNextGarden&&!canOpenNextGarden} onClick={advanceGarden}><svg viewBox="0 0 32 40" aria-hidden="true"><path d="M3 9h12V2l15 18-15 18v-8H3Z"/></svg></button>
          {weather !== null && <div className={`weather-overlay weather-${s.weather.kind}`} aria-label={t('dynamic.weatherLabel',{name:t(`data.weather.names.${s.weather.kind}`),effect:t(`data.weather.effects.${s.weather.kind}`),seconds:Math.ceil(s.weather.started+WEATHER_DURATION-s.elapsed)})}><span>{t(`data.weather.names.${s.weather.kind}`)} · {t(`data.weather.effects.${s.weather.kind}`)} · {Math.ceil(s.weather.started+WEATHER_DURATION-s.elapsed)} {t('秒')}</span>{s.weather.kind===2&&<svg className="pixel-rainbow" viewBox="0 0 64 32" shapeRendering="crispEdges" aria-hidden="true">{["#bba1d3","#8fcbdc","#b0d398","#e6cf88","#dc94a0"].map((color,i)=><path key={color} d={`M${4+i*2} 30V${16+i*2}h6v-6h8V${4+i*2}h${28-i*4}v6h8v6h6V30`} fill="none" stroke={color} strokeWidth="2"/>)}</svg>}{Array.from({length:28},(_,i)=><i key={i} style={{left:`${i*37%100}%`,top:`${i*23%100}%`,animationDelay:`-${i*.19}s`}}/>)}</div>}
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
            if (localIndex===team.potCount) return <button key={i} data-testid="buy-pot" className="locked-pot ground-marker purchase-pot" style={placement} disabled={s.coins<potPrice(s)} aria-label={t('dynamic.buyPot',{pot:localIndex+1,amount:number(potPrice(s))})} onClick={() => { dispatch({type:'expand'}); sound('buy'); setToast(t('dynamic.potAdded',{pot:team.potCount+1})); }}><span>＋</span><small>◈ {number(potPrice(s))}</small></button>
            const p = pot.plant === null ? null : PLANTS[pot.plant]
            const ready = p !== null && pot.growth >= p.seconds
            const seed = p !== null && pot.growth < p.seconds * .15
            const young = p !== null && pot.growth < p.seconds * .5
            const sprite = p === null || young ? null : p.id
            return <button key={i} data-testid={`pot-${i}`} aria-label={t('pot.aria',{pot:i+1,plant:p?plantName(p.id):t('pot.empty'),action:t(!p&&!(tool==='cart'&&moveFrom!==null)?'pot.sow':tool==='fertilizer'?'pot.fertilize':tool==='shovel'?'pot.remove':tool==='cart'?moveFrom===null?'pot.selectMove':'pot.moveHere':ready?'pot.harvest':tool==='water'?'pot.useCan':'pot.growing')})} className={`pot ${inspectedPot === i ? 'inspected' : ''} ${moveFrom === i ? 'move-source' : ''} ${tool === 'cart' && moveFrom !== null ? 'move-destination' : ''} ${(pot.watering ?? 0) > 0 ? 'watering-cooldown' : ''} ${ready ? 'ready' : ''} ${p && !ready && !young ? 'growing-adult' : ''} ${p === null ? 'empty-pot' : ''} ${p?.tier === ULTIMATE_TIER ? 'ultimate' : ''} ${p && !seed ? 'alive' : ''} plant-${p?.id ?? 'empty'}`} style={placement} onClick={() => potClick(i)}>

              {p && <span className="plant-name">{`${pot.variant ? variantName(p.id) + ' · ' : ''}${plantName(p.id)}`}</span>}
              {p && !young && p.tier > 0 && <span className={`plant-aura aura-${p.tier}`} aria-hidden="true"><i /><i /><i /></span>}
              <span key={`${sprite}-${ready}`} className="plant-art-slot">{sprite === null ? <Sprite id={10} className="pot-art" /> : <PlantSprite id={sprite} className="pot-art" variant={!!pot.variant} />}</span>
              {pot.revealedAt !== undefined && s.elapsed - pot.revealedAt < 1 && <span key={`reveal-${pot.revealedAt}`} className="rare-reveal" aria-hidden="true">✦<PixelBurst kind="star" /></span>}
              {p && young && <Sprout id={p.id} tiny={seed} />}
              {(pot.watering ?? 0) > 0 && <span className="tool-pour" style={{ animationDuration: `${WATER_DURATION}s` }} aria-hidden="true"><ToolArt kind="water" waterLevel={waterLevel}/><span className="tool-water-stream">▪<i>▪</i><b>▪</b></span></span>}
              {(pot.watering ?? 0) > 0 && <span className="watering-timer" data-testid={`watering-${i}`} aria-label={t('本株浇水冷却中')}><Progress value={(pot.watering ?? 0) / WATER_DURATION} /></span>}
              {floats.some(f => f.pot === i && f.kind === 'move') && <span className="tool-cart-animation" aria-hidden="true"><ToolArt kind="cart" /></span>}
              {floats.some(f => f.pot === i && f.kind === 'dig') && <span className="tool-dig-animation" aria-hidden="true"><Icon name="shovel" /><i /><i /><i /></span>}
              {ready && <span className="ripe-sparkles" aria-hidden="true">✦<i>✧</i><b>✦</b></span>}
              {p && s.elapsed - pot.wateredAt < .65 && <span key={`water-${pot.wateredAt}`} className="water-drop" aria-hidden="true">♦<PixelBurst kind="water" /></span>}
              <span className="pot-sign"><strong>{p ? ready ? t('可收获') : seed ? t('萌芽中') : young ? t('生长中') : p.tier === ULTIMATE_TIER ? t('凝聚星光') : t('成株生长') : t('空 闲')}</strong><Progress value={p ? pot.growth / p.seconds : 0} gold={p?.tier === ULTIMATE_TIER} /><small>{tool === 'shovel' ? p ? t('挖除 · 无收益') : t('空花盆') : p ? ready ? t('dynamic.coinReward',{amount:number(plantedReward(s,i))}) : `${formatTime((p.seconds - pot.growth) / growthRate(s))}` : t('点击播种')}</small></span>
              {floats.filter(f => f.pot === i).map(f => <span className={`pot-feedback feedback-${f.kind}`} key={f.id}><span className="float-label">{f.text}</span>{f.kind !== 'water' && <PixelBurst kind={f.kind} />}</span>)}
            </button>
          })}
            <div className={`supply-station water-station ${s.player.phase==='service'?'pool-refilling':''}`} style={{ left: `${STATIONS.water.x}%` }}>
              <button className="pool-refill-button" aria-label={rainbow?t('彩虹期间无需补水'):s.player.phase==='service'?t('水池 · 打水中'):s.player.stock===capacity(s,'player')?t('水池 · 水壶已满'):t('水池 · 给水壶打水')} title={t('点击水池给水壶打水，蜗牛也在这里补水')} disabled={paused||rainbow||s.player.phase!=='idle'||s.player.stock===capacity(s,'player')} onClick={()=>{setTool('water');setMoveFrom(null);dispatch({type:'refill'});sound('tap')}}>
                <span className="pixel-pool" aria-hidden="true"/>
                {s.player.phase==='service'&&<span className="pool-dipping-can" aria-hidden="true"><ToolArt kind="water" waterLevel={waterLevel}/><i/><i/></span>}
                <b>{rainbow?t('彩虹 · 无限水量'):s.player.phase==='service'?t('打水中…'):s.player.stock===capacity(s,'player')?t('水池 · 壶已满'):t('水池 · 点击打水')}</b>
              </button>
            </div>
            <div className="supply-station seed-station" style={{ left: `${STATIONS.sow.x}%` }}><span className="pixel-crate"><Sprite id={13} /></span><b>{t('种子箱')}</b></div>
            <div className="supply-station harvest-station" style={{ left: `${STATIONS.harvest.x}%` }}><span className="pixel-crate" /><b>{t('收获站')}</b></div>
            {s.upgrades.lantern > 0 && <div className="scene-lanterns" aria-hidden="true">{Array.from({ length: s.upgrades.lantern }, (_, i) => <span key={i} style={{ left: `${24 + i * 26}%` }}>▥</span>)}</div>}
            {([
              ...team.snails.map((w, i) => ({ kind: 'water' as const, w, on: true, workerIndex:i+1, level: team.equipment.water })),
              ...(['harvest','sow'] as const).flatMap(kind=>team.workers[kind].map((w,i)=>({kind,w,on:kind==='harvest'?team.autoHarvest:team.autoSow&&s.coins>=PLANTS[seedPlantId(team.sowTier)].cost,workerIndex:i+1,level:team.equipment[kind]})))
            ]).map(({ kind, w, on, workerIndex, level }, i) => <div key={`${kind}-${i}`} data-testid={`worker-${kind}`} data-phase={w.phase} data-target={w.target ?? ''} className={`garden-resident task-animal actor-${kind} ${on ? `worker-${w.phase}` : 'worker-paused'} living-animal material-${level}`} style={{ left: `${w.x}%`, top: `${w.y}%`, zIndex: Math.round(w.y) + 1, '--facing': w.facing, '--equipment-scale': 1, '--gait-delay': `${-i*.29}s`, '--gear-color': MATERIALS[level].color, '--gear-light': MATERIALS[level].light } as CSSProperties} aria-label={t('dynamic.workerState',{name:t(`data.crew.${kind}`),index:workerIndex,material:t(`data.materials.${level}`),state:t(!on?'worker.rest':w.phase==='return'?'worker.return':w.phase==='service'?kind==='harvest'?'worker.deliver':'worker.refill':w.phase==='act'?'worker.act':w.phase==='walk'?'worker.walk':'worker.idle')})}>
              <span className="resident-shadow" />
              <span className="resident-body"><GardenAnimal kind={kind}/>
                {on && kind==='water' && w.phase==='act' && <span className="animal-water-drops" aria-hidden="true"><i/><i/><i/></span>}
                {on && kind==='sow' && w.phase==='act' && <span className="creature-seeds" aria-hidden="true"><i/><i/><i/></span>}
                {on && kind==='harvest' && w.phase==='act' && <span className="creature-leaf" aria-hidden="true"><svg viewBox="0 0 12 12" shapeRendering="crispEdges"><path d="M2 1h7v2h2v5H8v2H4v1H2V8H1V3h1Z" fill="#b6cc65"/><path d="M3 8h2V6h2V4h2V3H7v2H5v2H3Z" fill="#466c35"/></svg></span>}
              </span>
            </div>)}
          </div>
          <div className="garden-scene-caption"><small>{gardenSubtitle(s.activeGarden)}</small><span>{inspectedPot !== null && s.pots[inspectedPot] ? (() => { const pot = s.pots[inspectedPot]; const p = pot.plant === null ? null : PLANTS[pot.plant]; return p ? pot.growth >= p.seconds ? t('dynamic.plantReady',{plant:plantName(p.id),amount:number(plantedReward(s,inspectedPot))}) : t('dynamic.plantGrowing',{plant:plantName(p.id),percent:Math.floor(pot.growth/p.seconds*100),amount:number(plantedReward(s,inspectedPot))}) : t('空花盆 · 点击种下当前选择的种子') })() : t('选择顶部工具，再点击盆栽使用')}</span><small>{team.snails.length ? t('dynamic.roamingSnails',{count:team.snails.length}) : t('雇用蜗牛后，它会往返水池与花盆')}</small></div>
        </div>
        <div className={`mobile-plant-info ${inspectedPot !== null ? 'has-selection' : ''}`} aria-label={t('inspector.label')} data-testid="plant-inspector">
          <button className="landscape-info-close blue-button" aria-label={t('inspector.close')} onClick={() => setInspectedPot(null)}>×</button>
          {inspectedPot !== null && s.pots[inspectedPot] ? (() => {
            const pot=s.pots[inspectedPot], plant=pot.plant===null?null:PLANTS[pot.plant]
            if (!plant) return <div><strong>{t('inspector.emptyTitle',{pot:inspectedPot%15+1})}</strong><p>{t('inspector.emptyPrompt',{tier:tierName(selected.tier)})}</p></div>
            const ready=pot.growth>=plant.seconds
            return <><div className="mobile-plant-copy"><strong>{pot.variant ? variantName(plant.id)+' · ' : ''}{plantName(plant.id)}</strong><p>{t('inspector.progress',{percent:Math.floor(pot.growth/plant.seconds*100),status:ready?t('inspector.ready'):formatTime((plant.seconds-pot.growth)/growthRate(s,Math.floor(inspectedPot/15)))})}</p><Progress value={pot.growth/plant.seconds}/><p>{t('inspector.harvest')} <b>◈ {number(plantedReward(s,inspectedPot))}</b></p></div><button className="blue-button" disabled={paused} onClick={()=>{if(ready){dispatch({type:'pot',index:inspectedPot});sound('coin');setToast(t('inspector.harvestToast',{plant:plantName(plant.id),amount:number(plantedReward(s,inspectedPot))}))}else{setTool('water');setMoveFrom(null);setToast(t('inspector.waterSelected'))}}}>{ready?t('inspector.harvest'):t('inspector.selectCan')}</button></>
          })() : <div><strong>{t('inspector.details')}</strong><p>{t('inspector.detailsHint')}</p></div>}
        </div>
      </section>

      <aside id="garden-shop" ref={shopRef} className={`upgrade-panel ${mobilePanel === 'upgrades' ? 'mobile-active' : ''}`} aria-label={t('花园商店')}>
        <h2 className="panel-title"><Icon name="leaf"/>{t('商 店')}<Icon name="leaf"/></h2>
        <div className="upgrade-tabs" role="tablist" aria-label={t('商店分类')}>{[0,1,2].map(i=>{const name=t(`shop.tabs.${i}`);return <button role="tab" aria-selected={category===i} key={name} onClick={()=>{setCategory(i);sound('tap')}} className={category===i?'selected':''}><Icon name={['leaf','snail','star'][i]}/><span>{name}</span></button>})}</div>
        <div className={`upgrade-list ${category===1?'hire-list':''}`}>
          {category===0 && <>{research.map(u=>{const level=u.icon==='coin'?u.name.match(/\d+/)?.[0]:u.page+1;const upgradeName=t(u.icon==='coin'?'research.harvest':u.icon==='leaf'?'research.soil':'research.infusion',{level});const profitIncrease=Math.round((2**(u.effects.profit??0)-1)*100);const upgradeDetail=u.icon==='coin'?t('dynamic.harvestUpgrade',{multiplier:multiplier(2**(u.effects.profit??0)),percent:profitIncrease}):t(u.icon==='leaf'?'research.soilDetail':'research.infusionDetail');return <button key={u.id} data-testid={`upgrade-${u.id}`} className="upgrade-card" disabled={s.coins<upgradePrice(s,u)||!!upgradeLock(s,u.id)} onClick={()=>{dispatch({type:'buy',id:u.id});sound('buy');setToast(`${upgradeName} · ${upgradeDetail}`)}}><span className="upgrade-art"><Icon name={u.icon}/></span><span className="upgrade-copy"><strong>{upgradeName}</strong><b>◈ {number(u.cost)}</b><span className="upgrade-description">{lockText(upgradeLock(s,u.id))??upgradeDetail}</span></span></button>})}{UPGRADES.every(u=>s.purchases.includes(u.id))?<p className="shop-empty">{t('全园研究已满级。')}<br/>{t('可从花园右侧箭头开辟下一园。')}</p>:research.length===0&&<p className="shop-empty">{t('继续经营花园，会出现新的研究项目。')}</p>}</>}
          {category===1 && <>{hireCatalog(s.activeGarden).filter(u=>hireAvailable(team,u)).map(u=>{const crew=t(`data.crew.${u.kind}`);const gear=t(u.kind==='water'?'hire.tank':u.kind==='harvest'?'hire.basket':'hire.seedBag');const hireName=u.type==='recruit'?t('hire.recruit',{crew,level:u.level}):t('hire.equipment',{material:t(`data.materials.${u.level}`),gear});const hireDetail=u.type==='recruit'?t('hire.add'):t(u.kind==='water'?'hire.waterGear':'hire.otherGear');return <button key={u.id} data-testid={`hire-${u.id}`} className="upgrade-card" disabled={s.coins<u.cost||!!hireLock(s,u)} onClick={()=>{dispatch({type:'hire',id:u.id});sound('buy');setToast(`${gardenName(s.activeGarden)} · ${hireName}`)}}><span className="upgrade-art"><Icon name={u.kind==='water'?'snail':u.kind==='harvest'?'beetle':'squirrel'}/></span><span className="upgrade-copy"><strong>{hireName}</strong><b>◈ {number(u.cost)}</b><span className="upgrade-description">{lockText(hireLock(s,u))??hireDetail}</span></span></button>})}{hireCatalog(s.activeGarden).every(u=>!hireAvailable(team,u))&&<p className="shop-empty">{t('本园团队已满编，装备全部达到钻石制。')}</p>}</>}
          {category===2 && <>{DECORATIONS.filter(d=>!team.decorations.includes(d.id)).map(d=><button key={d.id} data-testid={`decorate-${d.id}`} className="upgrade-card" disabled={s.coins<decorationPrice(d.cost,s.activeGarden)} onClick={()=>{dispatch({type:'decorate',id:d.id});sound('buy')}}><span className="upgrade-art"><Icon name="star"/></span><span className="upgrade-copy"><strong>{decorationName(d.id)}</strong><b>◈ {number(decorationPrice(d.cost,s.activeGarden))}</b><span className="upgrade-description">{t('shop.decorOnly',{detail:d.detail})}</span></span></button>)}{team.decorations.length===DECORATIONS.length&&<p className="shop-empty">{t('本园装饰已购齐。可在设置中调整展示。')}</p>}</>}
        </div>
        <div className="automation-controls">{team.workers.harvest.length>0&&<label><input type="checkbox" checked={team.autoHarvest} onChange={()=>dispatch({type:'toggle',key:'autoHarvest'})}/>{t('本园自动收获')}</label>}{team.workers.sow.length>0&&<label><input type="checkbox" checked={team.autoSow} onChange={()=>dispatch({type:'toggle',key:'autoSow'})}/>{t('本园自动播种')}</label>}</div>
        <button className="mobile-return blue-button" onClick={()=>{showMobilePanel('garden');if(landscapeLayout())setLandscapeShopOpen(false)}}>← {t('返回花园')}</button>
      </aside>
    </main>
    <footer className="statusbar"><span><i className="live-dot" />{saveError ? t('存档失败，请检查浏览器存储空间') : t('自动存档 · 离线成长')}</span><span>{t('选择水壶，点击浇水')} <span className="keycap">CLICK</span></span><span>{t('累计收获')} <b>{number(s.harvests)}</b> {t('株 · 收益')} <b>{number(s.earned)}</b></span></footer>
    <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>

    {screen === 'menu' && !panel && <Modal title={t('月光奇植园主菜单')} className="start-menu">
      <div className="main-menu-frame">
        <header className="menu-edge">
          <span className="menu-wordmark">MOONLIT GARDEN</span>
          <button className="menu-quick-settings" aria-label={t('设置')} onClick={() => { setSettingsSection('audio'); setPanel('settings') }}><Icon name="gear" /><span>{t('设置')}</span></button>
        </header>
        <section className="menu-atmosphere" aria-labelledby="main-menu-title">
          <span className="menu-eyebrow">{t('一小片泥土，一整个奇妙世界')}</span>
          <h1 id="main-menu-title">{t('月光')}<span>{t('奇植园')}</span></h1>
          <div className="menu-plants"><Sprite id={4} /><Sprite id={9} /><Sprite id={6} /></div>
          <p>{t('种下奇妙的植物，雇用慢悠悠的蜗牛。')}<br />{t('在月光里，等一颗星星开花。')}</p>
        </section>
        <nav className="menu-index" aria-label={t('主菜单')}>
          <button className="menu-entry menu-entry-primary" onClick={play}>
            <span className="menu-entry-number">01</span><span className="menu-entry-copy"><strong>{s.started ? t('继续游戏') : t('开始游戏')}</strong><small>{s.started ? t('dynamic.menuReturn',{garden:gardenName(s.activeGarden),time:formatTime(s.elapsed)}) : t('从一包免费种子开始')}</small></span><b aria-hidden="true">→</b>
          </button>
          <button className="menu-entry" onClick={() => setPanel('help')}>
            <span className="menu-entry-number">02</span><span className="menu-entry-copy"><strong>{t('玩法指南')}</strong><small>{t('种植、浇水与经营花园')}</small></span><b aria-hidden="true">→</b>
          </button>
          <button className="menu-entry" onClick={() => { setSettingsSection('audio'); setPanel('settings') }}>
            <span className="menu-entry-number">03</span><span className="menu-entry-copy"><strong>{t('设置')}</strong><small>{t('音效、游戏与语言')}</small></span><b aria-hidden="true">→</b>
          </button>
          {s.started && <button className="menu-entry menu-entry-subtle" onClick={() => setPanel('reset')}>
            <span className="menu-entry-number">04</span><span className="menu-entry-copy"><strong>{t('新的花园')}</strong><small>{t('清除当前进度并重新开始')}</small></span><b aria-hidden="true">→</b>
          </button>}
        </nav>
        <footer className="menu-footer"><span>{t('dynamic.menuSummary',{count:PLANTS.length})}</span><span>{t('自动存档')}</span></footer>
      </div>
    </Modal>}
    {panel === 'squirrel' && <Modal title={t('松鼠播种选种')} className="squirrel-seed-modal" close={()=>setPanel(null)}>
      <h2>{t('松鼠播种选种')}</h2><p className="modal-intro">{gardenName(s.activeGarden)} · {t('仅设置本园松鼠，手动选种保持不变。')}</p>
      <p className="squirrel-sow-status">{!team.autoSow?t('自动播种已关闭，可在商店开启。'):t('金币或收益条件不足时松鼠会等待，满足后继续播种。')}</p>
      <div className="squirrel-seed-options">{TIERS.slice(0,ULTIMATE_TIER).map((_,tier)=>{
        if(!seedVisible(s,tier as Tier))return null
        const cost=PLANTS[seedPlantId(tier as Tier)].cost, lock=seedLock(s,tier as Tier)
        return <button key={tier} className={`blue-button squirrel-seed-option tier-${tier}`} aria-pressed={team.sowTier===tier} onClick={()=>{dispatch({type:'sow-tier',tier});sound('tap');setPanel(null)}}>
          <span className="seed-bag"><Sprite id={13}/></span><span><strong>{tierName(tier)}</strong><small>{cost===0?t('免费'):t('dynamic.seedEach',{amount:number(cost)})}</small>{lock?<small>{lockText(lock)} · {t('选后等待')}</small>:s.coins<cost&&<small>{t('金币不足 · 选后等待')}</small>}</span><b>{team.sowTier===tier?'✓':''}</b>
        </button>
      })}</div>
    </Modal>}
    {panel === 'settings' && <Modal title={t('设置')} className="settings-modal" close={() => setPanel(null)}>
      <div className="settings-shell">
        <aside className="settings-sidebar">
          <span className="settings-kicker">{t('偏好设置')}</span>
          <nav aria-label={t('设置分类')}>
            {([
              ['audio', t('音效'), t('音乐与反馈音')],
              ['game', t('游戏'), t('动画与花园显示')],
              ['language', t('语言'), t('简体中文 / English')],
            ] as [SettingsSection, string, string][]).map(([id, label, note], index) => <button key={id} className={settingsSection === id ? 'active' : ''} aria-current={settingsSection === id ? 'page' : undefined} onClick={() => setSettingsSection(id)}><span>0{index + 1}</span><strong>{label}</strong><small>{note}</small></button>)}
          </nav>
        </aside>
        <section className="settings-content">
          {settingsSection === 'audio' && <>
            <div className="settings-heading"><span>01</span><div><h2>{t('音效')}</h2><p>{t('调整花园的音乐与操作反馈。')}</p></div></div>
            <div className="music-card"><span className={`music-notes ${settings.music ? 'playing' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span><div><strong>{t('月光下，慢慢生长')}</strong><small>{t('原创花园摇篮曲 · 72 BPM · 循环播放')}</small></div></div>
            <label className="setting-row"><span>{t('背景音乐')}<small>{t('播放花园主题曲')}</small></span><input type="checkbox" checked={settings.music} onChange={e => { unlockAudio(); setSettings({ ...settings, music: e.target.checked }) }} /></label>
            <label className="setting-row setting-range"><span>{t('音乐音量')}<b>{Math.round(settings.musicVolume * 100)}%</b></span><input aria-label={t('音乐音量')} type="range" min="0" max="1" step=".05" value={settings.musicVolume} onChange={e => { unlockAudio(); setSettings({ ...settings, musicVolume: Number(e.target.value) }) }} /></label>
            <label className="setting-row"><span>{t('游戏音效')}<small>{t('收获、购买与操作反馈')}</small></span><input type="checkbox" checked={settings.sound} onChange={e => { unlockAudio(); setSettings({ ...settings, sound: e.target.checked }) }} /></label>
            <label className="setting-row setting-range"><span>{t('音效音量')}<b>{Math.round(settings.volume * 100)}%</b></span><input aria-label={t('音效音量')} type="range" min="0" max="1" step=".05" value={settings.volume} onChange={e => setSettings({ ...settings, volume: Number(e.target.value) })} /></label>
            <button className="settings-preview-button blue-button" onClick={() => { unlockAudio(); sound('coin') }}>{t('试听收获音效')} <span>♪</span></button>
          </>}
          {settingsSection === 'game' && <>
            <div className="settings-heading"><span>02</span><div><h2>{t('游戏')}</h2><p>{t('调整动画、装饰和存档操作。')}</p></div></div>
            <label className="setting-row"><span>{t('植物与助手动画')}<small>{t('关闭后保留必要的状态变化')}</small></span><input type="checkbox" checked={settings.motion} onChange={e => setSettings({ ...settings, motion: e.target.checked })} /></label>
            {team.decorations.length>0&&<div className="decoration-settings"><h3>{gardenName(s.activeGarden)} · {t('装饰展示')}</h3>{team.decorations.map(id=><label className="setting-row" key={id}><span>{decorationName(id)}</span><input type="checkbox" checked={!team.hiddenDecorations.includes(id)} onChange={()=>dispatch({type:'decoration-toggle',id})}/></label>)}</div>}
            <div className="settings-save-note"><strong>{t('自动保存已开启')}</strong><p>{t('每 3 秒保存一次，最多结算 30 分钟离线成长。菜单和设置会暂停当前游戏。')}</p></div>
            <button className="settings-danger-button" onClick={() => setPanel('reset')}>{t('重置花园并重新开始')} <span>→</span></button>
          </>}
          {settingsSection === 'language' && <>
            <div className="settings-heading"><span>03</span><div><h2>{t('语言')}</h2><p>{t('选择菜单与游戏界面的显示语言。')}</p></div></div>
            <div className="language-options" role="radiogroup" aria-label={t('界面语言')}>
              <button role="radio" aria-checked={settings.language === 'zh'} className={settings.language === 'zh' ? 'selected' : ''} onClick={() => setSettings({ ...settings, language: 'zh' })}><span>简</span><strong>简体中文</strong><small>Chinese (Simplified)</small><b>{settings.language === 'zh' ? '✓' : '→'}</b></button>
              <button role="radio" aria-checked={settings.language === 'en'} className={settings.language === 'en' ? 'selected' : ''} onClick={() => setSettings({ ...settings, language: 'en' })}><span>EN</span><strong>English</strong><small>英语 / English</small><b>{settings.language === 'en' ? '✓' : '→'}</b></button>
            </div>
          </>}
        </section>
      </div>
      <div className="settings-footer"><small>{t('更改会立即保存')}</small><div><button className="primary-button" onClick={() => setPanel(null)}>{screen === 'game' ? t('返回花园') : t('返回主菜单')}</button>{screen === 'game' && <button className="blue-button" onClick={() => { setPanel(null); setScreen('menu') }}>{t('主菜单')}</button>}</div></div>
    </Modal>}
    {panel === 'help' && <Modal title={t('玩法指南')} close={() => setPanel(null)}><h2>{t('help.title')}</h2><ol className="help-list"><li><b>{t('help.chooseTitle')}</b><p>{t('help.choose')}</p></li><li><b>{t('help.waterTitle')}</b><p>{t('help.water')}</p></li><li><b>{t('help.expandTitle')}</b><p>{t('help.expand')}</p></li><li><b>{t('help.starTitle')}</b><p>{t('help.star',{cost:number(PLANTS[ULTIMATE_ID].cost)})}</p></li></ol><p className="settings-note">{t('help.note')}</p><button className="primary-button" onClick={() => setPanel(null)}>{t('help.done')}</button></Modal>}
    {panel === 'book' && <Modal title={t('植物图鉴')} className="book-modal" close={() => setPanel(null)}><h2>{t('奇植图鉴')} <small>{harvestedKinds} / {PLANTS.length}</small></h2><p className="modal-intro">{t('实际收获点亮品种；外观变体只要培育成熟即永久记录。七个常规品阶中，每档最稀有品种拥有一个专属变种。')}</p>{s.untrackedHarvests > 0 && <p className="settings-note">{t('dynamic.oldHarvests',{count:number(s.untrackedHarvests)})}</p>}<div className="book-grid">{TIER_PLANTS.flat().map(id => PLANTS[id]).map(p => {
      const count = s.harvestCounts[p.id], known = count > 0
      return <article key={p.id} data-testid={`book-plant-${p.id}`} className={known ? 'discovered' : 'undiscovered'}><div className="book-plant-art"><PlantSprite id={p.id} />{variantFor(p.id)&&<div className="variant-collection">{(()=>{const collected=s.variants.includes(`${p.id}:1`);return <span className={collected?'variant-known':'variant-unknown'} title={collected?variantName(p.id):t('未知变种')}><span className={collected?'':'variant-silhouette'}><PlantSprite id={p.id} variant/></span><small>{collected?variantName(p.id):t('未知变种')}</small></span>})()}</div>}</div><div className="book-copy"><h3>{known ? plantName(p.id) : t('未知植物')}<small>{t(`data.tierShorts.${p.tier}`)} · {known ? t('已收获') : t('未收获')}</small></h3><p className="harvest-count">{t('累计收获')} <b>{number(count)}</b> {t('次')}</p>{known ? <><p>{t('基础成长')} {formatTime(p.seconds)} · {t('基础产值')} {number(p.reward)} {t('金币')}{p.id === ULTIMATE_ID ? t(' · 成熟即通关') : ''}</p><span>{english?t('book.genericLore'):p.lore}</span></> : <span>{t('收获后解锁名字与详细资料')}</span>}</div></article>
    })}</div></Modal>}
    {panel === 'reset' && <Modal title={t('开始新的花园')} close={() => setPanel(null)}><h2>{t('重新种下第一颗种子？')}</h2><p className="modal-intro">{t('这会替换本机的花园存档，金币、植物和升级会重新开始。音效设置会保留。')}</p><div className="modal-actions"><button className="blue-button" onClick={() => setPanel(null)}>{t('保留我的花园')}</button><button className="primary-button" onClick={reset}>{t('开始新的花园')}</button></div></Modal>}
    {won && !panel && <Modal title={t('星之花绽放，通关成功')} className="victory-modal"><div className="victory-stars" aria-hidden="true"><PixelBurst kind="star" /><PixelBurst kind="coin" /></div><span className="menu-eyebrow">{t('一颗星星，为你而开')}</span><Sprite id={9} /><h2>{t('星之花，绽放了。')}</h2><p>{t('从第一颗小小的种子，到一整个星光花园。')}<br />{t('谢谢你的每一次照料。')}</p><div className="victory-stats"><div><small>{t('通关用时')}</small><strong data-testid="win-time">{formatTime(s.wonAt ?? 0)}</strong></div><div><small>{t('收获植物')}</small><strong>{s.harvests}</strong></div><div><small>{t('收获品种')}</small><strong>{harvestedKinds}/{PLANTS.length}</strong></div></div><button className="primary-button" onClick={() => setVictoryDismissed(true)}>{t('继续照料花园')}</button><small className="menu-footnote">{t('旅程完成了，花园的故事还在继续。')}</small></Modal>}
  </div>
}
