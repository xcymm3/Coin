import * as T from 'three';
import { GameAudio } from './audio';
import {
  advance, beginGame, beginTutorial, canAct, CANNON_STAGES, CREATURES, CREATURE_KINDS, creatureInRoom,
  fireInterval, initialState, inspectJournal, makeTestState, moveForward, room, ROOMS, shoot, turn,
  upgradeCost, upgradeName,
} from './rules';
import type { Direction, GameState, RoomId, TargetId, Upgrade } from './rules';

const SCALE = 10;
const COLORS = { stone: 0x252936, stone2: 0x343949, dark: 0x070912, silver: 0xcdd9f4, moon: 0xa9c8ff, blood: 0x5f1523, warm: 0xd5ad6d, safe: 0x78b3a3 };
const facingYaw: Record<Direction, number> = { north: 0, east: -Math.PI / 2, south: Math.PI, west: Math.PI / 2 };
const upgradeRooms: Record<Upgrade, RoomId> = { volley: 'naveWest', power: 'cloister', rate: 'choir' };

export interface SceneView { ready: boolean; hovered: TargetId | null; targetPoint?: { x: number; y: number }; contextLost: boolean }
interface TargetModel { root: T.Group; hit: T.Object3D; label?: T.Sprite }

export class Scene {
  state = initialState();
  audio = new GameAudio();
  private renderer: T.WebGLRenderer;
  private world = new T.Scene();
  private camera = new T.PerspectiveCamera(56, 1, 0.08, 80);
  private ray = new T.Raycaster();
  private pointer = new T.Vector2(0, 0);
  private targetModels = new Map<TargetId, TargetModel>();
  private doors: { mesh: T.Mesh; destination: RoomId }[] = [];
  private cannonParts: T.Object3D[] = [];
  private moon!: T.Mesh;
  private muzzle!: T.PointLight;
  private observer: ResizeObserver;
  private frame = 0;
  private last = 0;
  private held = false;
  private cooldown = 0;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private visualPosition = new T.Vector3();
  private visualYaw = 0;
  private desiredYaw = 0;
  private aimYaw = 0;
  private aimPitch = 0;
  private lost = false;
  private materials: T.Material[] = [];
  private geometries: T.BufferGeometry[] = [];
  private textures: T.Texture[] = [];

  constructor(private canvas: HTMLCanvasElement, private onChange: (state: GameState) => void, private onView: (view: SceneView) => void, private onError: (message: string) => void) {
    this.renderer = new T.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1));
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.world.background = new T.Color(COLORS.dark);
    this.world.fog = new T.FogExp2(COLORS.dark, 0.032);
    this.world.add(this.camera, new T.HemisphereLight(0x8292bb, 0x080910, 0.48));
    const moonLight = new T.DirectionalLight(0x9ab7ed, 1.4); moonLight.position.set(-8, 14, 10); this.world.add(moonLight);
    this.muzzle = new T.PointLight(COLORS.silver, 0, 7, 2); this.camera.add(this.muzzle); this.muzzle.position.set(0, -0.25, -0.6);
    this.buildCathedral();
    const start = room('refuge'); this.visualPosition.set(start.x * SCALE, 1.65, start.z * SCALE); this.camera.position.copy(this.visualPosition);
    this.observer = new ResizeObserver(this.resize); this.observer.observe(canvas);
    canvas.addEventListener('pointermove', this.pointerMove); canvas.addEventListener('pointerdown', this.pointerDown); canvas.addEventListener('pointerleave', this.pointerLeave);
    canvas.addEventListener('webglcontextlost', this.contextLost); window.addEventListener('pointerup', this.release); window.addEventListener('pointercancel', this.release);
    window.addEventListener('blur', this.blur); document.addEventListener('visibilitychange', this.visibility);
    this.resize(); this.syncVisuals(); this.frame = requestAnimationFrame(this.loop);
    queueMicrotask(() => this.onView(this.view()));
  }

  private mat(color: number, emissive = 0, transparent = false) { const m = new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: emissive, roughness: 0.83, metalness: color === COLORS.silver ? 0.65 : 0.08, flatShading: true, transparent, opacity: transparent ? 0.86 : 1 }); this.materials.push(m); return m }
  private geo<G extends T.BufferGeometry>(g: G) { this.geometries.push(g); return g }
  private mesh(parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material, x: number, y: number, z: number) { const m = new T.Mesh(geometry, material); m.position.set(x, y, z); parent.add(m); return m }
  private box(parent: T.Object3D, size: [number, number, number], pos: [number, number, number], color = COLORS.stone) { return this.mesh(parent, this.geo(new T.BoxGeometry(...size)), this.mat(color), ...pos) }
  private arch(parent: T.Object3D, x: number, z: number, rotation = 0) { const shape = new T.Shape(); shape.moveTo(-2.2, 0); shape.lineTo(-2.2, 2.6); shape.quadraticCurveTo(0, 5.5, 2.2, 2.6); shape.lineTo(2.2, 0); const hole = new T.Path(); hole.moveTo(-1.55, 0); hole.lineTo(-1.55, 2.4); hole.quadraticCurveTo(0, 4.5, 1.55, 2.4); hole.lineTo(1.55, 0); shape.holes.push(hole); const mesh = this.mesh(parent, this.geo(new T.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: false })), this.mat(COLORS.stone2), x, 0, z); mesh.rotation.y = rotation; return mesh }
  private label(text: string, width = 512) { const c = document.createElement('canvas'); c.width = width; c.height = 128; const x = c.getContext('2d')!; x.fillStyle = 'rgba(5,7,14,.82)'; x.fillRect(0, 0, c.width, c.height); x.strokeStyle = '#8aa8d6'; x.strokeRect(3, 3, c.width - 6, c.height - 6); x.fillStyle = '#eef3ff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '28px "Microsoft YaHei", sans-serif'; x.fillText(text, c.width / 2, c.height / 2); const texture = new T.CanvasTexture(c); texture.colorSpace = T.SRGBColorSpace; this.textures.push(texture); const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture, transparent: true, depthTest: false })); sprite.scale.set(4.8, 1.2, 1); return sprite }
  private setLabel(sprite: T.Sprite | undefined, text: string) { const texture = (sprite?.material as T.SpriteMaterial | undefined)?.map; if (!texture) return; const c = texture.image as HTMLCanvasElement | undefined; if (!c) return; const x = c.getContext('2d')!; x.clearRect(0, 0, c.width, c.height); x.fillStyle = 'rgba(5,7,14,.82)'; x.fillRect(0, 0, c.width, c.height); x.strokeStyle = '#8aa8d6'; x.strokeRect(3, 3, c.width - 6, c.height - 6); x.fillStyle = '#eef3ff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '28px "Microsoft YaHei", sans-serif'; x.fillText(text, c.width / 2, c.height / 2); texture.needsUpdate = true }
  private registerTarget(id: TargetId, root: T.Group, hit: T.Object3D, label?: T.Sprite) { root.traverse(o => { o.userData.target = id }); this.targetModels.set(id, { root, hit, label }) }

  private buildCathedral() {
    for (const r of ROOMS) {
      const g = new T.Group(); g.position.set(r.x * SCALE, 0, r.z * SCALE); g.name = `room-${r.id}`; this.world.add(g);
      const tint = r.area === '侧堂' ? 0x292736 : r.area === '终祷区' ? 0x202b40 : r.area === '地下侧室' ? 0x241f29 : COLORS.stone;
      this.box(g, [8.8, 0.35, 8.8], [0, -0.2, 0], tint);
      for (const x of [-3.6, 3.6]) { this.box(g, [0.7, 5.8, 0.7], [x, 2.7, -3.55], COLORS.stone2); this.box(g, [0.7, 5.8, 0.7], [x, 2.7, 3.55], COLORS.stone2) }
      const exits = r.exits as Partial<Record<Direction, RoomId>>;
      for (const direction of ['north', 'east', 'south', 'west'] as Direction[]) {
        const destination = exits[direction]; const northSouth = direction === 'north' || direction === 'south'; const sign = direction === 'north' || direction === 'west' ? -1 : 1;
        if (destination) {
          this.arch(g, northSouth ? 0 : sign * 4.25, northSouth ? sign * 4.25 : 0, northSouth ? 0 : Math.PI / 2);
          const curtain = this.box(g, northSouth ? [3.05, 4.1, 0.14] : [0.14, 4.1, 3.05], northSouth ? [0, 2.05, sign * 4.13] : [sign * 4.13, 2.05, 0], COLORS.dark); (curtain.material as T.MeshStandardMaterial).transparent = true; this.doors.push({ mesh: curtain, destination });
        } else this.box(g, northSouth ? [8.8, 5.8, 0.5] : [0.5, 5.8, 8.8], northSouth ? [0, 2.7, sign * 4.35] : [sign * 4.35, 2.7, 0], tint);
      }
      const rib = this.geo(new T.TorusGeometry(4.25, 0.12, 5, 20, Math.PI));
      for (const rot of [0, Math.PI / 2]) { const vault = this.mesh(g, rib, this.mat(COLORS.stone2), 0, 5.2, 0); vault.rotation.set(Math.PI / 2, rot, 0) }
      if ('sanctuary' in r && r.sanctuary) { const lamp = new T.PointLight(COLORS.warm, 0, 9, 2); lamp.position.set(0, 3, 0); g.add(lamp); lamp.userData.sanctuary = r.id; const altar = this.box(g, [2.3, 1, 1.1], [0, 0.45, 1.9], COLORS.stone2); altar.userData.safeAltar = r.id }
      if (r.id === 'southAisle') { for (let i = 0; i < 7; i++) { const stain = this.mesh(g, this.geo(new T.CircleGeometry(.18 + i * .025, 7)), this.mat(COLORS.blood, .08), -2.4 + i * .65, 0.01, .4 + Math.sin(i) * .7); stain.rotation.x = -Math.PI / 2 } }
      if (r.id === 'northAisle') for (let i = 0; i < 5; i++) { const candle = this.mesh(g, this.geo(new T.ConeGeometry(.12, .5, 5)), this.mat(COLORS.moon, 1.4), -2 + i, 4.6, 0); candle.rotation.z = Math.PI }
      if (r.id === 'ossuary') for (let i = 0; i < 18; i++) this.mesh(g, this.geo(new T.DodecahedronGeometry(.22, 0)), this.mat(0x857f82), -3 + (i % 6) * 1.1, .15 + Math.floor(i / 6) * .35, 2.8);
    }
    this.buildCreatures(); this.buildMachines(); this.buildMoonBattery();
  }
  private buildCreatures() {
    for (const c of CREATURES) {
      const r = room(c.room), root = new T.Group(); root.position.set(r.x * SCALE, 0, r.z * SCALE - 1.5); this.world.add(root); const hostile = this.mat(COLORS.blood, .18), pure = this.mat(COLORS.safe, .5); let hit: T.Mesh;
      if (c.kind === 'hollow') { hit = this.mesh(root, this.geo(new T.CapsuleGeometry(.65, 1.7, 4, 7)), hostile, 0, 1.3, 0); const head = this.mesh(root, this.geo(new T.IcosahedronGeometry(.46, 0)), hostile, 0, 2.65, 0); head.scale.y = 1.35 }
      else if (c.kind === 'penitent') { hit = this.mesh(root, this.geo(new T.BoxGeometry(1.8, .8, 2.4)), hostile, 0, .55, 0); for (const side of [-1, 1]) { const limb = this.box(root, [.24, .25, 1.8], [side * .9, .2, .35], COLORS.blood); limb.rotation.y = side * .38 } }
      else { hit = this.mesh(root, this.geo(new T.ConeGeometry(1.05, 2.9, 7)), hostile, 0, 1.45, 0); for (let i = 0; i < 3; i++) { const ring = this.mesh(root, this.geo(new T.TorusGeometry(.72 + i * .2, .055, 5, 18)), hostile, 0, 2.2 + i * .28, 0); ring.rotation.x = Math.PI / 2 } }
      hit.userData.hostileMaterial = hostile; hit.userData.pureMaterial = pure; const label = this.label(CREATURE_KINDS[c.kind].name); label.position.set(0, 3.8, 0); root.add(label); this.registerTarget(`creature:${c.id}`, root, hit, label);
    }
  }
  private buildMachines() {
    const machines: { id: 'tutorial' | Upgrade; room: RoomId; x: number }[] = [{ id: 'tutorial', room: 'refuge', x: 0 }, { id: 'volley', room: 'naveWest', x: -1.8 }, { id: 'power', room: 'cloister', x: 1.8 }, { id: 'rate', room: 'choir', x: 0 }];
    for (const machine of machines) { const r = room(machine.room), root = new T.Group(); root.position.set(r.x * SCALE + machine.x, 0, r.z * SCALE - 1.6); this.world.add(root); const base = this.mesh(root, this.geo(new T.CylinderGeometry(.85, 1.1, 1.25, 8)), this.mat(COLORS.stone2), 0, .62, 0); const core = this.mesh(root, this.geo(new T.OctahedronGeometry(.58)), this.mat(COLORS.silver, .85), 0, 1.75, 0); const label = this.label(machine.id === 'tutorial' ? '庇护机 · 充能 0 / 3' : `${upgradeName(machine.id)} · Lv.0`); label.position.set(0, 3, 0); root.add(label); root.add(base); this.registerTarget(`machine:${machine.id}`, root, core, label) }
  }
  private buildMoonBattery() {
    const r = room('moonBattery'), root = new T.Group(); root.position.set(r.x * SCALE, 0, r.z * SCALE - 3.4); this.world.add(root);
    const batteryLight = new T.PointLight(COLORS.moon, 9, 11, 2); batteryLight.position.set(0, 4.2, 1.5); root.add(batteryLight);
    this.box(root, [3.4, 2.8, 1.2], [0, 1.4, 0], COLORS.stone2);
    const assemblyCore = this.mesh(root, this.geo(new T.OctahedronGeometry(.62)), this.mat(COLORS.silver, 1.1), 0, 2.1, .72);
    const part1 = this.mesh(root, this.geo(new T.CylinderGeometry(.55, .75, 4.8, 10)), this.mat(COLORS.silver), 0, 2.1, -1); part1.rotation.x = Math.PI / 2;
    const part2 = this.mesh(root, this.geo(new T.TorusGeometry(.85, .14, 7, 22)), this.mat(0x7da9c4, .35), 0, 2.1, .2); part2.rotation.x = Math.PI / 2;
    const part3 = new T.Group(); for (let i = 0; i < 4; i++) { const bar = this.box(part3, [1.8, .12, .12], [0, 2.1, -2.4], COLORS.silver); bar.rotation.z = i * Math.PI / 2 } root.add(part3);
    const part4 = this.mesh(root, this.geo(new T.IcosahedronGeometry(.52, 1)), this.mat(COLORS.moon, 1.8), 0, 2.1, -2.45);
    this.cannonParts = [part1, part2, part3, part4]; const label = this.label('月亮炮 · 射击组装炮身'); label.position.set(0, 3.15, 0); label.scale.set(3, .75, 1); root.add(label); this.registerTarget('machine:cannon', root, assemblyCore, label);
    const moon = this.mesh(this.world, this.geo(new T.IcosahedronGeometry(4.4, 4)), this.mat(COLORS.moon, 1.2), r.x * SCALE, 10, r.z * SCALE - 34); this.moon = moon; moon.userData.target = 'moon';
  }

  private resize = () => { const b = this.canvas.getBoundingClientRect(); if (!b.width || !b.height) return; this.camera.aspect = b.width / b.height; this.camera.updateProjectionMatrix(); this.renderer.setSize(Math.max(1, Math.floor(b.width * .72)), Math.max(1, Math.floor(b.height * .72)), false); this.canvas.style.width = `${b.width}px`; this.canvas.style.height = `${b.height}px` };
  private pointerMove = (event: PointerEvent) => { const b = this.canvas.getBoundingClientRect(); this.pointer.set((event.clientX - b.left) / b.width * 2 - 1, -(event.clientY - b.top) / b.height * 2 + 1); this.aimYaw = -this.pointer.x * .19; this.aimPitch = this.pointer.y * .11; this.onView(this.view()) };
  private pointerDown = (event: PointerEvent) => { if (event.button !== 0) return; event.preventDefault(); this.audio.unlock(); this.canvas.focus({ preventScroll: true }); this.pointerMove(event); this.held = true; this.firePointer() };
  private pointerLeave = () => { this.pointer.set(0, 0); this.aimYaw = 0; this.aimPitch = 0; this.release() };
  private release = () => { this.held = false };
  private blur = () => { this.release(); if (canAct(this.state)) this.pause() };
  private visibility = () => { if (document.hidden) this.blur() };
  private contextLost = (event: Event) => { event.preventDefault(); this.lost = true; this.pause(); this.onError('WebGL 视野已丢失；生产与危险均已冻结。重新载入后可选择继续。'); this.onView(this.view()) };
  private targetAtPointer() {
    this.ray.setFromCamera(this.pointer, this.camera);
    const roots: T.Object3D[] = [...this.targetModels.entries()].filter(([id, model]) => model.root.visible && (id !== 'machine:cannon' || this.state.cannonStage < 4)).map(([, model]) => model.root);
    if (this.moon.visible) roots.push(this.moon);
    const hits = this.ray.intersectObjects(roots, true);
    for (const hit of hits) { let o: T.Object3D | null = hit.object; while (o) { if (o.userData.target) return o.userData.target as TargetId; o = o.parent } }
    return null;
  }
  private firePointer() { this.fire(this.targetAtPointer()) }
  private fire(target: TargetId | null) {
    if (!canAct(this.state) || this.cooldown > 0) return;
    const before = this.state;
    this.cooldown = fireInterval(this.state);
    this.state = shoot(this.state, target);
    this.audio.fire();
    if (target) this.audio.hit(target);
    if (this.state.producers.length > before.producers.length) this.audio.purify();
    if (this.state.cannonStage > before.cannonStage) this.audio.machine();
    this.muzzle.intensity = 8;
    this.publish();
    this.syncVisuals();
  }

  startTutorial = () => { this.audio.unlock(); this.audio.whisper(-1); this.state = beginTutorial(initialState()); this.publish(); this.syncVisuals() };
  start = () => { this.audio.unlock(); this.state = beginGame(this.state.status === 'ready' ? { ...initialState(), tutorialStep: 3, journalRead: true } : this.state); this.last = 0; this.publish(); this.syncVisuals() };
  restore = (state: GameState) => { this.state = { ...state, status: 'playing' }; this.last = 0; this.publish(); this.syncVisuals(true) };
  restart = () => { this.state = initialState(); this.startTutorial() };
  pause = () => { if (canAct(this.state)) this.state = { ...this.state, status: 'paused' }; this.publish() };
  resume = () => { if (this.state.status === 'paused') this.state = { ...this.state, status: this.state.tutorialStep < 3 ? 'tutorial' : 'playing' }; this.last = 0; this.publish() };
  inspectUpgrades = () => { this.state = inspectJournal(this.state); this.publish() };
  move = () => { const before = this.state; this.state = moveForward(this.state); if (this.state.room !== before.room) { this.audio.step(); if (creatureInRoom(this.state)) this.audio.whisper(room(this.state.room).x < 0 ? -1 : 1) } this.publish(); this.syncVisuals() };
  turn = (side: 'left' | 'right') => { this.state = turn(this.state, side); this.audio.step(); this.publish(); this.syncVisuals() };
  fireCenter = () => { this.pointer.set(0, 0); this.firePointer() };
  beginCenterFire = () => { this.pointer.set(0, 0); this.held = true; this.firePointer() };
  endFire = () => { this.release() };
  shutdownAudio = () => this.audio.dispose();
  targetPoint = (target: TargetId) => {
    const object = target === 'moon' ? this.moon : this.targetModels.get(target)?.hit;
    if (!object?.visible || target !== 'moon' && !this.targetModels.get(target)?.root.visible) return null;
    this.camera.updateMatrixWorld(true); object.updateWorldMatrix(true, false);
    const point = object.getWorldPosition(new T.Vector3()).project(this.camera), bounds = this.canvas.getBoundingClientRect();
    return { x: bounds.left + (point.x + 1) * bounds.width / 2, y: bounds.top + (1 - point.y) * bounds.height / 2 };
  };
  setTestState = (stage: 'explore' | 'cannon') => { this.state = makeTestState(stage); this.publish(); this.syncVisuals(true) };

  private syncVisuals(snap = false) {
    const r = room(this.state.room), desired = new T.Vector3(r.x * SCALE, 1.65, r.z * SCALE); this.desiredYaw = facingYaw[this.state.facing];
    if (snap || this.reduced) { this.visualPosition.copy(desired); this.visualYaw = this.desiredYaw }
    for (const door of this.doors) { const visited = this.state.visited.includes(door.destination); (door.mesh.material as T.MeshStandardMaterial).opacity = visited ? .05 : .9; door.mesh.visible = !visited || door.destination === 'moonBattery' && !this.state.visited.includes('moonBattery') }
    this.world.traverse(o => { if (o instanceof T.PointLight && o.userData.sanctuary) o.intensity = this.state.sanctuaries.includes(o.userData.sanctuary) ? 12 : 0 });
    for (const c of CREATURES) { const model = this.targetModels.get(`creature:${c.id}`)!; const produced = this.state.producers.includes(c.id); const current = c.room === this.state.room; model.root.visible = current || produced && this.state.visited.includes(c.room); (model.hit as T.Mesh).material = produced ? (model.hit.userData.pureMaterial as T.Material) : (model.hit.userData.hostileMaterial as T.Material); const d = CREATURE_KINDS[c.kind]; this.setLabel(model.label, produced ? `${d.name} · 已净化 · ${d.rate}/秒` : `${d.name} · ${this.state.creatureDamage[c.id]} / ${d.threshold}`) }
    const tutorial = this.targetModels.get('machine:tutorial')!; tutorial.root.visible = this.state.room === 'refuge' && this.state.tutorialStep < 3; this.setLabel(tutorial.label, `庇护机 · 充能 ${this.state.tutorialCharge} / 3`);
    for (const kind of ['volley', 'power', 'rate'] as Upgrade[]) { const model = this.targetModels.get(`machine:${kind}`)!; model.root.visible = this.state.room === upgradeRooms[kind] && this.state.sanctuaries.includes(upgradeRooms[kind]); const total = upgradeCost(this.state, kind); this.setLabel(model.label, total ? `${upgradeName(kind)} · Lv.${this.state.upgrades[kind]} · 还差 ${total - this.state.machineCharge[kind]} / ${total}` : `${upgradeName(kind)} · MAX`) }
    const cannon = this.targetModels.get('machine:cannon')!; cannon.root.visible = this.state.room === 'moonBattery'; this.cannonParts.forEach((part, i) => part.visible = i < this.state.cannonStage); const next = CANNON_STAGES[this.state.cannonStage]; this.setLabel(cannon.label, next ? `月亮炮 · 射击组装${next.name}` : '月亮炮 · 瞄准月亮开火');
    this.moon.visible = this.state.room === 'moonBattery' && this.state.cannonStage >= 4; const moonMat = this.moon.material as T.MeshStandardMaterial; moonMat.color.setHex(this.state.moonStage ? 0xa63445 : COLORS.moon); moonMat.emissive.setHex(this.state.moonStage ? 0x64111f : COLORS.moon);
    if (snap) { this.camera.position.copy(desired); this.visualPosition.copy(desired) }
  }
  private publish() { this.onChange({ ...this.state }) }
  private view(): SceneView { let targetPoint: { x: number; y: number } | undefined; const id: TargetId = this.state.tutorialStep < 2 ? 'machine:tutorial' : `creature:${creatureInRoom(this.state)?.id}` as TargetId; const model = this.targetModels.get(id); if (model?.root.visible) { const p = model.hit.getWorldPosition(new T.Vector3()).project(this.camera); targetPoint = { x: (p.x + 1) * 50, y: (1 - p.y) * 50 } } return { ready: true, hovered: this.targetAtPointer(), targetPoint, contextLost: this.lost } }
  private loop = (now: number) => {
    const dt = this.last ? Math.min(.1, (now - this.last) / 1000) : 0; this.last = now; this.cooldown = Math.max(0, this.cooldown - dt); this.muzzle.intensity *= .65;
    if (!document.hidden && document.hasFocus() && !this.lost && this.state.status === 'playing') { const before = this.state; this.state = advance(this.state, dt); if (this.state !== before) this.publish() }
    if (this.held && this.cooldown <= 0) this.firePointer();
    const r = room(this.state.room), desired = new T.Vector3(r.x * SCALE, 1.65, r.z * SCALE); const blend = this.reduced ? 1 : 1 - Math.exp(-dt * 10); this.visualPosition.lerp(desired, blend); let delta = T.MathUtils.euclideanModulo(this.desiredYaw - this.visualYaw + Math.PI, Math.PI * 2) - Math.PI; this.visualYaw += delta * blend;
    this.camera.position.copy(this.visualPosition); this.camera.rotation.set(this.aimPitch, this.visualYaw + this.aimYaw, 0, 'YXZ');
    const current = creatureInRoom(this.state); const target = current && this.targetModels.get(`creature:${current.id}`); if (target && !this.reduced) target.root.rotation.y = Math.sin(now * .0017) * .12;
    this.renderer.render(this.world, this.camera); this.onView(this.view()); this.frame = requestAnimationFrame(this.loop);
  };
  destroy() { cancelAnimationFrame(this.frame); this.observer.disconnect(); this.canvas.removeEventListener('pointermove', this.pointerMove); this.canvas.removeEventListener('pointerdown', this.pointerDown); this.canvas.removeEventListener('pointerleave', this.pointerLeave); this.canvas.removeEventListener('webglcontextlost', this.contextLost); window.removeEventListener('pointerup', this.release); window.removeEventListener('pointercancel', this.release); window.removeEventListener('blur', this.blur); document.removeEventListener('visibilitychange', this.visibility); this.renderer.dispose(); void this.audio.dispose(); this.geometries.forEach(g => g.dispose()); this.materials.forEach(m => m.dispose()); this.textures.forEach(t => t.dispose()) }
}
