import { GardenBackdrop } from './GardenBackdrop'
import { GardenAnimal } from './GardenAnimal'
import { ModalScroll } from './ModalScroll'
import { GardenHabitat } from './GardenHabitat'
import { ToolArt } from './ToolArt'
import { DecorationArt } from './DecorationArt'
import { useEffect, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { PLANTS, TIERS, UPGRADES, SAVE_KEY, newGame, parseSave, reducer, unlocked, price, upgradePrice, growthRate, formatTime, capacity, STATIONS, WATER_DURATION, upgradeLock, nextResearch, ULTIMATE_ID, ULTIMATE_TIER, TIER_PLANTS, seedPlantId, seedVisible, GARDENS, gardenCount, teamFor, hireCatalog, hireAvailable, hireLock, seedLock, MATERIALS, CREW_NAMES, decorationPrice, GARDEN_PRICES, potPrice, expansionLock, variantFor, plantedReward, DECORATIONS, WEATHER, WEATHER_EFFECTS, WEATHER_DURATION, activeWeather, infiniteWater, type Tier, type GameState } from './game'
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
const EN_TIERS = ['Common Seed', 'Rare Seed', 'Precious Seed', 'Exotic Seed', 'Mythic Seed', 'Ancient Seed', 'Astral Seed', 'Ultimate Seed']
const EN_GARDENS = [
  ['Mosslight Conservatory', 'Tender shoots in rain-washed soil'],
  ['Firefly Brook', 'A stream winds past luminous mushrooms'],
  ['Amber Sand Court', 'Warm wind over golden stone steps'],
  ['Aurora Snow Garden', 'Ice crystals mirror the drifting aurora'],
  ['Astral Terrace', 'Grow the final flower beneath the stars'],
] as const
const EN_PLANTS = [
  'Tender Bean', 'Redcap Mushroom', 'Peach Tulip', 'Dewdrop Bloom', 'Moon Orchid', 'Sun Coinflower', 'Gentle Flytrap', 'Starfrost Crystal', 'Violet Dreambell', 'Eternal Starflower',
  'Golden Lilybell', 'Amber Lanternberry', 'Emerald Agave', 'Coral Flamebloom', 'Thunder Bamboo', 'Aurora Fern', 'Night-Sky Lotus', 'Phoenix Crown', 'Hourglass Orchid', 'Spiral Galaxy Tree',
  'Corona Lotus', 'Amber Fern', 'Dragonbone Vine', 'Fossil Tree', 'First Lotus', 'Comet-Tail Grass', 'Ringstar Mushroom', 'Eclipse Bell', 'Heart of the Cosmos',
]
const EN_VARIANTS: Record<number, string> = { 10:'Frosted Silver Bells', 11:'Twin Firefly Lanterns', 12:'Amethyst Crown', 16:'Moonlit Butterfly Lotus', 20:'Black-Sun Corona', 24:'Dragon-Sleep Lotus', 28:'Twin-Star Resonance' }
const EN_DECORATIONS: Record<string, string> = { bunting:'Leaf Bunting', fence:'Whitewood Fence', mushrooms:'Mushroom Path', lights:'Warm Star Lights', fountain:'Moonwell Ornament', moon:'Star-Moon Chime' }
const EN_WEATHER = ['Soft Rain', 'Firefly Night', 'Rainbow']
const EN_WEATHER_EFFECTS = ['Natural growth ×2', 'Harvest value ×7', 'Infinite watering can']
const EN_CREW = { water:'Watering Snail', harvest:'Harvest Beetle', sow:'Sowing Squirrel' } as const
const EN_MATERIALS = ['Wooden', 'Copper', 'Iron', 'Gold', 'Diamond']
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
    {close ? <><header className="modal-header"><strong>{title}</strong><button className="close-button blue-button" aria-label="关闭菜单 / Close menu" onClick={close}>×</button></header><ModalScroll>{children}</ModalScroll></> : children}
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
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('audio')
  const english = settings.language === 'en'
  const text = (zh: string, en: string) => english ? en : zh
  const tierName = (tier: number) => english ? EN_TIERS[tier] : TIERS[tier]
  const gardenName = (page: number) => english ? EN_GARDENS[page][0] : GARDENS[page].name
  const gardenSubtitle = (page: number) => english ? EN_GARDENS[page][1] : GARDENS[page].subtitle
  const plantName = (id: number) => english ? EN_PLANTS[id] : PLANTS[id].name
  const variantName = (id: number) => english ? EN_VARIANTS[id] : variantFor(id)?.name
  const decorationName = (id: string) => english ? EN_DECORATIONS[id] : DECORATIONS.find(d => d.id === id)?.name
  const lockText = (lock: string | null) => {
    if (!english || !lock) return lock
    if (lock.startsWith('累计获得')) return lock.replace('累计获得', 'Earn').replace('金币后开放', 'coins in total to unlock')
    if (lock.startsWith('本园收获')) return lock.replace('本园收获', 'Harvest').replace('株后开放', 'plants here to unlock')
    if (lock.startsWith('团队磨合中')) return lock.replace('团队磨合中', 'Team settling in')
    if (lock === '先提升丰收研究或前往高收益花园') return 'Improve Harvest Study or move to a richer garden'
    if (lock === '继续经营花园后开放') return 'Keep tending the garden to unlock'
    if (lock === '先将最新花园扩至15盆') return 'Expand the newest garden to 15 pots first'
    if (lock === '先完成最新花园解锁的研究') return 'Complete the newest garden studies first'
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
  const waterLevel = rainbow?3: s.player.stock===0?0:s.player.stock/capacity(s,'player')<=.25?1:s.player.stock/capacity(s,'player')<=.65?2:3
  const waterState = rainbow?text('无限水量','Infinite water'):s.player.phase==='service'?text('补水中','Refilling'):(english?['Empty','Low','Half','Full']:['空壶','将空','半满','满水'])[waterLevel]
  const openGardenIndex = gardenCount(s)
  const canVisitNextGarden = s.activeGarden < openGardenIndex - 1
  const canOpenNextGarden = s.activeGarden === openGardenIndex - 1 && openGardenIndex < GARDENS.length
  const nextGardenPrice = canOpenNextGarden ? GARDEN_PRICES[openGardenIndex] : 0
  const nextGardenBlock = canOpenNextGarden ? lockText(expansionLock(s)) ?? (s.coins < nextGardenPrice ? text(`金币不足 · 需要 ${number(nextGardenPrice)}`, `Not enough coins · Need ${number(nextGardenPrice)}`) : null) : null
  const nextGardenLabel = canVisitNextGarden ? text(`下一座花园 · ${GARDENS[s.activeGarden+1].name}`, `Next garden · ${gardenName(s.activeGarden+1)}`) : canOpenNextGarden ? text(`开辟${GARDENS[openGardenIndex].name} · ${nextGardenBlock ?? `花费 ${number(nextGardenPrice)} 金币`}`, `Open ${gardenName(openGardenIndex)} · ${nextGardenBlock ?? `Costs ${number(nextGardenPrice)} coins`}`) : text('已是最后一座花园','This is the final garden')

  useEffect(() => { current.current = s }, [s, persist])
  useEffect(() => {
    configureAudio(settings.sound && !observing, settings.volume, settings.music, settings.musicVolume)
    document.documentElement.lang = settings.language === 'en' ? 'en' : 'zh-CN'
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
      if (gap > 10) { dispatch({ type: 'tick', dt: gap }); setToast(text(`离线照料了 ${formatTime(gap)}，欢迎回到花园。`, `Your helpers tended the garden for ${formatTime(gap)}. Welcome back.`)) }
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
    if (p.plant === null && !(tool === 'cart' && moveFrom !== null)) {
      if (seedLock(s,selected.tier)) { setToast(lockText(seedLock(s,selected.tier))!); return }
      if (s.coins < price(s, selected)) { setToast(text(`金币不足：${TIERS[selected.tier]}需要 ${price(s, selected)} 金币。普通种子始终免费。`, `Not enough coins: ${tierName(selected.tier)} costs ${number(price(s,selected))}. Common Seeds are always free.`)); return }
      sound('plant')
      setFloats(f => [...f.slice(-9), { id: floatId.current++, pot: index, text: text('种下了！','Planted!'), kind: 'plant' }])
      dispatch({ type: 'pot', index }); return
    }
    if (tool === 'fertilizer') {
      if(p.plant===null || p.plant===ULTIMATE_ID || p.growth>=PLANTS[p.plant].seconds || s.fertilizer===0){setToast(text('肥料仅能用于未成熟的非终极植物，每次消耗一份。','Fertilizer works only on an immature non-ultimate plant and consumes one bag.'));return}
      dispatch({type:'fertilize',index});sound('reveal');setFloats(f=>[...f,{id:floatId.current++,pot:index,text:text('立即成熟！','Matured!'),kind:'star'}]);return
    }
    if (tool === 'shovel') {
      if (p.plant === null) { setToast(text('这是空花盆，无需挖除。再次点击铲子可取消选择。','This pot is empty. Click the shovel again to cancel.')); return }
      dispatch({ type: 'dig', index }); sound('tap')
      setFloats(f => [...f.slice(-9), { id: floatId.current++, pot: index, text: text('已挖除 · 无收益','Removed · No reward'), kind: 'dig' }]); return
    }
    if (tool === 'cart') {
      if (moveFrom === null) {
        if (p.plant === null) { setToast(text('先选择要移动的植物，再点击目标花盆。','Choose a plant first, then click its destination.')); return }
        setMoveFrom(index); sound('tap'); return
      }
      if (moveFrom === index) { setMoveFrom(null); return }
      if (s.pots[moveFrom]?.plant === null) { setMoveFrom(null); setToast(text('这株植物已经被收获，请重新选择。','That plant has already been harvested. Choose another.')); return }
      dispatch({ type: 'move', from: moveFrom, to: index }); setMoveFrom(null); sound('plant')
      setFloats(f => [...f.slice(-7), ...[moveFrom, index].map(pot => ({ id: floatId.current++, pot, text: text('搬运完成','Moved'), kind: 'move' }))]); return
    }
    if (tool === 'water' && p.plant !== null && p.growth < PLANTS[p.plant].seconds) {
      if ((p.watering ?? 0) > 0) return
      if(p.plant===ULTIMATE_ID && s.elapsed-p.wateredAt<5){setToast(text('星之花正在吸收水分，每5秒可浇水一次。','The Starflower is absorbing water. Water it once every 5 seconds.'));return}
      if (!rainbow && s.player.phase !== 'idle') { setToast(text('水壶正在装填，请稍等。','The watering can is refilling.')); return }
      if (!rainbow && s.player.stock === 0) { setToast(text('水壶空了，请点击花园左下角的水池打水。','The can is empty. Refill it at the lower-left pool.')); return }
      dispatch({ type: 'water', index }); return
    }
    let rewardText = ''
    if (p.plant !== null && p.growth >= PLANTS[p.plant].seconds) { rewardText = `+${number(plantedReward(s,index))}`; sound('coin') }
    else { setToast(text('选择顶部水壶，再点击植物浇水。','Select the watering can, then click a plant.')); return }
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
      setToast(text(`暂不能开辟${GARDENS[openGardenIndex].name} · ${nextGardenBlock}`, `Cannot open ${gardenName(openGardenIndex)} yet · ${nextGardenBlock}`))
      sound('tap')
      return
    }
    const name = GARDENS[openGardenIndex].name
    dispatch({type:'open-garden'})
    setInspectedPot(null)
    setMoveFrom(null)
    sound('buy')
    setToast(text(`${name}已开辟`,`${gardenName(openGardenIndex)} opened`))
  }
  function choose(id: number) { dispatch({ type: 'select', id }); sound('tap'); showMobilePanel('garden') }
  function reset() { setTool(null); setMoveFrom(null); setObserving(false); setInspectedPot(null); setFloats([]); setMobilePanel('garden'); dispatch({ type: 'reset' }); offlineApplied.current = true; setVictoryDismissed(false); setPanel(null); setScreen('game'); setCategory(0); setToast(text('新的花园，从一包免费种子开始。','A new garden begins with a packet of free seeds.')) }


  const squirrelPicker = team.workers.sow.length>0 && <button className="squirrel-picker-button tool-button" aria-label={text(`松鼠播种选种，当前${TIERS[team.sowTier]}`, `Squirrel seed choice, currently ${tierName(team.sowTier)}`)} aria-haspopup="dialog" title={text(`本园松鼠播种：${TIERS[team.sowTier]}`, `Squirrels sow: ${tierName(team.sowTier)}`)} onClick={()=>setPanel('squirrel')}>
    <GardenAnimal kind="sow"/>
    <span className={`squirrel-current-seed tier-${team.sowTier}`}><span className="seed-bag"><Sprite id={13}/></span></span><span>{text('松鼠','Squirrel')}</span>
  </button>

  return <div onDragStart={e=>e.preventDefault()} className={`game-shell ${landscapeShopOpen ? 'landscape-shop-open' : 'landscape-shop-closed'} ${!settings.motion ? 'reduce-motion' : ''} ${screen === 'menu' ? 'on-menu' : ''} ${paused ? 'is-paused' : ''} ${observing ? 'observation-mode' : ''}`}>
    <Fireflies />
    {observing && <div className="observation-toolbar"><span>{s.wonAt !== null ? text('星之花已绽放 · 花园仍在生长','The Starflower has bloomed · The garden keeps growing') : text('静静生长 · 助手继续照料','Quiet growth · Helpers keep tending')}</span><button className="blue-button" onClick={() => setObserving(false)}>{text('退出观赏','Exit view')} <small>Esc</small></button></div>}
    <header className="topbar">
      <div className="stat wood coin-stat"><Sprite id={15} /><div><small>{text('花园金币','GARDEN COINS')}</small><strong data-testid="coins">{number(s.coins)}</strong></div></div>
      <div className="stat wood"><Icon name="leaf" /><div><small>{text('收获图鉴','COLLECTION')}</small><strong>{harvestedKinds}<em>/ {PLANTS.length}</em></strong></div></div>
      <div className="brand"><span>MOONLIT GARDEN</span><h1>{text('月光奇植园','Moonlit Garden')}</h1></div>
      <div className="time-display"><span className="live-dot" />{s.wonAt !== null ? text('自由种植','Free play') : text('花园时光','Garden time')}<strong data-testid="elapsed">{formatTime(s.elapsed)}</strong></div>
      <button className="landscape-shop-toggle blue-button" aria-expanded={landscapeShopOpen} aria-controls="garden-shop" onClick={() => setLandscapeShopOpen(!landscapeShopOpen)}>{landscapeShopOpen ? text('收起商店','Close shop') : text('打开商店','Open shop')}</button>
      <button className="blue-button icon-button" aria-label={text('植物图鉴','Plant collection')} onClick={() => setPanel('book')}><Icon name="book" /></button>
      <button className="blue-button icon-button" aria-label={text('游戏设置','Game settings')} onClick={() => setPanel('settings')}><Icon name="gear" /></button>
    </header>
    <nav className="mobile-nav" aria-label={text('游戏面板','Game panels')}>{(['garden', 'seeds', 'upgrades'] as const).map((id, i) => <button key={id} className={mobilePanel === id ? 'active' : ''} aria-current={mobilePanel === id ? 'page' : undefined} onClick={() => showMobilePanel(id)}>{(english?['Garden','Seeds','Shop']:['花园','种子','商店'])[i]}</button>)}</nav>
    <main className="game-layout">
      <aside className={`seed-panel wood ${mobilePanel === 'seeds' ? 'mobile-active' : ''}`} aria-label={text('种子商店','Seed shop')}>
        <h2 className="panel-title"><Icon name="leaf" />{text('种 子','SEEDS')}<Icon name="leaf" /></h2>
        <div className="tier-list">{TIERS.map((name, i) => {
          if(!seedVisible(s,i as Tier))return null
          const open = unlocked(s, i as Tier), active = selected.tier === i
          return <button key={name} className={`tier-card blue-button tier-${i} ${active ? 'selected' : ''}`} aria-pressed={active} disabled={!open} onClick={() => choose(seedPlantId(i as Tier))}>
            <span className="seed-bag"><Sprite id={13} /></span>
            <span className="tier-copy"><strong>{tierName(i)}</strong><b>{i === 0 ? text('免费 · 无限','Free · Unlimited') : text(`${number(price(s, PLANTS[seedPlantId(i as Tier)]))} 金币`, `${number(price(s, PLANTS[seedPlantId(i as Tier)]))} coins`)}</b><small>{i === ULTIMATE_TIER ? text('种出星星 · 完成旅程','Grow a star · Complete the journey') : lockText(seedLock(s,i as Tier))??text(`${TIER_PLANTS[i].filter(id => s.harvestCounts[id] > 0).length} / 4 已收获`,`${TIER_PLANTS[i].filter(id => s.harvestCounts[id] > 0).length} / 4 harvested`)}</small></span>
          </button>
        })}</div>
        <div className="landscape-seed-picker">{squirrelPicker}</div>
        <div className="shop-note"><Icon name="seed" /><p>{text('选好等级，点击空花盆','Choose a tier, then click an empty pot')}<br />{text('购买并随机播种。','to buy and sow a random plant.')}</p></div>
      </aside>

      <section className={`garden-section ${mobilePanel === 'garden' ? 'mobile-active' : ''}`} aria-label={text('花园','Garden')}>
        <div className={`garden-board garden-${garden.theme} wood zen-garden ${team.workers.sow.length?'has-squirrels':''}`}>
          <GardenBackdrop page={s.activeGarden}/>
        <div className="garden-tools" role="group" aria-label={text('园艺工具','Garden tools')}>
          <div className="tool-slots">
            <div className="watering-cubby">
              <button className={`tool-button water-tool ${tool === 'water' ? 'selected' : ''} ${s.player.phase==='service'?'is-refilling':''}`} data-water-state={waterState} title={text(`水壶 · ${waterState}。点击选择水壶；到花园左下角的水池打水。`, `Watering can · ${waterState}. Select it, then refill at the pool.`)} aria-label={text(`水壶工具 · ${waterState}`,`Watering can · ${waterState}`)} aria-pressed={tool === 'water'} onClick={() => { setTool(tool==='water'?null:'water');setMoveFrom(null) }}><ToolArt kind="water" waterLevel={waterLevel}/>{rainbow && <b className="tool-quantity">∞</b>}<span>{text('水壶','Water')}</span></button>
            </div>
            <button className={`tool-button ${tool === 'fertilizer' ? 'selected' : ''}`} title={text('肥料 · 使非终极植物立即成熟','Fertilizer · Instantly mature a non-ultimate plant')} aria-label={text('肥料工具','Fertilizer tool')} aria-pressed={tool === 'fertilizer'} onClick={()=>{setTool(tool === 'fertilizer' ? null : 'fertilizer');setMoveFrom(null)}}><ToolArt kind="fertilizer"/><b className="tool-quantity">×{s.fertilizer}</b><span>{text('肥料','Fertilize')}</span></button>
            <button className={`tool-button ${tool === 'cart' ? 'selected' : ''}`} title={text('小推车 · 选择植物，切换花园后点击花盆搬运或交换','Cart · Select a plant, change gardens, then move or swap it')} aria-label={text('小推车工具','Cart tool')} aria-pressed={tool === 'cart'} onClick={() => { setTool(tool === 'cart' ? null : 'cart'); setMoveFrom(null) }}><ToolArt kind="cart"/>{moveFrom !== null && s.pots[moveFrom]?.plant != null && <span className="cart-passenger" aria-hidden="true"><PlantSprite id={s.pots[moveFrom].plant!} variant={!!s.pots[moveFrom].variant}/></span>}<span>{text('小推车','Cart')}</span></button>
            <button className={`tool-button ${tool === 'shovel' ? 'selected' : ''}`} title={text('铲子 · 挖除植物，不获得收益','Shovel · Remove a plant without a reward')} aria-label={text('铲子工具','Shovel tool')} aria-pressed={tool === 'shovel'} onClick={() => { setTool(tool === 'shovel' ? null : 'shovel'); setMoveFrom(null) }}><ToolArt kind="shovel"/><span>{text('铲子','Shovel')}</span></button>
            {squirrelPicker}
          </div>
          <div className="tool-shelf-actions"><button className="text-button" onClick={()=>{setObserving(true);setMobilePanel('garden');setFloats([]);setToast('')}}>{text('观赏','View')}</button><button className="text-button" aria-label={text('玩法指南','How to play')} onClick={()=>setPanel('help')}>?</button></div>
          <div className="seed-shortcuts" role="group" aria-label={text('快捷选种','Quick seed selection')}>
            {TIERS.map((name, i) => {
              const tier=i as Tier
              if (!seedVisible(s,tier)||!unlocked(s,tier)) return null
              const id=seedPlantId(tier), cost=price(s,PLANTS[id]), active=selected.tier===tier
              return <button key={tier} className={`seed-shortcut blue-button tier-${tier} ${active?'selected':''} ${s.coins<cost?'unaffordable':''}`} aria-pressed={active} aria-label={text(`${name}，${cost===0?'免费':`${number(cost)}金币`}${s.coins<cost?'，金币不足':''}`,`${tierName(tier)}, ${cost===0?'free':`${number(cost)} coins`}${s.coins<cost?', not enough coins':''}`)} onClick={()=>choose(id)}>
                <span className="seed-bag"><Sprite id={13}/></span><span><strong>{english?tierName(tier).replace(' Seed',''):name.replace('种子','')}</strong><small>{s.coins<cost?text('不足 · ','Short · '):''}{cost===0?text('免费','Free'):number(cost)}</small></span>
              </button>
            })}
          </div>
          <p className="tool-hint">{tool === 'fertilizer' ? text('点击植物施肥 · 点击空盆仍播种当前种子','Click a plant to fertilize · Empty pots still sow the selected seed') : tool === 'shovel' ? text('点击植物挖除 · 点击空盆仍播种当前种子 · 再点铲子取消','Click a plant to remove it · Empty pots still sow · Click the shovel again to cancel') : tool === 'cart' ? moveFrom === null ? text('选择植物搬运 · 点击空盆仍播种当前种子','Choose a plant to move · Empty pots still sow') : text(`已选 ${GARDENS[Math.floor(moveFrom/15)].name} · ${moveFrom%15+1} 号盆，可跨园搬运；再点小推车取消`,`Selected ${gardenName(Math.floor(moveFrom/15))} · Pot ${moveFrom%15+1}; change gardens to move it`) : tool === 'water' ? text('点击植物浇水 · 点击空盆仍播种当前种子 · 点击左下角水池打水','Click a plant to water · Empty pots still sow · Refill at the lower-left pool') : text('点击空盆播种，点击成熟植物收获','Click an empty pot to sow, or a mature plant to harvest')}</p>
        </div>
          <h2 className="scene-garden-name" aria-live="polite">{gardenName(s.activeGarden)}</h2>
          <button className="scene-arrow scene-prev" aria-label={text('上一座花园','Previous garden')} disabled={s.activeGarden===0} onClick={()=>{dispatch({type:'garden',index:s.activeGarden-1});setInspectedPot(null)}}><svg viewBox="0 0 32 40" aria-hidden="true"><path d="M29 9H17V2L2 20l15 18v-8h12Z"/></svg></button>
          <button data-testid="next-garden" className={`scene-arrow scene-next ${canOpenNextGarden?'scene-open-next':''} ${nextGardenBlock?'scene-open-blocked':''}`} aria-label={nextGardenLabel} title={nextGardenLabel} disabled={!canVisitNextGarden&&!canOpenNextGarden} onClick={advanceGarden}><svg viewBox="0 0 32 40" aria-hidden="true"><path d="M3 9h12V2l15 18-15 18v-8H3Z"/></svg></button>
          {weather !== null && <div className={`weather-overlay weather-${s.weather.kind}`} aria-label={english?`${EN_WEATHER[s.weather.kind]}, ${EN_WEATHER_EFFECTS[s.weather.kind]}, ${Math.ceil(s.weather.started+WEATHER_DURATION-s.elapsed)} seconds left`:`${WEATHER[s.weather.kind]}天气，${WEATHER_EFFECTS[s.weather.kind]}，剩余${Math.ceil(s.weather.started+WEATHER_DURATION-s.elapsed)}秒`}><span>{english?EN_WEATHER[s.weather.kind]:WEATHER[s.weather.kind]} · {english?EN_WEATHER_EFFECTS[s.weather.kind]:WEATHER_EFFECTS[s.weather.kind]} · {Math.ceil(s.weather.started+WEATHER_DURATION-s.elapsed)} {text('秒','sec')}</span>{s.weather.kind===2&&<svg className="pixel-rainbow" viewBox="0 0 64 32" shapeRendering="crispEdges" aria-hidden="true">{["#bba1d3","#8fcbdc","#b0d398","#e6cf88","#dc94a0"].map((color,i)=><path key={color} d={`M${4+i*2} 30V${16+i*2}h6v-6h8V${4+i*2}h${28-i*4}v6h8v6h6V30`} fill="none" stroke={color} strokeWidth="2"/>)}</svg>}{Array.from({length:28},(_,i)=><i key={i} style={{left:`${i*37%100}%`,top:`${i*23%100}%`,animationDelay:`-${i*.19}s`}}/>)}</div>}
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
            if (localIndex===team.potCount) return <button key={i} data-testid="buy-pot" className="locked-pot ground-marker purchase-pot" style={placement} disabled={s.coins<potPrice(s)} aria-label={text(`购买第${localIndex+1}个花盆，${potPrice(s)}金币`,`Buy pot ${localIndex+1} for ${number(potPrice(s))} coins`)} onClick={() => { dispatch({type:'expand'}); sound('buy'); setToast(text(`已添加第 ${team.potCount+1} 个花盆`,`Pot ${team.potCount+1} added`)); }}><span>＋</span><small>◈ {number(potPrice(s))}</small></button>
            const p = pot.plant === null ? null : PLANTS[pot.plant]
            const ready = p !== null && pot.growth >= p.seconds
            const seed = p !== null && pot.growth < p.seconds * .15
            const young = p !== null && pot.growth < p.seconds * .5
            const sprite = p === null || young ? null : p.id
            return <button key={i} data-testid={`pot-${i}`} aria-label={`花盆${i + 1} ${p?.name ?? '空闲'} ${!p && !(tool === 'cart' && moveFrom !== null) ? '播种' : tool === 'fertilizer' ? '施肥' : tool === 'shovel' ? '挖除' : tool === 'cart' ? moveFrom === null ? '选择移动' : '移动到此处' : ready ? '收获' : tool === 'water' ? '使用水壶' : '生长中'}`} className={`pot ${inspectedPot === i ? 'inspected' : ''} ${moveFrom === i ? 'move-source' : ''} ${tool === 'cart' && moveFrom !== null ? 'move-destination' : ''} ${(pot.watering ?? 0) > 0 ? 'watering-cooldown' : ''} ${ready ? 'ready' : ''} ${p && !ready && !young ? 'growing-adult' : ''} ${p === null ? 'empty-pot' : ''} ${p?.tier === ULTIMATE_TIER ? 'ultimate' : ''} ${p && !seed ? 'alive' : ''} plant-${p?.id ?? 'empty'}`} style={placement} onClick={() => potClick(i)}>

              {p && <span className="plant-name">{`${pot.variant ? variantName(p.id) + ' · ' : ''}${plantName(p.id)}`}</span>}
              {p && !young && p.tier > 0 && <span className={`plant-aura aura-${p.tier}`} aria-hidden="true"><i /><i /><i /></span>}
              <span key={`${sprite}-${ready}`} className="plant-art-slot">{sprite === null ? <Sprite id={10} className="pot-art" /> : <PlantSprite id={sprite} className="pot-art" variant={!!pot.variant} />}</span>
              {pot.revealedAt !== undefined && s.elapsed - pot.revealedAt < 1 && <span key={`reveal-${pot.revealedAt}`} className="rare-reveal" aria-hidden="true">✦<PixelBurst kind="star" /></span>}
              {p && young && <Sprout id={p.id} tiny={seed} />}
              {(pot.watering ?? 0) > 0 && <span className="tool-pour" style={{ animationDuration: `${WATER_DURATION}s` }} aria-hidden="true"><ToolArt kind="water" waterLevel={waterLevel}/><span className="tool-water-stream">▪<i>▪</i><b>▪</b></span></span>}
              {(pot.watering ?? 0) > 0 && <span className="watering-timer" data-testid={`watering-${i}`} aria-label={text('本株浇水冷却中','This plant is absorbing water')}><Progress value={(pot.watering ?? 0) / WATER_DURATION} /></span>}
              {floats.some(f => f.pot === i && f.kind === 'move') && <span className="tool-cart-animation" aria-hidden="true"><ToolArt kind="cart" /></span>}
              {floats.some(f => f.pot === i && f.kind === 'dig') && <span className="tool-dig-animation" aria-hidden="true"><Icon name="shovel" /><i /><i /><i /></span>}
              {ready && <span className="ripe-sparkles" aria-hidden="true">✦<i>✧</i><b>✦</b></span>}
              {p && s.elapsed - pot.wateredAt < .65 && <span key={`water-${pot.wateredAt}`} className="water-drop" aria-hidden="true">♦<PixelBurst kind="water" /></span>}
              <span className="pot-sign"><strong>{p ? ready ? text('可收获','READY') : seed ? text('萌芽中','SPROUTING') : young ? text('生长中','GROWING') : p.tier === ULTIMATE_TIER ? text('凝聚星光','STARLIGHT') : text('成株生长','MATURE GROWTH') : text('空 闲','EMPTY')}</strong><Progress value={p ? pot.growth / p.seconds : 0} gold={p?.tier === ULTIMATE_TIER} /><small>{tool === 'shovel' ? p ? text('挖除 · 无收益','Remove · No reward') : text('空花盆','Empty pot') : p ? ready ? text(`+${number(plantedReward(s,i))} 金币`,`+${number(plantedReward(s,i))} coins`) : `${formatTime((p.seconds - pot.growth) / growthRate(s))}` : text('点击播种','Click to sow')}</small></span>
              {floats.filter(f => f.pot === i).map(f => <span className={`pot-feedback feedback-${f.kind}`} key={f.id}><span className="float-label">{f.text}</span>{f.kind !== 'water' && <PixelBurst kind={f.kind} />}</span>)}
            </button>
          })}
            <div className={`supply-station water-station ${s.player.phase==='service'?'pool-refilling':''}`} style={{ left: `${STATIONS.water.x}%` }}>
              <button className="pool-refill-button" aria-label={rainbow?text('彩虹期间无需补水','No refill needed during a rainbow'):s.player.phase==='service'?text('水池 · 打水中','Pool · Refilling'):s.player.stock===capacity(s,'player')?text('水池 · 水壶已满','Pool · Can is full'):text('水池 · 给水壶打水','Pool · Refill watering can')} title={text('点击水池给水壶打水，蜗牛也在这里补水','Click the pool to refill; snails refill here too')} disabled={paused||rainbow||s.player.phase!=='idle'||s.player.stock===capacity(s,'player')} onClick={()=>{setTool('water');setMoveFrom(null);dispatch({type:'refill'});sound('tap')}}>
                <span className="pixel-pool" aria-hidden="true"/>
                {s.player.phase==='service'&&<span className="pool-dipping-can" aria-hidden="true"><ToolArt kind="water" waterLevel={waterLevel}/><i/><i/></span>}
                <b>{rainbow?text('彩虹 · 无限水量','Rainbow · Infinite water'):s.player.phase==='service'?text('打水中…','Refilling…'):s.player.stock===capacity(s,'player')?text('水池 · 壶已满','Pool · Can full'):text('水池 · 点击打水','Pool · Click to refill')}</b>
              </button>
            </div>
            <div className="supply-station seed-station" style={{ left: `${STATIONS.sow.x}%` }}><span className="pixel-crate"><Sprite id={13} /></span><b>{text('种子箱','SEEDS')}</b></div>
            <div className="supply-station harvest-station" style={{ left: `${STATIONS.harvest.x}%` }}><span className="pixel-crate" /><b>{text('收获站','HARVEST')}</b></div>
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
          <div className="garden-scene-caption"><small>{gardenSubtitle(s.activeGarden)} · {text('产值','Value')} ×{garden.reward} · {text('环境生长','Growth')} ×{garden.growth}</small><span>{inspectedPot !== null && s.pots[inspectedPot] ? (() => { const pot = s.pots[inspectedPot]; const p = pot.plant === null ? null : PLANTS[pot.plant]; return p ? text(`${p.name} · ${pot.growth >= p.seconds ? '已成熟，点击收获' : `成长 ${Math.floor(pot.growth / p.seconds * 100)}%`} · 收获 ${plantedReward(s,inspectedPot)} 金币`,`${plantName(p.id)} · ${pot.growth >= p.seconds ? 'Ready to harvest' : `${Math.floor(pot.growth / p.seconds * 100)}% grown`} · ${number(plantedReward(s,inspectedPot))} coins`) : text('空花盆 · 点击种下当前选择的种子','Empty pot · Click to sow the selected seed') })() : text('选择顶部工具，再点击盆栽使用','Choose a tool, then click a pot')}</span><small>{team.snails.length ? text(`${team.snails.length} 只蜗牛在园中漫游`,`${team.snails.length} snails roam this garden`) : text('雇用蜗牛后，它会往返水池与花盆','Hire a snail to tend pots from the pool')}</small></div>
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

      <aside id="garden-shop" ref={shopRef} className={`upgrade-panel ${mobilePanel === 'upgrades' ? 'mobile-active' : ''}`} aria-label={text('花园商店','Garden shop')}>
        <h2 className="panel-title"><Icon name="leaf"/>{text('商 店','SHOP')}<Icon name="leaf"/></h2>
        <div className="upgrade-tabs" role="tablist" aria-label={text('商店分类','Shop categories')}>{(english?['Studies','Helpers','Decor']:['升级','雇佣','装饰']).map((name,i)=><button role="tab" aria-selected={category===i} key={name} onClick={()=>{setCategory(i);sound('tap')}} className={category===i?'selected':''}><Icon name={['leaf','snail','star'][i]}/><span>{name}</span></button>)}</div>
        <div className={`upgrade-list ${category===1?'hire-list':''}`}>
          {category===0 && <>{research.map(u=>{const upgradeName=english?(u.icon==='coin'?`Harvest Study Lv. ${u.name.match(/\d+/)?.[0]}`:u.icon==='leaf'?`Soil Study Lv. ${u.page+1}`:`Infusion Study Lv. ${u.page+1}`):u.name;const upgradeDetail=english?(u.icon==='coin'?'Garden-wide harvest value +≈41%':u.icon==='leaf'?'Garden-wide natural growth ×2':'Manual watering growth ×2 · Can capacity ×2'):u.detail;return <button key={u.id} data-testid={`upgrade-${u.id}`} className="upgrade-card" disabled={s.coins<upgradePrice(s,u)||!!upgradeLock(s,u.id)} onClick={()=>{dispatch({type:'buy',id:u.id});sound('buy');setToast(`${upgradeName} · ${upgradeDetail}`)}}><span className="upgrade-art"><Icon name={u.icon}/></span><span className="upgrade-copy"><strong>{upgradeName}</strong><b>◈ {number(u.cost)}</b><span className="upgrade-description">{lockText(upgradeLock(s,u.id))??upgradeDetail}</span></span></button>})}{UPGRADES.every(u=>s.purchases.includes(u.id))?<p className="shop-empty">{text('全园研究已满级。','All studies are complete.')}<br/>{text('可从花园右侧箭头开辟下一园。','Use the right garden arrow to open the next garden.')}</p>:research.length===0&&<p className="shop-empty">{text('继续经营花园，会出现新的研究项目。','Keep tending the garden to reveal new studies.')}</p>}</>}
          {category===1 && <>{hireCatalog(s.activeGarden).filter(u=>hireAvailable(team,u)).map(u=>{const hireName=english?(u.type==='recruit'?`Hire ${EN_CREW[u.kind]} ${u.level}`:`${EN_MATERIALS[u.level]} ${u.kind==='water'?'Tank':u.kind==='harvest'?'Basket':'Seed Bag'}`):u.name;const hireDetail=english?(u.type==='recruit'?'Adds one independent helper to this garden':`${EN_CREW[u.kind]} capacity ×2${u.kind==='water'?', watering ×2':''}; faster movement and work`):u.detail;return <button key={u.id} data-testid={`hire-${u.id}`} className="upgrade-card" disabled={s.coins<u.cost||!!hireLock(s,u)} onClick={()=>{dispatch({type:'hire',id:u.id});sound('buy');setToast(`${gardenName(s.activeGarden)} · ${hireName}`)}}><span className="upgrade-art"><Icon name={u.kind==='water'?'snail':u.kind==='harvest'?'beetle':'squirrel'}/></span><span className="upgrade-copy"><strong>{hireName}</strong><b>◈ {number(u.cost)}</b><span className="upgrade-description">{lockText(hireLock(s,u))??hireDetail}</span></span></button>})}{hireCatalog(s.activeGarden).every(u=>!hireAvailable(team,u))&&<p className="shop-empty">{text('本园团队已满编，装备全部达到钻石制。','This garden’s team is full and all equipment is Diamond.')}</p>}</>}
          {category===2 && <>{DECORATIONS.filter(d=>!team.decorations.includes(d.id)).map(d=><button key={d.id} data-testid={`decorate-${d.id}`} className="upgrade-card" disabled={s.coins<decorationPrice(d.cost,s.activeGarden)} onClick={()=>{dispatch({type:'decorate',id:d.id});sound('buy')}}><span className="upgrade-art"><Icon name="star"/></span><span className="upgrade-copy"><strong>{decorationName(d.id)}</strong><b>◈ {number(decorationPrice(d.cost,s.activeGarden))}</b><span className="upgrade-description">{english?'Changes this garden’s appearance only':`${d.detail} · 仅本园外观`}</span></span></button>)}{team.decorations.length===DECORATIONS.length&&<p className="shop-empty">{text('本园装饰已购齐。可在设置中调整展示。','All decorations owned. Change their visibility in Settings.')}</p>}</>}
        </div>
        <div className="automation-controls">{team.workers.harvest.length>0&&<label><input type="checkbox" checked={team.autoHarvest} onChange={()=>dispatch({type:'toggle',key:'autoHarvest'})}/>{text('本园自动收获','Auto-harvest here')}</label>}{team.workers.sow.length>0&&<label><input type="checkbox" checked={team.autoSow} onChange={()=>dispatch({type:'toggle',key:'autoSow'})}/>{text('本园自动播种','Auto-sow here')}</label>}</div>
        <button className="mobile-return blue-button" onClick={()=>{showMobilePanel('garden');if(landscapeLayout())setLandscapeShopOpen(false)}}>← {text('返回花园','Back to garden')}</button>
      </aside>
    </main>
    <footer className="statusbar"><span><i className="live-dot" />{saveError ? text('存档失败，请检查浏览器存储空间','Save failed · Check browser storage') : text('自动存档 · 离线成长','Autosave · Offline growth')}</span><span>{text('选择水壶，点击浇水','Select the can, then click a plant')} <span className="keycap">CLICK</span></span><span>{text('累计收获','Harvested')} <b>{number(s.harvests)}</b> {text('株 · 收益','plants · Earned')} <b>{number(s.earned)}</b></span></footer>
    <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>

    {screen === 'menu' && !panel && <Modal title={text('月光奇植园主菜单', 'Moonlit Garden main menu')} className="start-menu">
      <div className="main-menu-frame">
        <header className="menu-edge">
          <span className="menu-wordmark">MOONLIT GARDEN</span>
          <button className="menu-quick-settings" aria-label={text('设置','Settings')} onClick={() => { setSettingsSection('audio'); setPanel('settings') }}><Icon name="gear" /><span>{text('设置', 'Settings')}</span></button>
        </header>
        <section className="menu-atmosphere" aria-labelledby="main-menu-title">
          <span className="menu-eyebrow">{text('一小片泥土，一整个奇妙世界', 'A SMALL PATCH OF SOIL. A WORLD OF WONDER.')}</span>
          <h1 id="main-menu-title">{text('月光', 'MOONLIT')}<span>{text('奇植园', 'GARDEN')}</span></h1>
          <div className="menu-plants"><Sprite id={4} /><Sprite id={9} /><Sprite id={6} /></div>
          <p>{text('种下奇妙的植物，雇用慢悠悠的蜗牛。', 'Grow curious plants and hire unhurried little helpers.')}<br />{text('在月光里，等一颗星星开花。', 'Under the moonlight, wait for a star to bloom.')}</p>
        </section>
        <nav className="menu-index" aria-label={text('主菜单', 'Main menu')}>
          <button className="menu-entry menu-entry-primary" onClick={play}>
            <span className="menu-entry-number">01</span><span className="menu-entry-copy"><strong>{s.started ? text('继续游戏', 'Continue') : text('开始游戏', 'Start game')}</strong><small>{s.started ? text(`返回 ${GARDENS[s.activeGarden].name} · ${formatTime(s.elapsed)}`, `Return to your garden · ${formatTime(s.elapsed)}`) : text('从一包免费种子开始', 'Begin with a packet of free seeds')}</small></span><b aria-hidden="true">→</b>
          </button>
          <button className="menu-entry" onClick={() => setPanel('help')}>
            <span className="menu-entry-number">02</span><span className="menu-entry-copy"><strong>{text('玩法指南', 'How to play')}</strong><small>{text('种植、浇水与经营花园', 'Plant, water, and grow your garden')}</small></span><b aria-hidden="true">→</b>
          </button>
          <button className="menu-entry" onClick={() => { setSettingsSection('audio'); setPanel('settings') }}>
            <span className="menu-entry-number">03</span><span className="menu-entry-copy"><strong>{text('设置', 'Settings')}</strong><small>{text('音效、游戏与语言', 'Audio, gameplay, and language')}</small></span><b aria-hidden="true">→</b>
          </button>
          {s.started && <button className="menu-entry menu-entry-subtle" onClick={() => setPanel('reset')}>
            <span className="menu-entry-number">04</span><span className="menu-entry-copy"><strong>{text('新的花园', 'New garden')}</strong><small>{text('清除当前进度并重新开始', 'Erase this save and begin again')}</small></span><b aria-hidden="true">→</b>
          </button>}
        </nav>
        <footer className="menu-footer"><span>{text(`${PLANTS.length} 种奇植 · 五座花园 · 一颗终点的星`, `${PLANTS.length} plants · Five gardens · One final star`)}</span><span>{text('自动存档', 'Autosave enabled')}</span></footer>
      </div>
    </Modal>}
    {panel === 'squirrel' && <Modal title={text('松鼠播种选种','Squirrel seed choice')} className="squirrel-seed-modal" close={()=>setPanel(null)}>
      <h2>{text('松鼠播种选种','Squirrel seed choice')}</h2><p className="modal-intro">{gardenName(s.activeGarden)} · {text('仅设置本园松鼠，手动选种保持不变。','Only changes squirrels in this garden; your manual seed stays selected.')}</p>
      <p className="squirrel-sow-status">{!team.autoSow?text('自动播种已关闭，可在商店开启。','Auto-sow is off. Enable it in the shop.'):text('金币或收益条件不足时松鼠会等待，满足后继续播种。','Squirrels wait until coin and yield requirements are met.')}</p>
      <div className="squirrel-seed-options">{TIERS.slice(0,ULTIMATE_TIER).map((_,tier)=>{
        if(!seedVisible(s,tier as Tier))return null
        const cost=PLANTS[seedPlantId(tier as Tier)].cost, lock=seedLock(s,tier as Tier)
        return <button key={tier} className={`blue-button squirrel-seed-option tier-${tier}`} aria-pressed={team.sowTier===tier} onClick={()=>{dispatch({type:'sow-tier',tier});sound('tap');setPanel(null)}}>
          <span className="seed-bag"><Sprite id={13}/></span><span><strong>{tierName(tier)}</strong><small>{cost===0?text('免费','Free'):text(`${number(cost)} 金币 / 颗`,`${number(cost)} coins each`)}</small>{lock?<small>{lockText(lock)} · {text('选后等待','will wait')}</small>:s.coins<cost&&<small>{text('金币不足 · 选后等待','Not enough coins · will wait')}</small>}</span><b>{team.sowTier===tier?'✓':''}</b>
        </button>
      })}</div>
    </Modal>}
    {panel === 'settings' && <Modal title={text('设置', 'Settings')} className="settings-modal" close={() => setPanel(null)}>
      <div className="settings-shell">
        <aside className="settings-sidebar">
          <span className="settings-kicker">{text('偏好设置', 'PREFERENCES')}</span>
          <nav aria-label={text('设置分类', 'Settings categories')}>
            {([
              ['audio', text('音效', 'Audio'), text('音乐与反馈音', 'Music and feedback')],
              ['game', text('游戏', 'Gameplay'), text('动画与花园显示', 'Motion and garden display')],
              ['language', text('语言', 'Language'), text('简体中文 / English', '简体中文 / English')],
            ] as [SettingsSection, string, string][]).map(([id, label, note], index) => <button key={id} className={settingsSection === id ? 'active' : ''} aria-current={settingsSection === id ? 'page' : undefined} onClick={() => setSettingsSection(id)}><span>0{index + 1}</span><strong>{label}</strong><small>{note}</small></button>)}
          </nav>
        </aside>
        <section className="settings-content">
          {settingsSection === 'audio' && <>
            <div className="settings-heading"><span>01</span><div><h2>{text('音效', 'Audio')}</h2><p>{text('调整花园的音乐与操作反馈。', 'Tune the music and interaction sounds of the garden.')}</p></div></div>
            <div className="music-card"><span className={`music-notes ${settings.music ? 'playing' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span><div><strong>{text('月光下，慢慢生长', 'Growing Slowly by Moonlight')}</strong><small>{text('原创花园摇篮曲 · 72 BPM · 循环播放', 'Original garden lullaby · 72 BPM · Looped')}</small></div></div>
            <label className="setting-row"><span>{text('背景音乐', 'Background music')}<small>{text('播放花园主题曲', 'Play the garden theme')}</small></span><input type="checkbox" checked={settings.music} onChange={e => { unlockAudio(); setSettings({ ...settings, music: e.target.checked }) }} /></label>
            <label className="setting-row setting-range"><span>{text('音乐音量', 'Music volume')}<b>{Math.round(settings.musicVolume * 100)}%</b></span><input aria-label={text('音乐音量', 'Music volume')} type="range" min="0" max="1" step=".05" value={settings.musicVolume} onChange={e => { unlockAudio(); setSettings({ ...settings, musicVolume: Number(e.target.value) }) }} /></label>
            <label className="setting-row"><span>{text('游戏音效', 'Sound effects')}<small>{text('收获、购买与操作反馈', 'Harvest, purchase, and action feedback')}</small></span><input type="checkbox" checked={settings.sound} onChange={e => { unlockAudio(); setSettings({ ...settings, sound: e.target.checked }) }} /></label>
            <label className="setting-row setting-range"><span>{text('音效音量', 'Effects volume')}<b>{Math.round(settings.volume * 100)}%</b></span><input aria-label={text('音效音量', 'Effects volume')} type="range" min="0" max="1" step=".05" value={settings.volume} onChange={e => setSettings({ ...settings, volume: Number(e.target.value) })} /></label>
            <button className="settings-preview-button blue-button" onClick={() => { unlockAudio(); sound('coin') }}>{text('试听收获音效', 'Preview harvest sound')} <span>♪</span></button>
          </>}
          {settingsSection === 'game' && <>
            <div className="settings-heading"><span>02</span><div><h2>{text('游戏', 'Gameplay')}</h2><p>{text('调整动画、装饰和存档操作。', 'Adjust motion, decorations, and save actions.')}</p></div></div>
            <label className="setting-row"><span>{text('植物与助手动画', 'Plant and helper motion')}<small>{text('关闭后保留必要的状态变化', 'Keeps essential state changes visible when off')}</small></span><input type="checkbox" checked={settings.motion} onChange={e => setSettings({ ...settings, motion: e.target.checked })} /></label>
            {team.decorations.length>0&&<div className="decoration-settings"><h3>{gardenName(s.activeGarden)} · {text('装饰展示', 'Decorations')}</h3>{team.decorations.map(id=><label className="setting-row" key={id}><span>{decorationName(id)}</span><input type="checkbox" checked={!team.hiddenDecorations.includes(id)} onChange={()=>dispatch({type:'decoration-toggle',id})}/></label>)}</div>}
            <div className="settings-save-note"><strong>{text('自动保存已开启', 'Autosave is on')}</strong><p>{text('每 3 秒保存一次，最多结算 30 分钟离线成长。菜单和设置会暂停当前游戏。', 'Saved every 3 seconds with up to 30 minutes of offline growth. Menus pause the current game.')}</p></div>
            <button className="settings-danger-button" onClick={() => setPanel('reset')}>{text('重置花园并重新开始', 'Reset garden and start over')} <span>→</span></button>
          </>}
          {settingsSection === 'language' && <>
            <div className="settings-heading"><span>03</span><div><h2>{text('语言', 'Language')}</h2><p>{text('选择菜单与游戏界面的显示语言。', 'Choose the language used by menus and the game interface.')}</p></div></div>
            <div className="language-options" role="radiogroup" aria-label={text('界面语言', 'Interface language')}>
              <button role="radio" aria-checked={settings.language === 'zh'} className={settings.language === 'zh' ? 'selected' : ''} onClick={() => setSettings({ ...settings, language: 'zh' })}><span>简</span><strong>简体中文</strong><small>Chinese (Simplified)</small><b>{settings.language === 'zh' ? '✓' : '→'}</b></button>
              <button role="radio" aria-checked={settings.language === 'en'} className={settings.language === 'en' ? 'selected' : ''} onClick={() => setSettings({ ...settings, language: 'en' })}><span>EN</span><strong>English</strong><small>英语 / English</small><b>{settings.language === 'en' ? '✓' : '→'}</b></button>
            </div>
          </>}
        </section>
      </div>
      <div className="settings-footer"><small>{text('更改会立即保存', 'Changes save immediately')}</small><div><button className="primary-button" onClick={() => setPanel(null)}>{screen === 'game' ? text('返回花园', 'Back to garden') : text('返回主菜单', 'Back to main menu')}</button>{screen === 'game' && <button className="blue-button" onClick={() => { setPanel(null); setScreen('menu') }}>{text('主菜单', 'Main menu')}</button>}</div></div>
    </Modal>}
    {panel === 'help' && <Modal title={text('玩法指南','How to play')} close={() => setPanel(null)}>{english ? <><h2>Gardener’s handbook</h2><ol className="help-list"><li><b>Choose and sow</b><p>Start with free Common Seeds. New seed tiers appear as your lifetime earnings grow. Each regular tier can reveal plants from across the collection, while the Ultimate Seed always grows the Starflower.</p></li><li><b>Water and harvest</b><p>A seed and a tool can stay selected together: empty pots sow, occupied pots use the chosen tool. Refill at the lower-left pool. Mature plants are clearly marked and can be harvested for coins; individual results may be a gain or a loss, but every unlocked regular seed keeps a positive expected return.</p></li><li><b>Expand and hire</b><p>Buy studies, hire up to five snails, beetles, and squirrels per garden, and improve their equipment. Each garden starts with four pots and expands to fifteen. Complete its studies, then use the right arrow to open the next garden.</p></li><li><b>Grow a star</b><p>The Ultimate Seed costs {number(PLANTS[ULTIMATE_ID].cost)} coins. Grow its Starflower to finish the journey, then continue in free play.</p></li></ol><p className="settings-note">Weather visits every 5–10 minutes for 15 seconds. Soft Rain doubles natural growth, Firefly Night multiplies harvest value by seven, and Rainbows give the player infinite water. Menus pause the garden; autosave and offline growth are enabled.</p><button className="primary-button" onClick={() => setPanel(null)}>Got it</button></> : <><h2>园丁的小手册</h2><ol className="help-list"><li><b>选种、播种</b><p>八档种子依次为普通、稀有、珍贵、超凡、神话、远古、星界、终极。前七档各有四种植物，普通种子免费；各档均能抽到全部二十八种非终极植物，终极种子固定种出星之花。播种后立即显示品种名称、对应幼芽和成长进度，并直接开始生长；挖除不退种子费用。</p></li><li><b>浇水、收获</b><p>植物会自然生长。不同品种会长出不同幼芽。种子与工具可以同时保持选中：点击空盆会播种当前种子，点击已有植物才会使用水壶、铲子或肥料。浇水会播放 1.2 秒动画，期间该株无法重复浇水，但可以同时浇其他植物；需要补水时，点击花园左下角的水池。手机默认点击植物查看下方资料，再点“收获”按钮采收；PC 默认点击成熟植物直接收获。铲子可挖除任何阶段的植物，且不获得金币或收获次数。再次点击已选工具可取消选择。选择小推车后先点植物，可用花园左右箭头切换花园，再点空盆搬运或另一株植物交换位置；成长进度和外观变体会保留。只有手动收获有 5% 概率获得肥料，甲虫自动收获不掉落肥料。肥料可让未成熟的非终极植物立即成熟。植物没有额外特殊效果；进度满后再次点击收获金币。</p></li><li><b>扩建、雇用助手</b><p>商店分为升级、雇佣、装饰，只列出尚未购买的选项。全园共用丰收、沃土和灌注三条研究路线。每座新花园解锁后续研究，丰收研究使用连续整数等级；未解锁的下一等级灰显并标明条件，切园不改变研究列表，效果对全园生效。每次招募或装备升级后有45秒磨合期，后续项目还需完成本园收获目标。每座花园独立雇佣蜗牛、甲虫和松鼠，每种最多五只；木制装备可依次强化为铜制、铁制、金质、钻石制，仅影响本园同种动物。新园不会自动获得动物或装饰。雇佣松鼠后，可在花园顶部为本园指定播种种子；金币或收益条件不足时松鼠等待，满足后自动继续，不会改种其他种子。甲虫运回金币，蜗牛回池补水。每园从4个花盆开始，点击花园内标价的＋号直接购买，每次增加1盆，最多15盆。最新花园扩至15盆并完成该园解锁的全部研究后，点击花园右侧带“＋”的箭头付费开辟下一园。</p></li><li><b>种出第一颗星星</b><p>普通到星界种子同时检查金币与常态收益条件，天气不会临时解锁种子；单株收获可能亏损，允许播种的常规种子在当前花园的常态期望净收益始终为正，变种与天气收益另算。终极种子价格 {number(PLANTS[ULTIMATE_ID].cost)} 金币，不要求研究数量或花园数量。星之花基础成长需450分钟，在第五园完成成长研究后自然成熟约5.6分钟，配合浇水约5分钟；每5秒可吸收一次浇水，与其他植物一样接受手动浇水、蜗牛浇水、土壤加成。成熟即通关，之后可以继续种植。</p></li></ol><p className="settings-note">装饰仅改变本园外观，高级花园价格更高；购买后可在设置中隐藏。每隔 5–10 分钟出现一次细雨、萤火虫之夜或彩虹，持续 15 秒：细雨使全园植物自然成长速度翻倍；萤火虫之夜使手动和自动收获收益 ×7，按采摘时刻结算；彩虹期间玩家水壶不耗水，空壶也能使用，结束后恢复原有水量。星之花不会被自动收获或自动播种。可关闭自动收获，保留喜欢的植物观赏。所有浇水只作用于单株植物。水壶空了请点击左下角水池打水。观赏模式保留音乐和自动照料，隐藏数值提示与通关弹窗。</p><button className="primary-button" onClick={() => setPanel(null)}>知道了</button></>}</Modal>}
    {panel === 'book' && <Modal title={text('植物图鉴','Plant collection')} className="book-modal" close={() => setPanel(null)}><h2>{text('奇植图鉴','Curious Plant Collection')} <small>{harvestedKinds} / {PLANTS.length}</small></h2><p className="modal-intro">{text('实际收获点亮品种；外观变体只要培育成熟即永久记录。七个常规品阶中，每档最稀有品种拥有一个专属变种。','Harvest a species to reveal it. Mature a variant to record it forever. The rarest plant in each regular tier has one special variant.')}</p>{s.untrackedHarvests > 0 && <p className="settings-note">{text(`旧存档的 ${number(s.untrackedHarvests)} 次收获未记录品种；各品种次数从本次更新后开始累计.`,`${number(s.untrackedHarvests)} harvests from an older save have no species record; counts begin with this version.`)}</p>}<div className="book-grid">{TIER_PLANTS.flat().map(id => PLANTS[id]).map(p => {
      const count = s.harvestCounts[p.id], known = count > 0
      return <article key={p.id} data-testid={`book-plant-${p.id}`} className={known ? 'discovered' : 'undiscovered'}><div className="book-plant-art"><PlantSprite id={p.id} />{variantFor(p.id)&&<div className="variant-collection">{(()=>{const collected=s.variants.includes(`${p.id}:1`);return <span className={collected?'variant-known':'variant-unknown'} title={collected?variantName(p.id):text('未知变种','Unknown variant')}><span className={collected?'':'variant-silhouette'}><PlantSprite id={p.id} variant/></span><small>{collected?variantName(p.id):text('未知变种','Unknown variant')}</small></span>})()}</div>}</div><div className="book-copy"><h3>{known ? plantName(p.id) : text('未知植物','Unknown plant')}<small>{english?tierName(p.tier).replace(' Seed',''):TIERS[p.tier].replace('种子', '')} · {known ? text('已收获','Harvested') : text('未收获','Not harvested')}</small></h3><p className="harvest-count">{text('累计收获','Harvested')} <b>{number(count)}</b> {text('次','times')}</p>{known ? <><p>{text('基础成长','Base growth')} {formatTime(p.seconds)} · {text('基础产值','Base value')} {number(p.reward)} {text('金币','coins')}{p.id === ULTIMATE_ID ? text(' · 成熟即通关',' · Blooms to complete the journey') : ''}</p><span>{english?'A curious plant from the moonlit garden.':p.lore}</span></> : <span>{text('收获后解锁名字与详细资料','Harvest it to reveal its name and details')}</span>}</div></article>
    })}</div></Modal>}
    {panel === 'reset' && <Modal title={text('开始新的花园','Start a new garden')} close={() => setPanel(null)}><h2>{text('重新种下第一颗种子？','Plant the first seed again?')}</h2><p className="modal-intro">{text('这会替换本机的花园存档，金币、植物和升级会重新开始。音效设置会保留。','This replaces the local save. Coins, plants, and studies restart; your settings stay.')}</p><div className="modal-actions"><button className="blue-button" onClick={() => setPanel(null)}>{text('保留我的花园','Keep my garden')}</button><button className="primary-button" onClick={reset}>{text('开始新的花园','Start new garden')}</button></div></Modal>}
    {won && !panel && <Modal title={text('星之花绽放，通关成功','The Starflower blooms')} className="victory-modal"><div className="victory-stars" aria-hidden="true"><PixelBurst kind="star" /><PixelBurst kind="coin" /></div><span className="menu-eyebrow">{text('一颗星星，为你而开','A STAR BLOOMS FOR YOU')}</span><Sprite id={9} /><h2>{text('星之花，绽放了。','The Starflower has bloomed.')}</h2><p>{text('从第一颗小小的种子，到一整个星光花园。','From one tiny seed to a garden full of starlight.')}<br />{text('谢谢你的每一次照料。','Thank you for every moment of care.')}</p><div className="victory-stats"><div><small>{text('通关用时','Journey time')}</small><strong data-testid="win-time">{formatTime(s.wonAt ?? 0)}</strong></div><div><small>{text('收获植物','Harvests')}</small><strong>{s.harvests}</strong></div><div><small>{text('收获品种','Species')}</small><strong>{harvestedKinds}/{PLANTS.length}</strong></div></div><button className="primary-button" onClick={() => setVictoryDismissed(true)}>{text('继续照料花园','Keep tending the garden')}</button><small className="menu-footnote">{text('旅程完成了，花园的故事还在继续。','The journey is complete. The garden keeps growing.')}</small></Modal>}
  </div>
}
