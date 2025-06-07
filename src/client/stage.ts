import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  HemisphereLight,
  DirectionalLight,
  Fog,
  CylinderGeometry,
  Matrix4,
  MeshPhongMaterial,
  Mesh,
  Object3D,
  SphereGeometry,
  DodecahedronGeometry,
  BoxGeometry,
  MeshBasicMaterial,
  Vector3,
  Clock,
  ConeGeometry,
  Group
} from 'three';
import type { PostConfig } from '../shared/types/postConfig';
import { Frog } from './frog';

// Beautiful low-poly colors from the airplane game
const Colors = {
  red: 0xf25346,
  yellow: 0xedeb27,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xF5986E,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
  green: 0x458248,
  purple: 0x551A8B,
  lightgreen: 0x629265,
  orange: 0xFF4500,
  darkred: 0x8B0000,
  gold: 0xFFD700,
  silver: 0xC0C0C0,
};

class Land {
  mesh: Mesh;

  constructor() {
    const geom = new CylinderGeometry(600, 600, 1700, 40, 10);
    geom.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2));
    const mat = new MeshPhongMaterial({
      color: Colors.lightgreen,
      flatShading: true,
    });
    this.mesh = new Mesh(geom, mat);
    this.mesh.receiveShadow = true;
  }
}

class Sun {
  mesh: Object3D;

  constructor() {
    this.mesh = new Object3D();
    const sunGeom = new SphereGeometry(400, 20, 10);
    const sunMat = new MeshPhongMaterial({
      color: Colors.yellow,
      flatShading: true,
    });
    const sun = new Mesh(sunGeom, sunMat);
    sun.castShadow = false;
    sun.receiveShadow = false;
    this.mesh.add(sun);
  }
}

class Cloud {
  mesh: Object3D;

  constructor() {
    this.mesh = new Object3D();
    const geom = new DodecahedronGeometry(20, 0);
    const mat = new MeshPhongMaterial({
      color: Colors.white,
    });

    const nBlocs = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < nBlocs; i++) {
      const m = new Mesh(geom, mat);
      m.position.x = i * 15;
      m.position.y = Math.random() * 10;
      m.position.z = Math.random() * 10;
      m.rotation.z = Math.random() * Math.PI * 2;
      m.rotation.y = Math.random() * Math.PI * 2;

      const s = 0.1 + Math.random() * 0.9;
      m.scale.set(s, s, s);
      this.mesh.add(m);
    }
  }
}

class Sky {
  mesh: Object3D;
  nClouds: number;

  constructor() {
    this.mesh = new Object3D();
    this.nClouds = 25;
    const stepAngle = (Math.PI * 2) / this.nClouds;

    for (let i = 0; i < this.nClouds; i++) {
      const c = new Cloud();
      const a = stepAngle * i;
      const h = 800 + Math.random() * 200;
      c.mesh.position.y = Math.sin(a) * h;
      c.mesh.position.x = Math.cos(a) * h;
      c.mesh.rotation.z = a + Math.PI / 2;
      c.mesh.position.z = -400 - Math.random() * 400;
      const s = 1 + Math.random() * 2;
      c.mesh.scale.set(s, s, s);
      this.mesh.add(c.mesh);
    }
  }
}

class Tree {
  mesh: Object3D;

  constructor() {
    this.mesh = new Object3D();

    const matTreeLeaves = new MeshPhongMaterial({
      color: Colors.green,
      flatShading: true,
    });

    const geonTreeBase = new BoxGeometry(10, 20, 10);
    const matTreeBase = new MeshBasicMaterial({ color: Colors.brown });
    const treeBase = new Mesh(geonTreeBase, matTreeBase);
    treeBase.castShadow = true;
    treeBase.receiveShadow = true;
    this.mesh.add(treeBase);

    const geomTreeLeaves1 = new CylinderGeometry(1, 12 * 3, 12 * 3, 4);
    const treeLeaves1 = new Mesh(geomTreeLeaves1, matTreeLeaves);
    treeLeaves1.castShadow = true;
    treeLeaves1.receiveShadow = true;
    treeLeaves1.position.y = 20;
    this.mesh.add(treeLeaves1);

    const geomTreeLeaves2 = new CylinderGeometry(1, 9 * 3, 9 * 3, 4);
    const treeLeaves2 = new Mesh(geomTreeLeaves2, matTreeLeaves);
    treeLeaves2.castShadow = true;
    treeLeaves2.position.y = 40;
    treeLeaves2.receiveShadow = true;
    this.mesh.add(treeLeaves2);

    const geomTreeLeaves3 = new CylinderGeometry(1, 6 * 3, 6 * 3, 4);
    const treeLeaves3 = new Mesh(geomTreeLeaves3, matTreeLeaves);
    treeLeaves3.castShadow = true;
    treeLeaves3.position.y = 55;
    treeLeaves3.receiveShadow = true;
    this.mesh.add(treeLeaves3);
  }
}

class Flower {
  mesh: Object3D;

  constructor() {
    this.mesh = new Object3D();

    const geomStem = new BoxGeometry(5, 50, 5, 1, 1, 1);
    const matStem = new MeshPhongMaterial({
      color: Colors.green,
      flatShading: true,
    });
    const stem = new Mesh(geomStem, matStem);
    stem.castShadow = false;
    stem.receiveShadow = true;
    this.mesh.add(stem);

    const geomPetalCore = new BoxGeometry(10, 10, 10, 1, 1, 1);
    const matPetalCore = new MeshPhongMaterial({
      color: Colors.yellow,
      flatShading: true,
    });
    const petalCore = new Mesh(geomPetalCore, matPetalCore);
    petalCore.castShadow = false;
    petalCore.receiveShadow = true;

    const petalColors = [Colors.red, Colors.yellow, Colors.blue];
    const petalColor = petalColors[Math.floor(Math.random() * 3)];

    const geomPetal = new BoxGeometry(15, 20, 5, 1, 1, 1);
    const matPetal = new MeshBasicMaterial({ color: petalColor });

    geomPetal.translate(12.5, 0, 3);

    const petals = [];
    for (let i = 0; i < 4; i++) {
      petals[i] = new Mesh(geomPetal, matPetal);
      petals[i].rotation.z = (i * Math.PI) / 2;
      petals[i].castShadow = true;
      petals[i].receiveShadow = true;
    }

    petalCore.add(petals[0], petals[1], petals[2], petals[3]);
    petalCore.position.y = 25;
    petalCore.position.z = 3;
    this.mesh.add(petalCore);
  }
}

class Forest {
  mesh: Object3D;
  nTrees: number;
  nFlowers: number;

  constructor() {
    this.mesh = new Object3D();
    this.nTrees = 300;
    let stepAngle = (Math.PI * 2) / this.nTrees;

    // Create Trees
    for (let i = 0; i < this.nTrees; i++) {
      const t = new Tree();
      const a = stepAngle * i;
      const h = 605;
      t.mesh.position.y = Math.sin(a) * h;
      t.mesh.position.x = Math.cos(a) * h;
      t.mesh.rotation.z = a + (Math.PI / 2) * 3;
      t.mesh.position.z = 0 - Math.random() * 600;
      const s = 0.3 + Math.random() * 0.75;
      t.mesh.scale.set(s, s, s);
      this.mesh.add(t.mesh);
    }

    // Create Flowers
    this.nFlowers = 350;
    stepAngle = (Math.PI * 2) / this.nFlowers;

    for (let i = 0; i < this.nFlowers; i++) {
      const f = new Flower();
      const a = stepAngle * i;
      const h = 605;
      f.mesh.position.y = Math.sin(a) * h;
      f.mesh.position.x = Math.cos(a) * h;
      f.mesh.rotation.z = a + (Math.PI / 2) * 3;
      f.mesh.position.z = 0 - Math.random() * 600;
      const s = 0.1 + Math.random() * 0.3;
      f.mesh.scale.set(s, s, s);
      this.mesh.add(f.mesh);
    }
  }
}

type PlaneType = 'normal' | 'destroyer' | 'super' | 'slowmo' | 'bouncy' | 'tiny' | 'giant';

interface PlaneEffect {
  type: PlaneType;
  color: number;
  effect: string;
  description: string;
}

const PLANE_EFFECTS: PlaneEffect[] = [
  { type: 'normal', color: Colors.red, effect: 'normal', description: 'Normal crash launch' },
  { type: 'destroyer', color: Colors.darkred, effect: 'destroy', description: 'Destroys frog - no launch!' },
  { type: 'super', color: Colors.gold, effect: 'super', description: 'SUPER LAUNCH! 3x power!' },
  { type: 'slowmo', color: Colors.blue, effect: 'slowmo', description: 'Slow motion launch' },
  { type: 'bouncy', color: Colors.orange, effect: 'bouncy', description: 'Extra bouncy frog' },
  { type: 'tiny', color: Colors.purple, effect: 'tiny', description: 'Tiny frog launch' },
  { type: 'giant', color: Colors.green, effect: 'giant', description: 'Giant frog launch' }
];

class AirPlane {
  mesh: Object3D;
  propeller: Mesh;
  planeType: PlaneType;
  effect: PlaneEffect;

  constructor(planeType: PlaneType = 'normal') {
    this.planeType = planeType;
    this.effect = PLANE_EFFECTS.find(e => e.type === planeType) || PLANE_EFFECTS[0];
    this.mesh = new Object3D();

    // Create the cabin with effect color
    const geomCockpit = new BoxGeometry(80, 50, 50, 1, 1, 1);
    const matCockpit = new MeshPhongMaterial({
      color: this.effect.color,
      flatShading: true,
    });

    const cockpit = new Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);

    // Create the engine
    const geomEngine = new BoxGeometry(20, 50, 50, 1, 1, 1);
    const matEngine = new MeshPhongMaterial({
      color: Colors.white,
      flatShading: true,
    });
    const engine = new Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    // Create the tail
    const geomTailPlane = new BoxGeometry(15, 20, 5, 1, 1, 1);
    const matTailPlane = new MeshPhongMaterial({
      color: this.effect.color,
      flatShading: true,
    });
    const tailPlane = new Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-35, 25, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);

    // Create the wings
    const geomSideWing = new BoxGeometry(40, 4, 150, 1, 1, 1);
    const matSideWing = new MeshPhongMaterial({
      color: this.effect.color,
      flatShading: true,
    });

    const sideWingTop = new Mesh(geomSideWing, matSideWing);
    const sideWingBottom = new Mesh(geomSideWing, matSideWing);
    sideWingTop.castShadow = true;
    sideWingTop.receiveShadow = true;
    sideWingBottom.castShadow = true;
    sideWingBottom.receiveShadow = true;

    sideWingTop.position.set(20, 12, 0);
    sideWingBottom.position.set(20, -3, 0);
    this.mesh.add(sideWingTop);
    this.mesh.add(sideWingBottom);

    // Create windshield
    const geomWindshield = new BoxGeometry(3, 15, 20, 1, 1, 1);
    const matWindshield = new MeshPhongMaterial({
      color: Colors.white,
      transparent: true,
      opacity: 0.3,
      flatShading: true,
    });
    const windshield = new Mesh(geomWindshield, matWindshield);
    windshield.position.set(5, 27, 0);
    windshield.castShadow = true;
    windshield.receiveShadow = true;
    this.mesh.add(windshield);

    // Create propeller
    const geomPropeller = new BoxGeometry(20, 10, 10, 1, 1, 1);
    const matPropeller = new MeshPhongMaterial({
      color: Colors.brown,
      flatShading: true,
    });
    this.propeller = new Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    // Create propeller blades
    const geomBlade1 = new BoxGeometry(1, 100, 10, 1, 1, 1);
    const geomBlade2 = new BoxGeometry(1, 10, 100, 1, 1, 1);
    const matBlade = new MeshPhongMaterial({
      color: Colors.brownDark,
      flatShading: true,
    });

    const blade1 = new Mesh(geomBlade1, matBlade);
    blade1.position.set(8, 0, 0);
    blade1.castShadow = true;
    blade1.receiveShadow = true;

    const blade2 = new Mesh(geomBlade2, matBlade);
    blade2.position.set(8, 0, 0);
    blade2.castShadow = true;
    blade2.receiveShadow = true;

    this.propeller.add(blade1, blade2);
    this.propeller.position.set(50, 0, 0);
    this.mesh.add(this.propeller);

    // Create wheels
    const wheelProtecGeom = new BoxGeometry(30, 15, 10, 1, 1, 1);
    const wheelProtecMat = new MeshPhongMaterial({
      color: Colors.white,
      flatShading: true,
    });
    const wheelProtecR = new Mesh(wheelProtecGeom, wheelProtecMat);
    wheelProtecR.position.set(25, -20, 25);
    this.mesh.add(wheelProtecR);

    const wheelTireGeom = new BoxGeometry(24, 24, 4);
    const wheelTireMat = new MeshPhongMaterial({
      color: Colors.brownDark,
      flatShading: true,
    });
    const wheelTireR = new Mesh(wheelTireGeom, wheelTireMat);
    wheelTireR.position.set(25, -28, 25);

    const wheelAxisGeom = new BoxGeometry(10, 10, 6);
    const wheelAxisMat = new MeshPhongMaterial({
      color: Colors.brown,
      flatShading: true,
    });
    const wheelAxis = new Mesh(wheelAxisGeom, wheelAxisMat);
    wheelTireR.add(wheelAxis);
    this.mesh.add(wheelTireR);

    const wheelProtecL = wheelProtecR.clone();
    wheelProtecL.position.z = -wheelProtecR.position.z;
    this.mesh.add(wheelProtecL);

    const wheelTireL = wheelTireR.clone();
    wheelTireL.position.z = -wheelTireR.position.z;
    this.mesh.add(wheelTireL);

    const wheelTireB = wheelTireR.clone();
    wheelTireB.scale.set(0.5, 0.5, 0.5);
    wheelTireB.position.set(-35, -5, 0);
    this.mesh.add(wheelTireB);

    // Create suspension
    const suspensionGeom = new BoxGeometry(4, 20, 4);
    suspensionGeom.translate(0, 10, 0);
    const suspensionMat = new MeshPhongMaterial({
      color: this.effect.color,
      flatShading: true,
    });
    const suspension = new Mesh(suspensionGeom, suspensionMat);
    suspension.position.set(-35, -5, 0);
    suspension.rotation.z = -0.3;
    this.mesh.add(suspension);
  }
}

class EnemyPlane {
  airplane: AirPlane;
  speed: number;
  direction: Vector3;
  active: boolean = true;

  constructor(planeType: PlaneType = 'normal') {
    this.airplane = new AirPlane(planeType);
    this.speed = 4 + Math.random() * 3;
    this.direction = new Vector3(-1, 0, 0);
    
    // CRITICAL FIX: Position enemy planes on the EXACT same flight path as player
    // Player plane is at Y=110, so enemy planes should be at Y=110 too
    this.airplane.mesh.position.set(
      300 + Math.random() * 200,  // Far ahead of player
      110,                        // EXACT same height as player plane
      -250                        // EXACT same Z position as player plane
    );
    
    // Face towards player (opposite direction)
    this.airplane.mesh.rotation.y = Math.PI;
    
    console.log(`SPAWNED enemy plane at: ${this.airplane.mesh.position.x}, ${this.airplane.mesh.position.y}, ${this.airplane.mesh.position.z}`);
  }

  update(): void {
    if (!this.active) return;
    
    // Move towards player on the same flight path
    this.airplane.mesh.position.add(this.direction.clone().multiplyScalar(this.speed));
    
    // Spin propeller
    this.airplane.propeller.rotation.x += 0.3;
    
    // Remove if too far behind player
    if (this.airplane.mesh.position.x < -200) {
      this.active = false;
      console.log('Enemy plane removed - too far behind');
    }
  }

  checkCollision(playerPosition: Vector3): boolean {
    if (!this.active) return false;
    
    const distance = this.airplane.mesh.position.distanceTo(playerPosition);
    const collisionThreshold = 50;
    
    if (distance < collisionThreshold) {
      console.log(`COLLISION! Distance: ${distance}, Player: ${playerPosition.x}, ${playerPosition.y}, ${playerPosition.z}, Enemy: ${this.airplane.mesh.position.x}, ${this.airplane.mesh.position.y}, ${this.airplane.mesh.position.z}`);
      return true;
    }
    
    return false;
  }
}

export class Stage {
  private container: HTMLElement;
  private scene: Scene;
  private renderer: WebGLRenderer;
  private camera: PerspectiveCamera;
  private clock: Clock;

  // World elements
  private sky: Sky;
  private forest: Forest;
  private land: Land;
  private orbit: Object3D;
  private airplane: AirPlane;
  private sun: Sun;

  // Game elements
  private frogOnPlane: Frog | null = null;
  private enemyPlanes: EnemyPlane[] = [];
  private gameSpeed: number = 1;
  private planesAvoided: number = 0;
  private gameActive: boolean = true;
  private lastPlaneSpawn: number = 0;
  private spawnInterval: number = 2000;

  // Mouse tracking
  private mousePos = { x: 0, y: 0 };
  private offSet = -600;

  // Frog management
  private frogs: Frog[] = [];
  private currentFrog: Frog | null = null;
  private cameraFollowingFrog: boolean = false;

  private config: PostConfig;

  constructor(config: PostConfig, devicePixelRatio: number) {
    this.config = config;
    this.container = document.getElementById('world') as HTMLElement;
    this.clock = new Clock();

    this.setupRenderer(devicePixelRatio);
    this.setupCamera();
    this.setupLights();
    this.setupWorld();
    this.setupEventListeners();
    this.startRenderLoop();
    this.spawnFrogOnPlane();
  }

  private setupRenderer(devicePixelRatio: number): void {
    const HEIGHT = window.innerHeight;
    const WIDTH = window.innerWidth;

    this.scene = new Scene();
    this.scene.fog = new Fog(0xf7d9aa, 100, 950);

    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    this.renderer.setSize(WIDTH, HEIGHT);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    this.container.appendChild(this.renderer.domElement);
  }

  private setupCamera(): void {
    const HEIGHT = window.innerHeight;
    const WIDTH = window.innerWidth;
    const aspectRatio = WIDTH / HEIGHT;

    this.camera = new PerspectiveCamera(60, aspectRatio, 1, 10000);
    this.camera.position.set(0, 150, 100);
  }

  private setupLights(): void {
    // Hemisphere light for ambient lighting
    const hemisphereLight = new HemisphereLight(0xaaaaaa, 0x000000, 0.9);
    this.scene.add(hemisphereLight);

    // Directional light for shadows
    const shadowLight = new DirectionalLight(0xffffff, 0.9);
    shadowLight.position.set(0, 350, 350);
    shadowLight.castShadow = true;

    // Shadow camera setup
    shadowLight.shadow.camera.left = -650;
    shadowLight.shadow.camera.right = 650;
    shadowLight.shadow.camera.top = 650;
    shadowLight.shadow.camera.bottom = -650;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    this.scene.add(shadowLight);
  }

  private setupWorld(): void {
    // Create sky with clouds
    this.sky = new Sky();
    this.sky.mesh.position.y = this.offSet;
    this.scene.add(this.sky.mesh);

    // Create land
    this.land = new Land();
    this.land.mesh.position.y = this.offSet;
    this.scene.add(this.land.mesh);

    // Create orbit container
    this.orbit = new Object3D();
    this.orbit.position.y = this.offSet;
    this.orbit.rotation.z = -Math.PI / 6;
    this.scene.add(this.orbit);

    // Create forest
    this.forest = new Forest();
    this.forest.mesh.position.y = this.offSet;
    this.scene.add(this.forest.mesh);

    // Create sun
    this.sun = new Sun();
    this.sun.mesh.scale.set(1, 1, 0.3);
    this.sun.mesh.position.set(0, -30, -850);
    this.scene.add(this.sun.mesh);

    // Create player airplane
    this.airplane = new AirPlane('normal');
    this.airplane.mesh.scale.set(0.35, 0.35, 0.35);
    this.airplane.mesh.position.set(-40, 110, -250);
    this.scene.add(this.airplane.mesh);
  }

  private setupEventListeners(): void {
    // Mouse movement for airplane control
    document.addEventListener('mousemove', (event) => {
      const WIDTH = window.innerWidth;
      const HEIGHT = window.innerHeight;
      const tx = -1 + (event.clientX / WIDTH) * 2;
      const ty = 1 - (event.clientY / HEIGHT) * 2;
      this.mousePos = { x: tx, y: ty };
    });

    // Window resize
    window.addEventListener('resize', () => {
      const HEIGHT = window.innerHeight;
      const WIDTH = window.innerWidth;
      this.renderer.setSize(WIDTH, HEIGHT);
      this.camera.aspect = WIDTH / HEIGHT;
      this.camera.updateProjectionMatrix();
    });
  }

  private normalize(v: number, vmin: number, vmax: number, tmin: number, tmax: number): number {
    const nv = Math.max(Math.min(v, vmax), vmin);
    const dv = vmax - vmin;
    const pc = (nv - vmin) / dv;
    const dt = tmax - tmin;
    const tv = tmin + pc * dt;
    return tv;
  }

  private updatePlane(): void {
    if (!this.gameActive) return;

    const targetY = this.normalize(this.mousePos.y, -0.75, 0.75, 50, 190);
    const targetX = this.normalize(this.mousePos.x, -0.75, 0.75, -100, -20);

    // Move the plane smoothly
    const moveSpeed = 0.1;
    this.airplane.mesh.position.y += (targetY - this.airplane.mesh.position.y) * moveSpeed;
    this.airplane.mesh.position.x += (targetX - this.airplane.mesh.position.x) * moveSpeed;

    // Rotate the plane based on movement
    this.airplane.mesh.rotation.z = (targetY - this.airplane.mesh.position.y) * 0.0128;
    this.airplane.mesh.rotation.x = (this.airplane.mesh.position.y - targetY) * 0.0064;
    this.airplane.mesh.rotation.y = (this.airplane.mesh.position.x - targetX) * 0.0064;

    // Spin the propeller
    this.airplane.propeller.rotation.x += 0.3;

    // CRITICAL FIX: Update frog position to be VISIBLE on top of plane
    if (this.frogOnPlane) {
      // Position frog directly on top of the plane, clearly visible
      this.frogOnPlane.position.copy(this.airplane.mesh.position);
      this.frogOnPlane.position.y += 40; // Much higher above the plane for visibility
      this.frogOnPlane.position.x += 15; // Forward on the plane
      
      // Make frog face the same direction as plane
      this.frogOnPlane.rotation.copy(this.airplane.mesh.rotation);
      
      console.log(`Frog position: ${this.frogOnPlane.position.x}, ${this.frogOnPlane.position.y}, ${this.frogOnPlane.position.z}`);
      console.log(`Plane position: ${this.airplane.mesh.position.x}, ${this.airplane.mesh.position.y}, ${this.airplane.mesh.position.z}`);
    }
  }

  private spawnFrogOnPlane(): void {
    // Remove existing frog if any
    if (this.frogOnPlane) {
      this.scene.remove(this.frogOnPlane.getMesh());
      this.frogOnPlane = null;
    }

    // Create new frog with random personality
    const personalities = ['dramatic', 'zen', 'chaotic', 'sleepy', 'confident', 'anxious', 'philosophical', 'rebellious'];
    const personality = personalities[Math.floor(Math.random() * personalities.length)] as any;
    
    this.frogOnPlane = new Frog(personality);
    
    // CRITICAL FIX: Make frog clearly visible and properly sized
    this.frogOnPlane.getMesh().scale.set(0.8, 0.8, 0.8); // Proper scale for visibility
    
    // Position frog on top of plane
    this.frogOnPlane.position.copy(this.airplane.mesh.position);
    this.frogOnPlane.position.y += 40; // High above plane for clear visibility
    this.frogOnPlane.position.x += 15; // Forward on the plane
    
    // Face same direction as plane
    this.frogOnPlane.rotation.copy(this.airplane.mesh.rotation);
    
    this.scene.add(this.frogOnPlane.getMesh());
    
    console.log(`SPAWNED ${personality} frog on plane at position: ${this.frogOnPlane.position.x}, ${this.frogOnPlane.position.y}, ${this.frogOnPlane.position.z}`);
    
    // Update personality display
    const personalityDisplay = document.getElementById('personality');
    if (personalityDisplay) {
      personalityDisplay.innerHTML = `🐸 ${personality.toUpperCase()} FROG ABOARD`;
    }
  }

  private spawnEnemyPlane(): void {
    // Random plane type with weighted probabilities
    const rand = Math.random();
    let planeType: PlaneType;
    
    if (rand < 0.4) planeType = 'normal';
    else if (rand < 0.55) planeType = 'destroyer';
    else if (rand < 0.65) planeType = 'super';
    else if (rand < 0.75) planeType = 'slowmo';
    else if (rand < 0.85) planeType = 'bouncy';
    else if (rand < 0.95) planeType = 'tiny';
    else planeType = 'giant';

    const enemyPlane = new EnemyPlane(planeType);
    enemyPlane.airplane.mesh.scale.set(0.35, 0.35, 0.35);
    enemyPlane.speed *= this.gameSpeed;
    
    this.enemyPlanes.push(enemyPlane);
    this.scene.add(enemyPlane.airplane.mesh);
    
    console.log(`SPAWNED ${planeType} enemy plane at: ${enemyPlane.airplane.mesh.position.x}, ${enemyPlane.airplane.mesh.position.y}, ${enemyPlane.airplane.mesh.position.z}`);
  }

  private updateEnemyPlanes(): void {
    const currentTime = Date.now();
    
    // Spawn new planes more frequently
    if (currentTime - this.lastPlaneSpawn > this.spawnInterval && this.gameActive) {
      this.spawnEnemyPlane();
      this.lastPlaneSpawn = currentTime;
      
      // Increase difficulty over time
      this.spawnInterval = Math.max(800, this.spawnInterval - 50);
    }

    // Update existing planes
    for (let i = this.enemyPlanes.length - 1; i >= 0; i--) {
      const enemyPlane = this.enemyPlanes[i];
      enemyPlane.update();

      // Check collision with player
      if (enemyPlane.checkCollision(this.airplane.mesh.position)) {
        this.handleCollision(enemyPlane);
        return;
      }

      // Remove inactive planes
      if (!enemyPlane.active) {
        this.scene.remove(enemyPlane.airplane.mesh);
        this.enemyPlanes.splice(i, 1);
        
        // Plane avoided - increase speed!
        this.planesAvoided++;
        this.gameSpeed += 0.2;
        
        // Dispatch event for UI update
        window.dispatchEvent(new CustomEvent('planeAvoided', { 
          detail: { 
            planesAvoided: this.planesAvoided, 
            speed: this.gameSpeed.toFixed(1),
            message: `🛩️ Plane avoided! Speed: ${this.gameSpeed.toFixed(1)}x | Avoided: ${this.planesAvoided}`
          } 
        }));
      }
    }
  }

  private handleCollision(enemyPlane: EnemyPlane): void {
    this.gameActive = false;
    
    // Remove enemy plane
    this.scene.remove(enemyPlane.airplane.mesh);
    const index = this.enemyPlanes.indexOf(enemyPlane);
    if (index > -1) {
      this.enemyPlanes.splice(index, 1);
    }

    // Handle different plane effects
    const effect = enemyPlane.airplane.effect;
    let launchPower = this.gameSpeed * 15;
    
    switch (effect.type) {
      case 'destroyer':
        window.dispatchEvent(new CustomEvent('frogDestroyed', { 
          detail: { 
            message: '💥 DESTROYER PLANE! Your frog was obliterated! No launch!',
            planesAvoided: this.planesAvoided,
            speed: this.gameSpeed.toFixed(1)
          } 
        }));
        this.resetGame();
        return;
        
      case 'super':
        launchPower *= 3;
        break;
        
      case 'slowmo':
        launchPower *= 0.5;
        break;
        
      case 'bouncy':
        break;
        
      case 'tiny':
        launchPower *= 0.7;
        break;
        
      case 'giant':
        launchPower *= 1.5;
        break;
    }

    // Launch the frog!
    this.launchFrogFromCrash(launchPower, effect);
  }

  private launchFrogFromCrash(power: number, effect: PlaneEffect): void {
    if (!this.frogOnPlane) return;

    // Remove frog from plane and make it full size
    this.frogOnPlane.getMesh().scale.set(1, 1, 1);
    
    // Apply special effects
    if (effect.type === 'bouncy') {
      this.frogOnPlane.applyEffect({ type: 'bouncy', duration: 10000, magnitude: 2 });
    } else if (effect.type === 'tiny') {
      this.frogOnPlane.applyEffect({ type: 'tiny', duration: 8000, magnitude: 0.5 });
    } else if (effect.type === 'giant') {
      this.frogOnPlane.applyEffect({ type: 'giant', duration: 8000, magnitude: 1 });
    } else if (effect.type === 'slowmo') {
      this.frogOnPlane.applyEffect({ type: 'glowing', duration: 6000, magnitude: 1 });
    } else if (effect.type === 'super') {
      this.frogOnPlane.applyEffect({ type: 'rainbow', duration: 5000, magnitude: 1 });
    }

    // Launch with calculated power
    const angle = (Math.random() - 0.5) * Math.PI * 0.3;
    this.frogOnPlane.launch(power, angle);
    
    this.currentFrog = this.frogOnPlane;
    this.frogs.push(this.frogOnPlane);
    this.frogOnPlane = null;

    // CRITICAL FIX: Start following the frog with camera
    this.cameraFollowingFrog = true;

    // Show crash message
    window.dispatchEvent(new CustomEvent('planeCrash', { 
      detail: { 
        message: `💥 ${effect.description.toUpperCase()}! Speed: ${this.gameSpeed.toFixed(1)}x | Avoided: ${this.planesAvoided}`,
        effect: effect.type,
        power: power.toFixed(1),
        planesAvoided: this.planesAvoided,
        speed: this.gameSpeed.toFixed(1)
      } 
    }));

    // Wait for frog to land, then calculate score and reset
    setTimeout(() => {
      if (this.currentFrog) {
        const score = this.currentFrog.getScore();
        window.dispatchEvent(new CustomEvent('gameOver', { 
          detail: { score, distance: Math.sqrt(this.currentFrog.position.x ** 2 + this.currentFrog.position.z ** 2) } 
        }));
      }
      // CRITICAL FIX: Reset game after 3 seconds instead of immediately
      setTimeout(() => {
        this.resetGame();
      }, 3000);
    }, 8000);
  }

  private resetGame(): void {
    // Reset game state
    this.gameActive = true;
    this.gameSpeed = 1;
    this.planesAvoided = 0;
    this.spawnInterval = 2000;
    this.lastPlaneSpawn = Date.now();
    this.cameraFollowingFrog = false;

    // Clear enemy planes
    this.enemyPlanes.forEach(plane => {
      this.scene.remove(plane.airplane.mesh);
    });
    this.enemyPlanes = [];

    // Clear flying frogs
    this.frogs.forEach(frog => {
      this.scene.remove(frog.getMesh());
    });
    this.frogs = [];
    this.currentFrog = null;

    // CRITICAL FIX: Always spawn new frog on plane after reset
    this.spawnFrogOnPlane();

    // Reset camera to airplane view
    this.resetCamera();

    window.dispatchEvent(new CustomEvent('gameReset', { 
      detail: { message: '🛩️ New frog ready for takeoff! Avoid the incoming planes!' } 
    }));
  }

  private updateCamera(): void {
    if (this.cameraFollowingFrog && this.currentFrog && this.currentFrog.isFlying) {
      // CRITICAL FIX: Follow the flying frog with smooth camera movement
      const frogPos = this.currentFrog.position;
      const targetCameraPos = new Vector3(
        frogPos.x - 50,  // Behind the frog
        frogPos.y + 30,  // Above the frog
        frogPos.z + 50   // To the side
      );
      
      // Smooth camera movement
      this.camera.position.lerp(targetCameraPos, 0.05);
      this.camera.lookAt(frogPos);
      
      console.log(`Camera following frog at: ${frogPos.x}, ${frogPos.y}, ${frogPos.z}`);
    } else if (!this.cameraFollowingFrog) {
      // Return to airplane view
      const targetPos = new Vector3(0, 150, 100);
      this.camera.position.lerp(targetPos, 0.02);
      this.camera.lookAt(0, 0, 0);
    }
  }

  private startRenderLoop(): void {
    const animate = () => {
      // Rotate world elements
      const worldSpeed = Math.max(0.3, 1 / this.gameSpeed);
      this.land.mesh.rotation.z += 0.005 * worldSpeed;
      this.orbit.rotation.z += 0.001 * worldSpeed;
      this.sky.mesh.rotation.z += 0.003 * worldSpeed;
      this.forest.mesh.rotation.z += 0.005 * worldSpeed;

      // Update airplane
      this.updatePlane();

      // Update enemy planes
      this.updateEnemyPlanes();

      // Update frogs
      this.updateFrogs();

      // CRITICAL FIX: Update camera to follow frog
      this.updateCamera();

      // Render the scene
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(animate);
    };
    animate();
  }

  private updateFrogs(): void {
    const deltaTime = this.clock.getDelta() * 1000;
    
    this.frogs.forEach((frog, index) => {
      if (frog.isFlying) {
        const landed = frog.update(
          deltaTime,
          this.config.launch.gravity,
          this.config.launch.bounceDecay
        );
        
        if (landed) {
          console.log(`Frog ${index} landed with score: ${frog.getScore()}`);
          // Stop following when frog lands
          if (frog === this.currentFrog) {
            this.cameraFollowingFrog = false;
          }
        }
      }
    });
  }

  public render(): void {
    // This method is called by the game loop
    // The actual rendering is handled in the animation loop
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public add(object: any): void {
    this.scene.add(object);
  }

  public remove(object: any): void {
    this.scene.remove(object);
  }

  public followFrog(frogPosition: Vector3): void {
    // In the airplane world, we don't follow the frog with the camera
    // The camera stays fixed to show the beautiful world
  }

  public resetCamera(): void {
    // Reset camera to default airplane world position
    this.camera.position.set(0, 150, 100);
    this.camera.lookAt(0, 0, 0);
  }

  // Legacy method for compatibility
  public launchFrogFromPlane(frog: Frog, power: number, angle: number): void {
    // This is now handled by the crash system
    console.log('Legacy launch method called - using new crash system instead');
  }

  // Get the airplane position for frog launching
  public getAirplanePosition(): Vector3 {
    return this.airplane.mesh.position.clone();
  }

  // Get current game stats
  public getGameStats(): { speed: number; planesAvoided: number; active: boolean } {
    return {
      speed: this.gameSpeed,
      planesAvoided: this.planesAvoided,
      active: this.gameActive
    };
  }
}