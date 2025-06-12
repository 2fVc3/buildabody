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
  Group,
  Color,
  MeshLambertMaterial
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
  // Environment colors
  nightBlue: 0x1a1a2e,
  darkGreen: 0x16213e,
  snowWhite: 0xf0f8ff,
  mountainGray: 0x696969,
  desertSand: 0xf4a460,
  desertRock: 0x8b4513,
  cactusGreen: 0x228b22,
  moonWhite: 0xf5f5dc,
  starYellow: 0xffff99
};

// Environment types
type EnvironmentType = 'day' | 'sunset' | 'night' | 'snowy' | 'desert';

interface EnvironmentConfig {
  type: EnvironmentType;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  skyColor: number;
  groundColor: number;
  sunColor: number;
  lightColor: number;
  lightIntensity: number;
  ambientColor: number;
  ambientIntensity: number;
}

const ENVIRONMENTS: Record<EnvironmentType, EnvironmentConfig> = {
  day: {
    type: 'day',
    fogColor: 0xf7d9aa,
    fogNear: 100,
    fogFar: 950,
    skyColor: 0x87ceeb,
    groundColor: Colors.lightgreen,
    sunColor: Colors.yellow,
    lightColor: 0xffffff,
    lightIntensity: 0.9,
    ambientColor: 0xaaaaaa,
    ambientIntensity: 0.9
  },
  sunset: {
    type: 'sunset',
    fogColor: 0xff6b35,
    fogNear: 80,
    fogFar: 800,
    skyColor: 0xff4500,
    groundColor: 0x8b4513,
    sunColor: 0xff4500,
    lightColor: 0xff6b35,
    lightIntensity: 0.7,
    ambientColor: 0xff8c69,
    ambientIntensity: 0.6
  },
  night: {
    type: 'night',
    fogColor: Colors.nightBlue,
    fogNear: 60,
    fogFar: 600,
    skyColor: Colors.nightBlue,
    groundColor: Colors.darkGreen,
    sunColor: Colors.moonWhite,
    lightColor: 0x4169e1,
    lightIntensity: 0.4,
    ambientColor: 0x191970,
    ambientIntensity: 0.3
  },
  snowy: {
    type: 'snowy',
    fogColor: 0xe6f3ff,
    fogNear: 50,
    fogFar: 700,
    skyColor: 0xb0c4de,
    groundColor: Colors.snowWhite,
    sunColor: 0xe0e0e0,
    lightColor: 0xb0e0e6,
    lightIntensity: 0.8,
    ambientColor: 0xf0f8ff,
    ambientIntensity: 0.7
  },
  desert: {
    type: 'desert',
    fogColor: 0xffd700,
    fogNear: 70,
    fogFar: 900,
    skyColor: 0xffa500,
    groundColor: Colors.desertSand,
    sunColor: 0xffd700,
    lightColor: 0xffa500,
    lightIntensity: 1.2,
    ambientColor: 0xffe4b5,
    ambientIntensity: 0.8
  }
};

class Land {
  mesh: Mesh;
  material: MeshPhongMaterial;

  constructor() {
    const geom = new CylinderGeometry(600, 600, 1700, 40, 10);
    geom.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2));
    this.material = new MeshPhongMaterial({
      color: Colors.lightgreen,
      flatShading: true,
    });
    this.mesh = new Mesh(geom, this.material);
    this.mesh.receiveShadow = true;
  }

  updateEnvironment(env: EnvironmentConfig): void {
    this.material.color.setHex(env.groundColor);
  }
}

class Sun {
  mesh: Object3D;
  sunMesh: Mesh;
  material: MeshPhongMaterial;
  stars: Mesh[] = [];

  constructor() {
    this.mesh = new Object3D();
    const sunGeom = new SphereGeometry(400, 20, 10);
    this.material = new MeshPhongMaterial({
      color: Colors.yellow,
      flatShading: true,
    });
    this.sunMesh = new Mesh(sunGeom, this.material);
    this.sunMesh.castShadow = false;
    this.sunMesh.receiveShadow = false;
    this.mesh.add(this.sunMesh);

    // Create stars for night environment
    this.createStars();
  }

  private createStars(): void {
    const starGeom = new SphereGeometry(5, 6, 4);
    const starMat = new MeshBasicMaterial({ color: Colors.starYellow });

    for (let i = 0; i < 50; i++) {
      const star = new Mesh(starGeom, starMat);
      star.position.set(
        (Math.random() - 0.5) * 2000,
        Math.random() * 500 + 200,
        (Math.random() - 0.5) * 2000
      );
      star.visible = false;
      this.stars.push(star);
      this.mesh.add(star);
    }
  }

  updateEnvironment(env: EnvironmentConfig): void {
    this.material.color.setHex(env.sunColor);
    
    // Show/hide stars based on environment
    const showStars = env.type === 'night';
    this.stars.forEach(star => {
      star.visible = showStars;
      if (showStars) {
        star.material.opacity = 0.8 + Math.random() * 0.2;
      }
    });

    // Adjust sun position and scale for different environments
    if (env.type === 'night') {
      this.sunMesh.scale.set(0.6, 0.6, 0.6); // Smaller moon
      this.mesh.position.set(200, -50, -850); // Lower position
    } else if (env.type === 'sunset') {
      this.sunMesh.scale.set(1.2, 1.2, 1.2); // Larger sunset sun
      this.mesh.position.set(100, -100, -850); // Lower for sunset
    } else {
      this.sunMesh.scale.set(1, 1, 1); // Normal size
      this.mesh.position.set(0, -30, -850); // Normal position
    }
  }
}

class Cloud {
  mesh: Object3D;
  materials: MeshPhongMaterial[] = [];

  constructor() {
    this.mesh = new Object3D();
    const geom = new DodecahedronGeometry(20, 0);

    const nBlocs = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < nBlocs; i++) {
      const mat = new MeshPhongMaterial({
        color: Colors.white,
      });
      this.materials.push(mat);

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

  updateEnvironment(env: EnvironmentConfig): void {
    let cloudColor = Colors.white;
    
    switch (env.type) {
      case 'sunset':
        cloudColor = 0xff69b4; // Pink clouds
        break;
      case 'night':
        cloudColor = 0x2f2f2f; // Dark clouds
        break;
      case 'snowy':
        cloudColor = 0xf0f8ff; // Snow clouds
        break;
      case 'desert':
        cloudColor = 0xffefd5; // Sandy clouds
        break;
      default:
        cloudColor = Colors.white;
    }

    this.materials.forEach(mat => {
      mat.color.setHex(cloudColor);
    });
  }
}

class Sky {
  mesh: Object3D;
  nClouds: number;
  clouds: Cloud[] = [];

  constructor() {
    this.mesh = new Object3D();
    this.nClouds = 25;
    const stepAngle = (Math.PI * 2) / this.nClouds;

    for (let i = 0; i < this.nClouds; i++) {
      const c = new Cloud();
      this.clouds.push(c);
      
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

  updateEnvironment(env: EnvironmentConfig): void {
    this.clouds.forEach(cloud => cloud.updateEnvironment(env));
  }
}

class Tree {
  mesh: Object3D;
  leaveMaterial: MeshPhongMaterial;
  trunkMaterial: MeshBasicMaterial;

  constructor() {
    this.mesh = new Object3D();

    this.leaveMaterial = new MeshPhongMaterial({
      color: Colors.green,
      flatShading: true,
    });

    const geonTreeBase = new BoxGeometry(10, 20, 10);
    this.trunkMaterial = new MeshBasicMaterial({ color: Colors.brown });
    const treeBase = new Mesh(geonTreeBase, this.trunkMaterial);
    treeBase.castShadow = true;
    treeBase.receiveShadow = true;
    this.mesh.add(treeBase);

    const geomTreeLeaves1 = new CylinderGeometry(1, 12 * 3, 12 * 3, 4);
    const treeLeaves1 = new Mesh(geomTreeLeaves1, this.leaveMaterial);
    treeLeaves1.castShadow = true;
    treeLeaves1.receiveShadow = true;
    treeLeaves1.position.y = 20;
    this.mesh.add(treeLeaves1);

    const geomTreeLeaves2 = new CylinderGeometry(1, 9 * 3, 9 * 3, 4);
    const treeLeaves2 = new Mesh(geomTreeLeaves2, this.leaveMaterial);
    treeLeaves2.castShadow = true;
    treeLeaves2.position.y = 40;
    treeLeaves2.receiveShadow = true;
    this.mesh.add(treeLeaves2);

    const geomTreeLeaves3 = new CylinderGeometry(1, 6 * 3, 6 * 3, 4);
    const treeLeaves3 = new Mesh(geomTreeLeaves3, this.leaveMaterial);
    treeLeaves3.castShadow = true;
    treeLeaves3.position.y = 55;
    treeLeaves3.receiveShadow = true;
    this.mesh.add(treeLeaves3);
  }

  updateEnvironment(env: EnvironmentConfig): void {
    switch (env.type) {
      case 'snowy':
        this.leaveMaterial.color.setHex(0x2e8b57); // Darker green for winter
        this.trunkMaterial.color.setHex(0x654321); // Darker brown
        break;
      case 'desert':
        // Trees become cacti in desert
        this.leaveMaterial.color.setHex(Colors.cactusGreen);
        this.trunkMaterial.color.setHex(Colors.cactusGreen);
        break;
      case 'night':
        this.leaveMaterial.color.setHex(0x006400); // Dark green
        this.trunkMaterial.color.setHex(0x2f1b14); // Dark brown
        break;
      default:
        this.leaveMaterial.color.setHex(Colors.green);
        this.trunkMaterial.color.setHex(Colors.brown);
    }
  }
}

class Flower {
  mesh: Object3D;
  stemMaterial: MeshPhongMaterial;
  petalMaterials: MeshBasicMaterial[] = [];

  constructor() {
    this.mesh = new Object3D();

    const geomStem = new BoxGeometry(5, 50, 5, 1, 1, 1);
    this.stemMaterial = new MeshPhongMaterial({
      color: Colors.green,
      flatShading: true,
    });
    const stem = new Mesh(geomStem, this.stemMaterial);
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
    this.petalMaterials.push(matPetal);

    geomPetal.translate(12.5, 0, 3);

    const petals = [];
    for (let i = 0; i < 4; i++) {
      const petalMat = new MeshBasicMaterial({ color: petalColor });
      this.petalMaterials.push(petalMat);
      petals[i] = new Mesh(geomPetal, petalMat);
      petals[i].rotation.z = (i * Math.PI) / 2;
      petals[i].castShadow = true;
      petals[i].receiveShadow = true;
    }

    petalCore.add(petals[0], petals[1], petals[2], petals[3]);
    petalCore.position.y = 25;
    petalCore.position.z = 3;
    this.mesh.add(petalCore);
  }

  updateEnvironment(env: EnvironmentConfig): void {
    switch (env.type) {
      case 'snowy':
        // Flowers become snow-covered
        this.stemMaterial.color.setHex(0x2e8b57);
        this.petalMaterials.forEach(mat => mat.color.setHex(Colors.snowWhite));
        break;
      case 'desert':
        // Flowers become desert plants
        this.stemMaterial.color.setHex(Colors.cactusGreen);
        this.petalMaterials.forEach(mat => mat.color.setHex(0xff6347)); // Desert flower
        break;
      case 'night':
        this.stemMaterial.color.setHex(0x006400);
        this.petalMaterials.forEach(mat => {
          const currentColor = mat.color.getHex();
          mat.color.setHex(currentColor & 0x7f7f7f); // Darken colors
        });
        break;
      default:
        this.stemMaterial.color.setHex(Colors.green);
        // Keep original petal colors for day/sunset
    }
  }
}

class Forest {
  mesh: Object3D;
  nTrees: number;
  nFlowers: number;
  trees: Tree[] = [];
  flowers: Flower[] = [];

  constructor() {
    this.mesh = new Object3D();
    this.nTrees = 300;
    let stepAngle = (Math.PI * 2) / this.nTrees;

    // Create Trees
    for (let i = 0; i < this.nTrees; i++) {
      const t = new Tree();
      this.trees.push(t);
      
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
      this.flowers.push(f);
      
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

  updateEnvironment(env: EnvironmentConfig): void {
    this.trees.forEach(tree => tree.updateEnvironment(env));
    this.flowers.forEach(flower => flower.updateEnvironment(env));
  }
}

// Snow particle system for snowy environment
class SnowSystem {
  mesh: Object3D;
  particles: Mesh[] = [];

  constructor() {
    this.mesh = new Object3D();
    this.createSnowParticles();
  }

  private createSnowParticles(): void {
    const snowGeom = new SphereGeometry(2, 6, 4);
    const snowMat = new MeshBasicMaterial({ 
      color: Colors.snowWhite,
      transparent: true,
      opacity: 0.8
    });

    for (let i = 0; i < 200; i++) {
      const snowflake = new Mesh(snowGeom, snowMat);
      snowflake.position.set(
        (Math.random() - 0.5) * 2000,
        Math.random() * 1000 + 200,
        (Math.random() - 0.5) * 2000
      );
      this.particles.push(snowflake);
      this.mesh.add(snowflake);
    }
  }

  update(): void {
    this.particles.forEach(particle => {
      particle.position.y -= 2;
      particle.position.x += Math.sin(Date.now() * 0.001 + particle.position.z) * 0.5;
      
      if (particle.position.y < -100) {
        particle.position.y = 1000;
        particle.position.x = (Math.random() - 0.5) * 2000;
        particle.position.z = (Math.random() - 0.5) * 2000;
      }
    });
  }

  setVisible(visible: boolean): void {
    this.mesh.visible = visible;
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
    
    // CRITICAL FIX: Spawn planes at multiple height levels to match player movement range
    const heightLevels = [
      50,   // Bottom level (where player can go)
      80,   // Lower middle
      110,  // Center level (default player height)
      140,  // Upper middle  
      190   // Top level (where player can go)
    ];
    
    const randomHeight = heightLevels[Math.floor(Math.random() * heightLevels.length)];
    
    this.airplane.mesh.position.set(
      300 + Math.random() * 200,  // Far ahead of player
      randomHeight,               // CRITICAL: Random height from player movement range
      -250                        // Same Z position as player plane
    );
    
    // Face towards player (opposite direction)
    this.airplane.mesh.rotation.y = Math.PI;
    
    console.log(`SPAWNED ${planeType} enemy plane at height: ${randomHeight} (Y: ${this.airplane.mesh.position.y})`);
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
  private snowSystem: SnowSystem;

  // Lighting
  private hemisphereLight: HemisphereLight;
  private shadowLight: DirectionalLight;

  // Environment management
  private currentEnvironment: EnvironmentType = 'day';
  private gameStartTime: number = 0;
  private environmentTransitionTime: number = 0;
  private isTransitioning: boolean = false;

  // Game elements
  private frogOnPlane: Frog | null = null;
  private enemyPlanes: EnemyPlane[] = [];
  private gameSpeed: number = 1;
  private planesAvoided: number = 0;
  private gameActive: boolean = false; // CRITICAL FIX: Start as false
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
    // CRITICAL FIX: Don't spawn frog until game starts
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
    // CRITICAL FIX: Perfect camera position to see the airplane clearly like in the image
    this.camera.position.set(-100, 200, 100); // Behind and above the airplane
    this.camera.lookAt(-40, 110, -250); // Look at the airplane position
  }

  private setupLights(): void {
    // Hemisphere light for ambient lighting
    this.hemisphereLight = new HemisphereLight(0xaaaaaa, 0x000000, 0.9);
    this.scene.add(this.hemisphereLight);

    // Directional light for shadows
    this.shadowLight = new DirectionalLight(0xffffff, 0.9);
    this.shadowLight.position.set(0, 350, 350);
    this.shadowLight.castShadow = true;

    // Shadow camera setup
    this.shadowLight.shadow.camera.left = -650;
    this.shadowLight.shadow.camera.right = 650;
    this.shadowLight.shadow.camera.top = 650;
    this.shadowLight.shadow.camera.bottom = -650;
    this.shadowLight.shadow.camera.near = 1;
    this.shadowLight.shadow.camera.far = 1000;
    this.shadowLight.shadow.mapSize.width = 2048;
    this.shadowLight.shadow.mapSize.height = 2048;

    this.scene.add(this.shadowLight);
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

    // Create snow system
    this.snowSystem = new SnowSystem();
    this.snowSystem.setVisible(false);
    this.scene.add(this.snowSystem.mesh);

    // Create player airplane
    this.airplane = new AirPlane('normal');
    this.airplane.mesh.scale.set(0.35, 0.35, 0.35);
    this.airplane.mesh.position.set(-40, 110, -250);
    this.scene.add(this.airplane.mesh);

    // Set initial environment
    this.updateEnvironment('day');
  }

  private updateEnvironment(newEnv: EnvironmentType): void {
    if (this.currentEnvironment === newEnv) return;

    console.log(`🌍 Environment changing from ${this.currentEnvironment} to ${newEnv}`);
    
    this.currentEnvironment = newEnv;
    const envConfig = ENVIRONMENTS[newEnv];
    
    // Update fog
    this.scene.fog = new Fog(envConfig.fogColor, envConfig.fogNear, envConfig.fogFar);
    
    // Update lighting
    this.hemisphereLight.color.setHex(envConfig.ambientColor);
    this.hemisphereLight.intensity = envConfig.ambientIntensity;
    this.shadowLight.color.setHex(envConfig.lightColor);
    this.shadowLight.intensity = envConfig.lightIntensity;
    
    // Update world elements
    this.land.updateEnvironment(envConfig);
    this.sky.updateEnvironment(envConfig);
    this.forest.updateEnvironment(envConfig);
    this.sun.updateEnvironment(envConfig);
    
    // Handle special environment effects
    this.snowSystem.setVisible(newEnv === 'snowy');
    
    // Dispatch environment change event for UI
    window.dispatchEvent(new CustomEvent('environmentChange', { 
      detail: { 
        environment: newEnv,
        message: this.getEnvironmentMessage(newEnv)
      } 
    }));
  }

  private getEnvironmentMessage(env: EnvironmentType): string {
    const messages = {
      day: '☀️ Beautiful day for flying!',
      sunset: '🌅 Flying into the sunset!',
      night: '🌙 Night flight under the stars!',
      snowy: '❄️ Winter wonderland ahead!',
      desert: '🏜️ Soaring over the desert!'
    };
    return messages[env];
  }

  private checkEnvironmentTransition(): void {
    if (!this.gameActive) return;

    const gameTime = Date.now() - this.gameStartTime;
    const timeInSeconds = gameTime / 1000;
    
    // Environment progression based on game time
    let targetEnv: EnvironmentType = 'day';
    
    if (timeInSeconds > 60) { // 1 minute
      targetEnv = 'desert';
    } else if (timeInSeconds > 45) { // 45 seconds
      targetEnv = 'snowy';
    } else if (timeInSeconds > 30) { // 30 seconds
      targetEnv = 'night';
    } else if (timeInSeconds > 15) { // 15 seconds
      targetEnv = 'sunset';
    }
    
    if (targetEnv !== this.currentEnvironment) {
      this.updateEnvironment(targetEnv);
    }
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
      this.frogOnPlane.position.y += 20; // Perfect height above the plane for visibility
      this.frogOnPlane.position.x += 10; // Forward on the plane
      
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
    this.frogOnPlane.getMesh().scale.set(1.2, 1.2, 1.2); // Perfect scale for visibility
    
    // Position frog on top of plane
    this.frogOnPlane.position.copy(this.airplane.mesh.position);
    this.frogOnPlane.position.y += 20; // Perfect height above plane for clear visibility
    this.frogOnPlane.position.x += 10; // Forward on the plane
    
    // Face same direction as plane
    this.frogOnPlane.rotation.copy(this.airplane.mesh.rotation);
    
    this.scene.add(this.frogOnPlane.getMesh());
    
    console.log(`SPAWNED ${personality} frog on plane at position: ${this.frogOnPlane.position.x}, ${this.frogOnPlane.position.y}, ${this.frogOnPlane.position.z}`);
    
    // Update personality display and auto-hide after 3 seconds
    const personalityDisplay = document.getElementById('personality');
    if (personalityDisplay) {
      personalityDisplay.innerHTML = `🐸 ${personality.toUpperCase()} FROG ABOARD`;
      personalityDisplay.style.opacity = '1'; // Show it
      
      // CRITICAL FIX: Auto-hide personality text after 3 seconds
      setTimeout(() => {
        if (personalityDisplay) {
          personalityDisplay.style.opacity = '0';
        }
      }, 3000);
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
    this.gameActive = false; // CRITICAL FIX: Don't auto-start
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

    // CRITICAL FIX: Don't spawn frog until game starts again
    if (this.frogOnPlane) {
      this.scene.remove(this.frogOnPlane.getMesh());
      this.frogOnPlane = null;
    }

    // Reset environment to day
    this.updateEnvironment('day');

    // Reset camera to airplane view
    this.resetCamera();

    window.dispatchEvent(new CustomEvent('gameReset', { 
      detail: { message: '🛩️ Ready for another Froggy Flight adventure!' } 
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
      // CRITICAL FIX: Return to perfect airplane view like in the image
      const targetPos = new Vector3(-100, 200, 100); // Behind and above airplane
      const targetLookAt = new Vector3(-40, 110, -250); // Look at airplane
      
      this.camera.position.lerp(targetPos, 0.02);
      this.camera.lookAt(targetLookAt);
    }
  }

  private startRenderLoop(): void {
    const animate = () => {
      // Check for environment transitions
      this.checkEnvironmentTransition();

      // Update snow system if active
      if (this.currentEnvironment === 'snowy') {
        this.snowSystem.update();
      }

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
    // CRITICAL FIX: Reset camera to perfect airplane view like in the image
    this.camera.position.set(-100, 200, 100); // Behind and above airplane
    this.camera.lookAt(-40, 110, -250); // Look at airplane position
  }

  // CRITICAL FIX: Method to start the game
  public startGame(): void {
    this.gameActive = true;
    this.gameStartTime = Date.now(); // Track game start time for environment changes
    this.spawnFrogOnPlane();
    console.log('GAME STARTED - Frog spawned and game active');
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
