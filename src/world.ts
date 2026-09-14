import * as T from 'three';
import { GameAudio } from './audio';
import { advance, beginNight, beginTutorial, canShoot, cost, devices, hit, initialState, recommendation, registerShot, TARGETS, unlocked, volley, waveActive } from './rules';
import type { GameState, Target } from './rules';

const C = { stone: 0x39333c, dark: 0x161319, trim: 0x78644c, brass: 0xb69960, pale: 0xc5b9a1, copper: 0xe7a65e, red: 0xda5345, blood: 0x3a141d, violet: 0x9472bc, green: 0x8cbaa3 };
const positions: Record<Target, [number, number]> = { forge: [-4.25, -0.2], splitter: [-2.8, 0.45], choir: [-1.35, -0.25], ward: [0.1, 0.45], lens: [1.55, -0.25], seal: [3, 0.4], clock: [4.7, -0.1] };
interface Shot { mesh: T.Mesh; start: T.Vector3; end: T.Vector3; age: number; delay: number; duration: number; target: Target | null; visualOnly: boolean }
interface Model { group: T.Group; target: T.Mesh; aura: T.Mesh; animated: T.Object3D[]; flash: number; label: T.Sprite; revealed: boolean }
export interface SceneView { hovered: Target | null; points: Partial<Record<Target, { x: number; y: number }>>; ready: boolean }

export class Scene {
  state = initialState();
  audio = new GameAudio();
  private renderer: T.WebGLRenderer;
  private world = new T.Scene();
  private camera = new T.PerspectiveCamera(47, 1, 0.08, 70);
  private ray = new T.Raycaster();
  private mouse = new T.Vector2(0, 0);
  private pointerInside = false;
  private selected: Target = 'splitter';
  private models = {} as Record<Target, Model>;
  private gun = new T.Group();
  private muzzle = new T.Object3D();
  private muzzleFlash!: T.Mesh;
  private fingers: T.Mesh[] = [];
  private gunBarrels: T.Group[] = [];
  private shots: Shot[] = [];
  private coinGeo = new T.CylinderGeometry(0.07, 0.07, 0.02, 12);
  private coinMat = new T.MeshStandardMaterial({ color: C.copper, metalness: 0.7, roughness: 0.3, emissive: C.copper, emissiveIntensity: 0.2 });
  private sparks = new T.Group();
  private motes!: T.Points;
  private handsMat!: T.MeshStandardMaterial;
  private clockFace!: T.CanvasTexture;
  private clockCanvas = document.createElement('canvas');
  private clockValue = -1;
  private materials = new Map<string, T.MeshStandardMaterial>();
  private textures: T.Texture[] = [];
  private lights: T.PointLight[] = [];
  private shadow!: T.SpotLight;
  private observer: ResizeObserver;
  private frame = 0;
  private last = 0;
  private uiTick = 0;
  private animationTime = 0;
  private held = false;
  private fireCooldown = 0;
  private recoil = 0;
  private lastAlarm = -1;
  private currentHover: Target | null = null;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private lost = false;
  constructor(private canvas: HTMLCanvasElement, private onChange: (s: GameState) => void, private onView: (view: SceneView) => void, private onError: (message: string) => void) {
    this.renderer = new T.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.35));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
    this.world.background = new T.Color(0x100e15);
    this.world.fog = new T.FogExp2(0x15121c, 0.025);
    this.camera.position.set(0, 5, 12.6); this.camera.lookAt(0, 1.65, -0.6); this.world.add(this.camera);
    this.buildRoom(); this.buildTable();
    for (const t of TARGETS) this.buildMachine(t);
    this.buildGun(); this.world.add(this.sparks);
    this.observer = new ResizeObserver(this.resize); this.observer.observe(canvas);
    canvas.addEventListener('pointermove', this.pointerMove); canvas.addEventListener('pointerdown', this.pointerDown);
    canvas.addEventListener('pointerleave', this.pointerLeave); canvas.addEventListener('webglcontextlost', this.contextLost);
    window.addEventListener('pointerup', this.release); window.addEventListener('pointercancel', this.release); window.addEventListener('blur', this.blur);
    document.addEventListener('visibilitychange', this.visibility);
    this.resize(); this.frame = requestAnimationFrame(this.loop);
  }
  private material(color: number, metal = 0, glow = 0) {
    const key = `${color}/${metal}/${glow}`;
    if (!this.materials.has(key)) this.materials.set(key, new T.MeshStandardMaterial({ color, roughness: metal ? 0.48 : 0.9, metalness: metal, emissive: color, emissiveIntensity: glow, flatShading: true }));
    return this.materials.get(key)!;
  }
  private mesh(parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(geometry, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  private box(parent: T.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, color = C.stone, metal = 0) { return this.mesh(parent, new T.BoxGeometry(w, h, d), this.material(color, metal), x, y, z); }
  private cylinder(parent: T.Object3D, r: number, h: number, x: number, y: number, z: number, color = C.brass, top = r, segments = 10) { return this.mesh(parent, new T.CylinderGeometry(top, r, h, segments), this.material(color, 0.45), x, y, z); }
  private ring(parent: T.Object3D, r: number, tube: number, x: number, y: number, z: number, color = C.brass) { return this.mesh(parent, new T.TorusGeometry(r, tube, 5, 32), this.material(color, 0.55), x, y, z); }
  private beam(parent: T.Object3D, a: T.Vector3, b: T.Vector3, radius: number, color: number) {
    const direction = b.clone().sub(a), m = this.cylinder(parent, radius, direction.length(), 0, 0, 0, color, radius, 6);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize()); return m;
  }
  private arch(parent: T.Object3D, x: number, y: number, z: number, width: number, height: number, color = C.trim) {
    const points = [new T.Vector3(x - width / 2, y, z), new T.Vector3(x - width / 2, y + height * 0.57, z), new T.Vector3(x - width * 0.33, y + height * 0.8, z), new T.Vector3(x, y + height, z), new T.Vector3(x + width * 0.33, y + height * 0.8, z), new T.Vector3(x + width / 2, y + height * 0.57, z), new T.Vector3(x + width / 2, y, z)];
    return this.mesh(parent, new T.TubeGeometry(new T.CatmullRomCurve3(points), 28, width * 0.035, 5, false), this.material(color, 0.25));
  }
  private candle(parent: T.Object3D, x: number, y: number, z: number, tall = 0.4, light = false) {
    this.cylinder(parent, 0.14, 0.09, x, y, z, C.trim); this.cylinder(parent, 0.067, tall, x, y + tall / 2, z, C.pale);
    const flame = this.mesh(parent, new T.OctahedronGeometry(0.085), this.material(C.copper, 0, 2), x, y + tall + 0.09, z); flame.scale.set(0.65, 1.7, 0.65);
    if (light) { const lamp = new T.PointLight(0xffb36e, 5, 5, 1.4); lamp.position.set(x, y + tall + 0.2, z); parent.add(lamp); this.lights.push(lamp); }
  }
  private skull(parent: T.Object3D, x: number, y: number, z: number, size = 0.18) {
    const g = new T.Group(); g.position.set(x, y, z); parent.add(g);
    const dome = this.mesh(g, new T.IcosahedronGeometry(size, 1), this.material(C.pale)); dome.scale.set(0.85, 1, 0.8);
    for (const side of [-1, 1]) this.mesh(g, new T.IcosahedronGeometry(size * 0.25, 0), this.material(C.dark), side * size * 0.37, size * 0.06, size * 0.64);
    this.mesh(g, new T.ConeGeometry(size * 0.12, size * 0.27, 3), this.material(C.dark), 0, -size * 0.2, size * 0.78);
    for (let i = 0; i < 5; i++) this.box(g, size * 0.15, size * 0.24, size * 0.25, (i - 2) * size * 0.16, -size * 0.76, size * 0.3, C.pale);
    return g;
  }
  private textTexture(text: string, color = '#d5c4a1', size = 40, width = 512, height = 96) {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const c = canvas.getContext('2d')!; c.font = `${size}px Georgia, "Microsoft YaHei", serif`; c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, width / 2, height / 2);
    const tex = new T.CanvasTexture(canvas); tex.colorSpace = T.SRGBColorSpace; this.textures.push(tex); return tex;
  }
  private buildRoom() {
    this.world.add(new T.HemisphereLight(0xc0aacb, 0x362521, 1.25));
    const moon = new T.DirectionalLight(0x9895d2, 1.8); moon.position.set(-3, 8, -2); this.world.add(moon);
    this.shadow = new T.SpotLight(0xffcd9a, 100, 30, 0.65, 0.8, 1.3); this.shadow.position.set(-3, 8, 5); this.shadow.target.position.set(0, 0, 0); this.shadow.castShadow = true; this.shadow.shadow.mapSize.set(1024, 1024); this.shadow.shadow.bias = -0.001; this.world.add(this.shadow, this.shadow.target);
    this.box(this.world, 20, 0.25, 25, 0, -0.6, -4, 0x25222b);
    this.box(this.world, 19, 10, 0.5, 0, 4, -5.5, 0x29242e);
    for (let y = 0; y < 8; y++) for (let x = -6; x <= 6; x++) {
      this.box(this.world, 1.37, 0.69, 0.12, x * 1.43 + y % 2 * 0.7, y * 0.77 - 0.1, -5.16, (x + y) % 3 ? 0x302c35 : 0x39313a);
    }
    for (let x = -6.4; x <= 6.4; x += 3.2) {
      this.box(this.world, 0.7, 0.4, 1, x, -0.1, -4.5);
      this.cylinder(this.world, 0.23, 7, x, 3.3, -4.6, 0x49404b, 0.19, 8);
      this.box(this.world, 0.68, 0.35, 0.8, x, 5.9, -4.6, C.trim);
      this.arch(this.world, x + 1.6, 1.2, -4.8, 3, 5.5, 0x5b4b53);
    }
    // Central rose window; every spoke is actual geometry with depth.
    this.cylinder(this.world, 0.2, 0.1, 0, 5, -4.9);
    const rose = new T.Group(); rose.position.set(0, 5.4, -5); this.world.add(rose);
    this.mesh(rose, new T.CircleGeometry(1.55, 48), this.material(0x341b32, 0, 0.55), 0, 0, -0.02);
    this.ring(rose, 1.6, 0.11, 0, 0, 0, C.stone); this.ring(rose, 1.42, 0.045, 0, 0, 0.03, C.trim); this.ring(rose, 0.55, 0.06, 0, 0, 0.05);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, x = Math.cos(a), y = Math.sin(a);
      this.beam(rose, new T.Vector3(x * 0.52, y * 0.52, 0.05), new T.Vector3(x * 1.4, y * 1.4, 0.05), 0.035, C.trim);
      const petal = this.ring(rose, 0.24, 0.028, x * 0.94, y * 0.94, 0.03, C.brass); petal.scale.set(0.65, 1.2, 1); petal.rotation.z = a - Math.PI / 2;
    }
    // Sealed pointed doorway beneath the rose.
    this.box(this.world, 2.55, 3.7, 0.18, 0, 1.35, -4.85, C.dark); this.arch(this.world, 0, -0.35, -4.56, 2.8, 4.35, C.trim);
    for (let x = -1; x <= 1; x += 0.25) this.box(this.world, 0.17, 3.5, 0.13, x, 1.25, -4.68, 0x322731);
    for (const direction of [-1, 1]) this.beam(this.world, new T.Vector3(-1.2, 0.1 + (direction === 1 ? 0 : 2.4), -4.45), new T.Vector3(1.2, 2.5 - (direction === 1 ? 0 : 2.4), -4.45), 0.07, C.trim);
    this.ring(this.world, 0.35, 0.045, 0, 1.4, -4.35, C.red);
    for (const side of [-1, 1]) {
      this.arch(this.world, side * 4.65, 0.6, -4.87, 1.4, 3.6);
      this.box(this.world, 1.1, 2.6, 0.05, side * 4.65, 1.9, -4.99, C.dark);
      for (let i = -1; i <= 1; i++) this.box(this.world, 0.04, 2.6, 0.1, side * 4.65 + i * 0.3, 1.9, -4.8, C.trim);
      this.candle(this.world, side * 3.1, 1.1, -3.4, 0.8, true);
      this.candle(this.world, side * 3.4, 1.1, -3.4, 0.5);
      this.box(this.world, 1, 1.45, 0.8, side * 6, 0.2, -1.3, C.stone);
      this.skull(this.world, side * 6, 1.05, -1.3, 0.29);
      // Dark velvet banners with pointed ends.
      const banner = this.box(this.world, 0.8, 3.2, 0.035, side * 2.2, 4.9, -4.25, C.blood);
      const tail = this.mesh(this.world, new T.ConeGeometry(0.4, 0.55, 3), this.material(C.blood), side * 2.2, 3.15, -4.25); tail.rotation.z = Math.PI; tail.scale.z = 0.08; banner.rotation.z = side * 0.025;
      this.box(this.world, 0.06, 1.1, 0.06, side * 2.2, 5.1, -4.18, C.trim); this.box(this.world, 0.5, 0.055, 0.06, side * 2.2, 5.25, -4.18, C.trim);
    }
    const dust = new Float32Array(100 * 3);
    for (let i = 0; i < dust.length; i += 3) { dust[i] = Math.sin(i * 63) * 7; dust[i + 1] = (i % 41) / 7; dust[i + 2] = Math.cos(i * 27) * 5; }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(dust, 3));
    this.motes = new T.Points(geo, new T.PointsMaterial({ color: C.pale, size: 0.017, transparent: true, opacity: 0.5, depthWrite: false })); this.world.add(this.motes);
  }
  private buildTable() {
    this.box(this.world, 12.6, 0.45, 3.7, 0, 1.1, 0, 0x3c3038);
    this.box(this.world, 12.8, 0.12, 3.9, 0, 1.35, 0, C.trim);
    this.box(this.world, 12.3, 0.1, 3.4, 0, 1.43, 0, 0x403640);
    for (const x of [-5.3, 5.3]) { this.box(this.world, 0.9, 1.5, 2.5, x, 0.3, 0, C.stone); this.arch(this.world, x, -0.25, 1.3, 0.7, 1.3); }
    // Engraved sacrificial circles on the table, not printed UI cards.
    for (const x of [-3.8, 0, 3.8]) {
      const ring = this.ring(this.world, 1.2, 0.012, x, 1.5, 0.2, C.trim); ring.rotation.x = -Math.PI / 2;
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3, b = a + Math.PI * 4 / 3;
        this.beam(this.world, new T.Vector3(x + Math.cos(a), 1.5, 0.2 + Math.sin(a)), new T.Vector3(x + Math.cos(b), 1.5, 0.2 + Math.sin(b)), 0.009, C.trim);
      }
    }
    for (let i = 0; i < 13; i++) this.arch(this.world, -5.8 + i * 0.97, 0.93, 1.96, 0.65, 0.3, C.trim);
    this.candle(this.world, -5.9, 1.5, 0.9, 0.6, true); this.candle(this.world, -5.6, 1.5, 1.1, 0.3);
    this.candle(this.world, 5.8, 1.5, 0.75, 0.8, true); this.candle(this.world, 5.5, 1.5, 1.1, 0.45);
    this.skull(this.world, 5.8, 1.75, -1.1, 0.22);
    const book = this.box(this.world, 0.75, 0.12, 0.5, -4.6, 1.58, 1.05, C.blood); book.rotation.y = 0.3;
    for (let i = 0; i < 9; i++) { const coin = this.mesh(this.world, this.coinGeo, this.coinMat, -3.7 + i % 3 * 0.15, 1.55 + Math.floor(i / 3) * 0.023, 1.2); coin.rotation.z = i * 0.04; }
  }
  private buildMachine(target: Target) {
    const group = new T.Group(), [x, z] = positions[target]; group.position.set(x, 1.5, z); this.world.add(group);
    const coreColor = target === 'clock' ? C.red : target === 'lens' ? C.violet : target === 'ward' ? C.green : C.copper;
    const animated: T.Object3D[] = [];
    this.box(group, 1.03, 0.12, 0.91, 0, 0.06, 0, C.dark); this.box(group, 0.95, 0.09, 0.82, 0, 0.16, 0, C.trim);
    let aimY = 0.83;
    if (target === 'forge') {
      this.box(group, 0.82, 0.95, 0.66, 0, 0.65, 0, C.stone); this.arch(group, 0, 0.22, 0.36, 0.65, 0.96);
      this.box(group, 0.5, 0.55, 0.03, 0, 0.62, 0.34, C.dark);
      this.mesh(group, new T.PlaneGeometry(0.39, 0.42), this.material(C.red, 0, 1), 0, 0.58, 0.361);
      for (let i = 0; i < 5; i++) this.box(group, 0.025, 0.33, 0.03, (i - 2) * 0.1, 0.5, 0.4, C.dark);
      for (const side of [-1, 1]) { this.cylinder(group, 0.085, 1.1, side * 0.45, 0.77, 0, C.dark); this.mesh(group, new T.ConeGeometry(0.14, 0.35, 5), this.material(C.trim), side * 0.45, 1.43, 0); }
      this.skull(group, 0, 1.25, 0.2, 0.13);
    } else if (target === 'splitter') {
      this.cylinder(group, 0.3, 0.7, 0, 0.55, 0, C.dark, 0.2); this.ring(group, 0.37, 0.05, 0, 0.93, 0.1);
      const orb = this.mesh(group, new T.IcosahedronGeometry(0.2, 0), this.material(C.copper, 0.6, 0.5), 0, 0.95, 0.12); animated.push(orb);
      for (let i = 0; i < 3; i++) {
        const a = (i - 1) * 0.75;
        this.beam(group, new T.Vector3(0, 0.45, 0), new T.Vector3(Math.sin(a) * 0.48, 1.32, -0.1), 0.045, C.brass);
        this.mesh(group, new T.ConeGeometry(0.08, 0.2, 4), this.material(C.pale), Math.sin(a) * 0.48, 1.38, -0.1);
      }
      for (let i = 0; i < 10; i++) this.box(group, 0.055, 0.08, 0.03, (i - 4.5) * 0.08, 0.26, 0.42, C.trim);
    } else if (target === 'choir') {
      this.box(group, 0.8, 0.6, 0.6, 0, 0.5, 0, C.dark); this.arch(group, 0, 0.4, 0.34, 0.75, 1.02);
      for (const side of [-1, 1]) this.cylinder(group, 0.035, 0.95, side * 0.3, 0.94, 0.22, C.trim);
      const spirit = this.mesh(group, new T.IcosahedronGeometry(0.24, 1), this.material(C.green, 0.2, 0.7), 0, 0.97, 0.1); animated.push(spirit);
      const halo = this.ring(group, 0.34, 0.025, 0, 0.98, 0.1, C.pale); halo.rotation.y = 0.7; animated.push(halo);
    } else if (target === 'ward') {
      this.box(group, 0.9, 0.6, 0.65, 0, 0.47, 0, C.blood);
      for (let i = 0; i < 7; i++) { const h = 1.2 - Math.abs(i - 3) * 0.15; this.cylinder(group, 0.055, h, (i - 3) * 0.12, 0.6 + h / 2, 0, C.brass); }
      for (let i = 0; i < 8; i++) this.box(group, 0.08, 0.045, 0.2, (i - 3.5) * 0.09, 0.76, 0.35, i % 3 ? C.pale : C.dark);
      this.skull(group, 0, 0.44, 0.4, 0.14);
    } else if (target === 'lens') {
      this.cylinder(group, 0.31, 0.4, 0, 0.4, 0, C.dark, 0.2);
      const gem = this.mesh(group, new T.OctahedronGeometry(0.4), this.material(C.violet, 0.65, 0.3), 0, 1.02, 0); gem.scale.y = 1.4; animated.push(gem);
      const halo = this.ring(group, 0.52, 0.025, 0, 1, 0); halo.rotation.x = 0.7; animated.push(halo);
      for (const side of [-1, 1]) this.mesh(group, new T.ConeGeometry(0.07, 0.8, 4), this.material(C.trim), side * 0.41, 0.8, 0);
    } else if (target === 'seal') {
      this.box(group, 0.78, 0.8, 0.6, 0, 0.6, 0, C.stone); this.arch(group, 0, 0.2, 0.32, 0.85, 1.34);
      const star = this.mesh(group, new T.OctahedronGeometry(0.25), this.material(C.pale, 0.55, 0.2), 0, 0.86, 0.35); animated.push(star);
      this.ring(group, 0.35, 0.035, 0, 0.85, 0.33);
      for (const side of [-1, 1]) this.candle(group, side * 0.43, 0.2, 0.3, 0.55);
    } else {
      aimY = 1.1;
      this.box(group, 1.05, 1.65, 0.55, 0, 1.02, 0, C.dark); this.arch(group, 0, 0.2, 0.33, 1.1, 2.25, C.brass);
      for (const side of [-1, 1]) {
        this.cylinder(group, 0.065, 1.8, side * 0.6, 1.13, 0, C.trim); this.mesh(group, new T.ConeGeometry(0.12, 0.4, 5), this.material(C.pale), side * 0.6, 2.17, 0);
        this.skull(group, side * 0.47, 0.3, 0.35, 0.15);
      }
      this.ring(group, 0.37, 0.055, 0, 1.8, 0.35, C.trim);
      const eye = this.mesh(group, new T.SphereGeometry(0.12, 12, 6), this.material(C.red, 0, 1.3), 0, 1.8, 0.35); eye.scale.x = 1.8;
      this.mesh(group, new T.SphereGeometry(0.07, 8, 6), this.material(C.dark), 0, 1.8, 0.455);
      this.clockCanvas.width = 512; this.clockCanvas.height = 256; this.clockFace = new T.CanvasTexture(this.clockCanvas); this.clockFace.colorSpace = T.SRGBColorSpace; this.textures.push(this.clockFace);
      this.mesh(group, new T.PlaneGeometry(0.97, 0.485), new T.MeshBasicMaterial({ map: this.clockFace, transparent: true }), 0, 1.08, 0.34);
      const pendulum = new T.Group(); pendulum.position.set(0, 0.8, 0.32); group.add(pendulum); this.cylinder(pendulum, 0.018, 0.45, 0, -0.2, 0, C.brass); this.mesh(pendulum, new T.OctahedronGeometry(0.12), this.material(C.red, 0.5), 0, -0.45, 0); animated.push(pendulum);
    }
    const targetMesh = this.mesh(group, new T.BoxGeometry(target === 'clock' ? 1.3 : 1.12, target === 'clock' ? 2.3 : 1.65, 0.9), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), 0, aimY, 0.05);
    targetMesh.userData.target = target;
    const aura = this.mesh(group, new T.TorusGeometry(target === 'clock' ? 0.71 : 0.57, 0.013, 4, 48), this.material(coreColor, 0, 1), 0, 0.22, 0); aura.rotation.x = -Math.PI / 2;
    const sprite = new T.Sprite(new T.SpriteMaterial({ map: this.textTexture(target === 'clock' ? '丧钟' : devices[target].short), transparent: true, depthWrite: false }));
    sprite.position.set(0, 0.3, 0.65); sprite.scale.set(target === 'clock' ? 1.05 : 1.25, 0.23, 1); group.add(sprite);
    this.models[target] = { group, target: targetMesh, aura, animated, flash: 0, label: sprite, revealed: target === 'clock' || devices[target].at === 0 };
    if (target !== 'clock' && devices[target].at > 0) { group.visible = false; const dormant = this.ring(this.world, 0.43, 0.012, x, 1.52, z, 0x55444e); dormant.rotation.x = -Math.PI / 2; }
  }
  private buildGun() {
    // Camera-mounted flintlock and two visible hands; the muzzle is the source of every player coin.
    this.gun.position.set(0.65, -0.48, -2); this.gun.rotation.set(0.08, -0.1, -0.07); this.camera.add(this.gun);
    const wood = 0x452932, steel = 0x5e555b;
    const stock = this.box(this.gun, 0.22, 0.2, 0.85, 0, 0, 0.12, wood); stock.rotation.x = -0.13;
    const grip = this.box(this.gun, 0.18, 0.4, 0.23, 0, -0.22, 0.4, wood); grip.rotation.x = -0.4;
    for (let i = 0; i < 5; i++) {
      const b = new T.Group(); b.position.set((i - 2) * 0.09, 0.16, -0.26); this.gun.add(b);
      const barrel = this.cylinder(b, 0.052, 0.98, 0, 0, 0, steel, 0.048, 8); barrel.rotation.x = Math.PI / 2;
      const opening = this.cylinder(b, 0.037, 0.012, 0, 0, -0.501, C.dark, 0.037, 8); opening.rotation.x = Math.PI / 2;
      for (const z of [-0.35, 0.05, 0.36]) { const band = this.cylinder(b, 0.057, 0.045, 0, 0, z, C.brass); band.rotation.x = Math.PI / 2; }
      b.visible = i === 2; this.gunBarrels.push(b);
    }
    this.box(this.gun, 0.025, 0.11, 0.07, 0, 0.25, -0.65, C.brass);
    const lock = this.ring(this.gun, 0.095, 0.025, 0.12, -0.16, 0.27); lock.rotation.y = Math.PI / 2;
    this.box(this.gun, 0.065, 0.23, 0.07, 0.17, 0.16, 0.26, C.brass).rotation.z = -0.35;
    this.skull(this.gun, 0, 0.05, 0.52, 0.08);
    this.handsMat = this.material(0x8d6b62);
    // Right hand curls around the grip; left hand supports the barrel.
    const palm = this.mesh(this.gun, new T.CapsuleGeometry(0.09, 0.16, 3, 6), this.handsMat, 0.12, -0.25, 0.45); palm.rotation.x = -0.3;
    for (let i = 0; i < 4; i++) { const finger = this.mesh(this.gun, new T.CapsuleGeometry(0.025, 0.13, 2, 5), this.handsMat, 0.04, -0.15 - i * 0.055, 0.57); finger.rotation.z = Math.PI / 2; this.fingers.push(finger); }
    const thumb = this.mesh(this.gun, new T.CapsuleGeometry(0.035, 0.13, 2, 5), this.handsMat, 0.17, -0.09, 0.45); thumb.rotation.z = -0.4;
    const sleeve = this.box(this.gun, 0.27, 0.55, 0.26, 0.1, -0.6, 0.55, 0x201e2b); sleeve.rotation.z = -0.17;
    this.box(this.gun, 0.28, 0.1, 0.28, 0.05, -0.38, 0.5, C.trim);
    this.mesh(this.gun, new T.BoxGeometry(0.25, 0.14, 0.3), this.handsMat, -0.12, -0.14, -0.08);
    const leftSleeve = this.box(this.gun, 0.25, 0.28, 0.8, -0.28, -0.3, 0.23, 0x24202c); leftSleeve.rotation.y = -0.45; leftSleeve.rotation.x = -0.3;
    this.muzzle.position.set(0, 0.16, -0.78); this.gun.add(this.muzzle);
    this.muzzleFlash = this.mesh(this.gun, new T.OctahedronGeometry(0.16), new T.MeshBasicMaterial({ color: C.copper, transparent: true, opacity: 0.8 }), 0, 0.16, -0.85); this.muzzleFlash.visible = false;
    this.gun.traverse(obj => { if (obj instanceof T.Mesh) { obj.castShadow = false; obj.receiveShadow = false; } });
  }
  private resize = () => { const box = this.canvas.getBoundingClientRect(); if (!box.width || !box.height) return; this.camera.aspect = box.width / box.height; this.camera.fov = T.MathUtils.radToDeg(2 * Math.atan(Math.tan(T.MathUtils.degToRad(47 / 2)) * Math.max(1, 1.6 / this.camera.aspect))); this.camera.updateProjectionMatrix(); this.renderer.setSize(box.width, box.height, false); };
  private pointerMove = (e: PointerEvent) => { const b = this.canvas.getBoundingClientRect(); this.mouse.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); this.pointerInside = true; };
  private pointerDown = (e: PointerEvent) => { if (e.button !== 0) return; e.preventDefault(); this.canvas.focus({ preventScroll: true }); this.pointerMove(e); this.held = true; this.shootPointer(); };
  private pointerLeave = () => { this.pointerInside = false; this.release(); };
  private release = () => { this.held = false; };
  private blur = () => { this.release(); if (canShoot(this.state)) this.pause(); };
  private visibility = () => { if (document.hidden) this.blur(); };
  private contextLost = (e: Event) => { e.preventDefault(); this.lost = true; this.pause(); this.onError('圣约视野中断。请重新载入；已开始的守夜可从存档继续。'); };
  startTutorial = () => { this.audio.unlock(); this.state = beginTutorial(this.state); this.publish(); this.select('splitter'); };
  start = () => { this.audio.unlock(); this.state = beginNight(this.state); this.last = 0; this.publish(); };
  resume = () => { this.audio.unlock(); this.state = { ...this.state, status: this.state.guide < 4 ? 'tutorial' : 'playing' }; this.last = 0; this.publish(); };
  restore = (state: GameState) => { this.state = { ...state, status: 'playing' }; this.last = 0; this.publish(); };
  restart = () => { this.clearShots(); this.state = initialState(); this.recoil = 0; this.held = false; this.lastAlarm = -1; this.start(); };
  pause = () => { this.release(); if (canShoot(this.state)) this.state = { ...this.state, status: 'paused' }; else if (this.state.status === 'paused') this.resume(); this.publish(); };
  setAutoTarget = (target: Target) => { if (unlocked(this.state, target)) this.state = { ...this.state, autoTarget: target }; this.publish(); };
  select = (target: Target) => { if (!unlocked(this.state, target)) return; this.selected = target; this.pointerInside = false; this.onView(this.view()); };
  fireSelected = () => { const model = this.models[this.selected]; if (model && unlocked(this.state, this.selected)) this.shoot(model.target.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0, 0.5)), this.selected); };
  private intersection() {
    this.ray.setFromCamera(this.mouse, this.camera);
    const intersections = this.ray.intersectObjects(TARGETS.filter(t => unlocked(this.state, t)).map(t => this.models[t].target), false);
    if (intersections.length) return { point: intersections[0].point, target: intersections[0].object.userData.target as Target };
    const point = new T.Vector3(); const plane = new T.Plane(new T.Vector3(0, 1, 0), -1.5);
    return { point: this.ray.ray.intersectPlane(plane, point) || this.ray.ray.at(12, new T.Vector3()), target: null };
  }
  private shootPointer() { const { point, target } = this.intersection(); if (target) this.selected = target; this.shoot(point, target); }
  private shoot(end: T.Vector3, target: Target | null) {
    if (!canShoot(this.state) || this.fireCooldown > 0 || this.shots.length > 90) return;
    this.audio.unlock(); this.audio.fire(); this.fireCooldown = 0.16; this.recoil = 1;
    const count = volley(this.state); this.state = registerShot(this.state, count);
    const origin = this.muzzle.getWorldPosition(new T.Vector3());
    for (let i = 0; i < count; i++) {
      const mesh = this.mesh(this.world, this.coinGeo, this.coinMat); mesh.scale.setScalar(1.5);
      const destination = end.clone(); destination.x += (i - (count - 1) / 2) * 0.045;
      this.shots.push({ mesh, start: origin.clone(), end: destination, age: 0, delay: i * 0.018, duration: 0.28, target, visualOnly: false });
    }
    this.publish();
  }
  private impact(shot: Shot) {
    if (!shot.visualOnly) {
      const before = this.state.upgrades;
      this.state = hit(this.state, shot.target); this.audio.hit(shot.target);
      if (this.state.upgrades > before) this.audio.upgrade();
    }
    if (shot.target) this.models[shot.target].flash = 1;
    for (let i = 0; i < 5 && this.sparks.children.length < 100; i++) {
      const spark = this.mesh(this.sparks, new T.OctahedronGeometry(0.023), this.material(shot.target === 'clock' ? C.red : C.copper, 0, 2));
      spark.position.copy(shot.end); spark.userData = { life: 0.45, velocity: new T.Vector3((Math.random() - 0.5) * 1.8, Math.random() * 1.5, Math.random()) };
    }
    this.publish();
  }
  private clearShots() { for (const s of this.shots) this.world.remove(s.mesh); this.shots = []; }
  private publish() { this.onChange({ ...this.state }); }
  private view(): SceneView {
    const points: SceneView['points'] = {};
    for (const t of TARGETS) {
      if (!unlocked(this.state, t)) continue;
      const v = this.models[t].target.getWorldPosition(new T.Vector3()).project(this.camera); points[t] = { x: (v.x + 1) * 50, y: (1 - v.y) * 50 };
    }
    return { hovered: this.pointerInside ? this.currentHover : this.selected, points, ready: true };
  }
  private loop = (now: number) => {
    if (this.lost) return;
    const real = this.last ? Math.max(0, (now - this.last) / 1000) : 0, dt = Math.min(real, 0.07); this.last = now;
    const active = canShoot(this.state);
    if (active || this.state.status === 'ready') this.animationTime += dt;
    if (active) {
      const before = this.state.status, oldHits = this.state.hits, oldUpgrades = this.state.upgrades;
      const spiritTarget = this.state.autoTarget !== 'clock' && !cost(this.state, this.state.autoTarget) ? 'clock' : this.state.autoTarget;
      this.state = advance(this.state, real);
      if (this.state.hits > oldHits) {
        this.models[spiritTarget].flash = 0.65;
        const mesh = this.mesh(this.world, this.coinGeo, this.coinMat);
        this.shots.push({ mesh, start: this.models.choir.target.getWorldPosition(new T.Vector3()), end: this.models[spiritTarget].target.getWorldPosition(new T.Vector3()), age: 0, delay: 0, duration: 0.35, target: spiritTarget, visualOnly: true });
      }
      if (this.state.upgrades > oldUpgrades) this.audio.upgrade();
      if (this.state.status !== before) { this.held = false; this.publish(); }
      this.fireCooldown = Math.max(0, this.fireCooldown - real); this.recoil = Math.max(0, this.recoil - dt * 7);
      if (this.held && this.fireCooldown <= 0) this.shootPointer();
      this.shots = this.shots.filter(shot => {
        shot.age += dt;
        if (shot.age < shot.delay) { shot.mesh.visible = false; return true; }
        shot.mesh.visible = true;
        const t = Math.min(1, (shot.age - shot.delay) / shot.duration);
        shot.mesh.position.lerpVectors(shot.start, shot.end, t); shot.mesh.position.y += Math.sin(t * Math.PI) * 0.12; shot.mesh.rotation.set(t * 18, t * 5, 0);
        if (t >= 1) { this.impact(shot); this.world.remove(shot.mesh); return false; } return true;
      });
      if (this.state.time < 30 && Math.floor(this.state.elapsed / 2) !== this.lastAlarm) { this.lastAlarm = Math.floor(this.state.elapsed / 2); this.audio.alarm(); }
    }
    const aim = this.pointerInside && !this.reduced ? this.mouse.x : 0;
    this.camera.position.x = T.MathUtils.lerp(this.camera.position.x, aim * 0.22, dt * 4);
    this.camera.lookAt(aim * 0.45, 1.65 + (this.pointerInside && !this.reduced ? this.mouse.y * 0.12 : 0), -0.6);
    this.gun.position.set(0.65 + aim * 0.025, -0.48 - this.recoil * 0.04 + (this.reduced ? 0 : Math.sin(this.animationTime * 1.8) * 0.008), -2 + this.recoil * 0.12);
    this.gun.rotation.x = 0.08 + this.recoil * 0.12 - (this.pointerInside ? this.mouse.y * 0.12 : 0);
    this.gun.rotation.y = -0.1 - aim * 0.22;
    this.muzzleFlash.visible = this.recoil > 0.72 && active; this.muzzleFlash.rotation.z += dt * 6;
    for (let i = 0; i < 5; i++) this.gunBarrels[i].visible = Math.abs(i - 2) <= Math.floor(volley(this.state) / 2) && (volley(this.state) % 2 === 1 || i !== 2 + Math.floor(volley(this.state) / 2));
    this.world.updateMatrixWorld(true); this.currentHover = this.pointerInside ? this.intersection().target : null;
    for (const target of TARGETS) {
      const m = this.models[target], visible = unlocked(this.state, target); m.group.visible = visible;
      if (!visible) { m.revealed = false; continue; }
      if (!m.revealed) { m.group.scale.setScalar(0.01); m.revealed = true; }
      m.group.scale.lerp(new T.Vector3(1, 1, 1), this.reduced ? 1 : dt * 2);
      if (active) m.flash = Math.max(0, m.flash - dt * 3);
      const highlight = (this.pointerInside ? this.currentHover : this.selected) === target || (this.state.status === 'tutorial' && recommendation(this.state).target === target);
      m.aura.scale.setScalar(1 + m.flash * 0.12); m.aura.visible = highlight || m.flash > 0;
      for (let i = 0; i < m.animated.length; i++) {
        const a = m.animated[i];
        if (target === 'clock') a.rotation.z = this.reduced ? 0 : Math.sin(this.animationTime * 2.3) * 0.3;
        else if (!this.reduced) { a.rotation.y = this.animationTime * (i ? -0.5 : 0.5); a.rotation.z = Math.sin(this.animationTime * 0.5) * 0.12; }
      }
    }
    const value = Math.ceil(this.state.time);
    if (value !== this.clockValue) {
      this.clockValue = value; const c = this.clockCanvas.getContext('2d')!; c.clearRect(0, 0, 512, 256); c.fillStyle = value < 30 ? '#ff6552' : '#edbea0'; c.textAlign = 'center'; c.font = '150px Georgia'; c.fillText(String(value).padStart(3, '0'), 256, 172); c.font = '20px Georgia'; c.fillStyle = '#c4a391'; c.fillText('MEMENTO MORI', 256, 223); this.clockFace.needsUpdate = true;
    }
    if (active) for (const obj of [...this.sparks.children]) { obj.userData.life -= dt; obj.position.addScaledVector(obj.userData.velocity, dt); obj.userData.velocity.y -= dt * 2; if (obj.userData.life <= 0) { this.sparks.remove(obj); (obj as T.Mesh).geometry.dispose(); } }
    this.lights.forEach((l, i) => { l.intensity = this.reduced ? 5 : 5 + Math.sin(this.animationTime * 7 + i) * 0.55; });
    if (!this.reduced) this.motes.rotation.y = this.animationTime * 0.018;
    this.shadow.color.setHex(waveActive(this.state) ? 0xe67c6a : 0xffcd9a);
    this.renderer.render(this.world, this.camera);
    this.uiTick += real;
    if (this.uiTick > 0.1 || !this.last) { this.uiTick = 0; this.publish(); this.onView(this.view()); }
    this.frame = requestAnimationFrame(this.loop);
  };
  destroy() {
    cancelAnimationFrame(this.frame); this.observer.disconnect(); this.audio.dispose();
    this.canvas.removeEventListener('pointermove', this.pointerMove); this.canvas.removeEventListener('pointerdown', this.pointerDown); this.canvas.removeEventListener('pointerleave', this.pointerLeave); this.canvas.removeEventListener('webglcontextlost', this.contextLost);
    window.removeEventListener('pointerup', this.release); window.removeEventListener('pointercancel', this.release); window.removeEventListener('blur', this.blur); document.removeEventListener('visibilitychange', this.visibility);
    const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
    this.world.traverse(o => { if (o instanceof T.Mesh || o instanceof T.Points) { geometries.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: T.Material) => materials.add(m)); } if (o instanceof T.Sprite) materials.add(o.material); });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); this.textures.forEach(t => t.dispose()); this.renderer.dispose();
  }
}
