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
  Clock
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

    // Modify vertices for petal shape
    const vertices = geomPetal.attributes.position.array;
    // Note: In newer Three.js, vertex manipulation is different
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

class AirPlane {
  mesh: Object3D;
  propeller: Mesh;

  constructor() {
    this.mesh = new Object3D();

    // Create the cabin
    const geomCockpit = new BoxGeometry(80, 50, 50, 1, 1, 1);
    const matCockpit = new MeshPhongMaterial({
      color: Colors.red,
      flatShading: true,
    });

    // Modify vertices for cockpit shape
    const vertices = geomCockpit.attributes.position.array;
    // Note: In newer Three.js, vertex manipulation is different
    
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
      color: Colors.red,
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
      color: Colors.red,
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
      color: Colors.red,
      flatShading: true,
    });
    const suspension = new Mesh(suspensionGeom, suspensionMat);
    suspension.position.set(-35, -5, 0);
    suspension.rotation.z = -0.3;
    this.mesh.add(suspension);
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

  // Mouse tracking
  private mousePos = { x: 0, y: 0 };
  private offSet = -600;

  // Frog management
  private frogs: Frog[] = [];
  private currentFrog: Frog | null = null;

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

    // Create airplane
    this.airplane = new AirPlane();
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
    const targetY = this.normalize(this.mousePos.y, -0.75, 0.75, 50, 190);
    const targetX = this.normalize(this.mousePos.x, -0.75, 0.75, -100, -20);

    // Move the plane smoothly
    this.airplane.mesh.position.y += (targetY - this.airplane.mesh.position.y) * 0.1;
    this.airplane.mesh.position.x += (targetX - this.airplane.mesh.position.x) * 0.1;

    // Rotate the plane based on movement
    this.airplane.mesh.rotation.z = (targetY - this.airplane.mesh.position.y) * 0.0128;
    this.airplane.mesh.rotation.x = (this.airplane.mesh.position.y - targetY) * 0.0064;
    this.airplane.mesh.rotation.y = (this.airplane.mesh.position.x - targetX) * 0.0064;

    // Spin the propeller
    this.airplane.propeller.rotation.x += 0.3;
  }

  private startRenderLoop(): void {
    const animate = () => {
      // Rotate world elements
      this.land.mesh.rotation.z += 0.005;
      this.orbit.rotation.z += 0.001;
      this.sky.mesh.rotation.z += 0.003;
      this.forest.mesh.rotation.z += 0.005;

      // Update airplane
      this.updatePlane();

      // Update frogs
      this.updateFrogs();

      // Render the scene
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(animate);
    };
    animate();
  }

  private updateFrogs(): void {
    const deltaTime = this.clock.getDelta() * 1000; // Convert to milliseconds
    
    this.frogs.forEach((frog, index) => {
      if (frog.isFlying) {
        const landed = frog.update(
          deltaTime,
          this.config.launch.gravity,
          this.config.launch.bounceDecay
        );
        
        if (landed) {
          // Frog has landed, handle scoring etc.
          console.log(`Frog ${index} landed with score: ${frog.getScore()}`);
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
    // But we could add some camera shake or effects here
  }

  public resetCamera(): void {
    // Reset camera to default airplane world position
    this.camera.position.set(0, 150, 100);
    this.camera.lookAt(0, 0, 0);
  }

  // Method to launch a frog from the airplane
  public launchFrogFromPlane(frog: Frog, power: number, angle: number): void {
    // Position the frog at the airplane's position
    const planePos = this.airplane.mesh.position.clone();
    frog.position.copy(planePos);
    
    // Add the frog to the scene
    this.scene.add(frog.getMesh());
    this.frogs.push(frog);
    this.currentFrog = frog;
    
    // Launch the frog with the specified power and angle
    frog.launch(power, angle);
    
    console.log('🛩️ Frog launched from airplane! 🐸');
  }

  // Get the airplane position for frog launching
  public getAirplanePosition(): Vector3 {
    return this.airplane.mesh.position.clone();
  }
}