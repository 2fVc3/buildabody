import { Easing, Tween } from '@tweenjs/tween.js';
import {
  AmbientLight,
  DirectionalLight,
  Object3D,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
  PlaneGeometry,
  MeshLambertMaterial,
  Mesh,
  Vector3,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  ConeGeometry,
  TorusGeometry,
  Color,
  Fog,
  Clock,
  ShaderMaterial,
  PCFSoftShadowMap,
  ACESFilmicToneMapping,
  MeshPhongMaterial,
  DodecahedronGeometry,
  HemisphereLight,
  Matrix4,
  MeshBasicMaterial
} from 'three';
import type { PostConfig } from '../shared/types/postConfig';
import { EnvironmentEffects } from './environmentEffects';

// Beautiful low-poly colors inspired by the airplane game
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

export class Stage {
  private container: HTMLElement;
  private scene: Scene;
  private renderer!: WebGLRenderer;
  private camera!: OrthographicCamera;
  private originalCameraPosition: Vector3;
  private sceneryObjects: Mesh[] = [];
  private currentDistance: number = 0;
  private lastSceneryUpdate: number = 0;
  private clock: Clock;
  
  // Beautiful low-poly world elements
  private land!: Mesh;
  private sky!: Object3D;
  private forest!: Object3D;
  private environmentEffects!: EnvironmentEffects;

  private config: PostConfig;

  constructor(config: PostConfig, devicePixelRatio: number) {
    this.config = config;
    this.container = document.getElementById('world') as HTMLElement;
    this.scene = new Scene();
    this.clock = new Clock();

    this.setupRenderer(devicePixelRatio);
    this.setupCamera();
    this.setupLights();
    this.setupWorld();
    this.setupEnvironmentEffects();
    
    this.originalCameraPosition = this.camera.position.clone();
  }

  public render(): void {
    const time = this.clock.getElapsedTime();
    
    // Rotate the beautiful low-poly world
    if (this.land) {
      this.land.rotation.z += 0.005;
    }
    if (this.sky) {
      this.sky.rotation.z += 0.003;
    }
    if (this.forest) {
      this.forest.rotation.z += 0.005;
    }
    
    // Update environment effects
    this.environmentEffects.update(time);
    
    this.renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number): void {
    const aspect = width / height;
    const { viewSize } = this.config.camera;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public add(object: Object3D): void {
    this.scene.add(object);
  }

  public remove(object: Object3D): void {
    this.scene.remove(object);
  }

  private setupRenderer(devicePixelRatio: number): void {
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);
  }

  private setupCamera(): void {
    const { near, far, position, lookAt } = this.config.camera;
    this.camera = new OrthographicCamera();
    this.camera.near = near;
    this.camera.far = far;
    this.camera.position.set(0, 150, 100);
    this.camera.lookAt(0, 0, 0);
  }

  private setupLights(): void {
    // Beautiful gradient lighting like the airplane game
    const hemisphereLight = new HemisphereLight(0xaaaaaa, 0x000000, 0.9);
    this.scene.add(hemisphereLight);

    // Directional shadow light
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

    // Add beautiful fog effect
    this.scene.fog = new Fog(0xf7d9aa, 100, 950);
  }

  private setupWorld(): void {
    this.createLand();
    this.createSky();
    this.createForest();
    this.createLaunchPad();
  }

  private createLand(): void {
    // Beautiful cylindrical land like the airplane game
    const geom = new CylinderGeometry(600, 600, 1700, 40, 10);
    geom.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2));
    
    const mat = new MeshPhongMaterial({
      color: Colors.lightgreen,
      flatShading: true,
    });

    this.land = new Mesh(geom, mat);
    this.land.receiveShadow = true;
    this.land.position.y = -600; // Offset like the original
    this.scene.add(this.land);
  }

  private createSky(): void {
    this.sky = new Object3D();
    
    // Create beautiful clouds
    const nClouds = 25;
    const stepAngle = Math.PI * 2 / nClouds;

    for (let i = 0; i < nClouds; i++) {
      const cloud = this.createCloud();
      
      const a = stepAngle * i;
      const h = 800 + Math.random() * 200;
      cloud.position.y = Math.sin(a) * h;
      cloud.position.x = Math.cos(a) * h;
      cloud.rotation.z = a + Math.PI / 2;
      cloud.position.z = -400 - Math.random() * 400;
      
      const s = 1 + Math.random() * 2;
      cloud.scale.set(s, s, s);
      
      this.sky.add(cloud);
    }
    
    this.sky.position.y = -600;
    this.scene.add(this.sky);
  }

  private createCloud(): Object3D {
    const mesh = new Object3D();
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
      mesh.add(m);
    }

    return mesh;
  }

  private createForest(): void {
    this.forest = new Object3D();

    // Create beautiful trees
    const nTrees = 300;
    const stepAngle = Math.PI * 2 / nTrees;

    for (let i = 0; i < nTrees; i++) {
      const tree = this.createTree();
      
      const a = stepAngle * i;
      const h = 605;
      tree.position.y = Math.sin(a) * h;
      tree.position.x = Math.cos(a) * h;
      tree.rotation.z = a + (Math.PI / 2) * 3;
      tree.position.z = 0 - Math.random() * 600;
      
      const s = 0.3 + Math.random() * 0.75;
      tree.scale.set(s, s, s);
      
      this.forest.add(tree);
    }

    // Add beautiful flowers
    const nFlowers = 350;
    const flowerStepAngle = Math.PI * 2 / nFlowers;

    for (let i = 0; i < nFlowers; i++) {
      const flower = this.createFlower();
      
      const a = flowerStepAngle * i;
      const h = 605;
      flower.position.y = Math.sin(a) * h;
      flower.position.x = Math.cos(a) * h;
      flower.rotation.z = a + (Math.PI / 2) * 3;
      flower.position.z = 0 - Math.random() * 600;
      
      const s = 0.1 + Math.random() * 0.3;
      flower.scale.set(s, s, s);
      
      this.forest.add(flower);
    }

    this.forest.position.y = -600;
    this.scene.add(this.forest);
  }

  private createTree(): Object3D {
    const mesh = new Object3D();

    const matTreeLeaves = new MeshPhongMaterial({ 
      color: Colors.green, 
      flatShading: true 
    });

    // Tree base
    const geonTreeBase = new BoxGeometry(10, 20, 10);
    const matTreeBase = new MeshBasicMaterial({ color: Colors.brown });
    const treeBase = new Mesh(geonTreeBase, matTreeBase);
    treeBase.castShadow = true;
    treeBase.receiveShadow = true;
    mesh.add(treeBase);

    // Tree leaves layers
    const geomTreeLeaves1 = new CylinderGeometry(1, 12 * 3, 12 * 3, 4);
    const treeLeaves1 = new Mesh(geomTreeLeaves1, matTreeLeaves);
    treeLeaves1.castShadow = true;
    treeLeaves1.receiveShadow = true;
    treeLeaves1.position.y = 20;
    mesh.add(treeLeaves1);

    const geomTreeLeaves2 = new CylinderGeometry(1, 9 * 3, 9 * 3, 4);
    const treeLeaves2 = new Mesh(geomTreeLeaves2, matTreeLeaves);
    treeLeaves2.castShadow = true;
    treeLeaves2.position.y = 40;
    treeLeaves2.receiveShadow = true;
    mesh.add(treeLeaves2);

    const geomTreeLeaves3 = new CylinderGeometry(1, 6 * 3, 6 * 3, 4);
    const treeLeaves3 = new Mesh(geomTreeLeaves3, matTreeLeaves);
    treeLeaves3.castShadow = true;
    treeLeaves3.position.y = 55;
    treeLeaves3.receiveShadow = true;
    mesh.add(treeLeaves3);

    return mesh;
  }

  private createFlower(): Object3D {
    const mesh = new Object3D();

    // Flower stem
    const geomStem = new BoxGeometry(5, 50, 5, 1, 1, 1);
    const matStem = new MeshPhongMaterial({ 
      color: Colors.green, 
      flatShading: true 
    });
    const stem = new Mesh(geomStem, matStem);
    stem.castShadow = false;
    stem.receiveShadow = true;
    mesh.add(stem);

    // Flower center
    const geomPetalCore = new BoxGeometry(10, 10, 10, 1, 1, 1);
    const matPetalCore = new MeshPhongMaterial({
      color: Colors.yellow, 
      flatShading: true
    });
    const petalCore = new Mesh(geomPetalCore, matPetalCore);
    petalCore.castShadow = false;
    petalCore.receiveShadow = true;

    // Flower petals
    const petalColors = [Colors.red, Colors.yellow, Colors.blue];
    const petalColor = petalColors[Math.floor(Math.random() * 3)];

    const geomPetal = new BoxGeometry(15, 20, 5, 1, 1, 1);
    const matPetal = new MeshBasicMaterial({ color: petalColor });
    
    // Modify petal shape
    const vertices = geomPetal.attributes.position.array;
    // Note: In newer Three.js, we'd need to access vertices differently
    // This is simplified for the low-poly aesthetic
    
    geomPetal.translate(12.5, 0, 3);

    const petals = [];
    for (let i = 0; i < 4; i++) {
      petals[i] = new Mesh(geomPetal, matPetal);
      petals[i].rotation.z = i * Math.PI / 2;
      petals[i].castShadow = true;
      petals[i].receiveShadow = true;
    }

    petalCore.add(petals[0], petals[1], petals[2], petals[3]);
    petalCore.position.y = 25;
    petalCore.position.z = 3;
    mesh.add(petalCore);

    return mesh;
  }

  private createLaunchPad(): void {
    // Beautiful launch pad for the frogs
    const padGeometry = new CylinderGeometry(3, 3, 0.5, 16);
    const padMaterial = new MeshPhongMaterial({ 
      color: Colors.brown,
      flatShading: true
    });
    const launchPad = new Mesh(padGeometry, padMaterial);
    launchPad.position.set(0, 0.25, 0);
    launchPad.castShadow = true;
    launchPad.receiveShadow = true;
    this.add(launchPad);
  }

  private setupEnvironmentEffects(): void {
    this.environmentEffects = new EnvironmentEffects(this.scene);
  }

  public followFrog(frogPosition: Vector3): void {
    const targetPosition = new Vector3(
      frogPosition.x + this.config.camera.position.x,
      Math.max(this.config.camera.position.y, frogPosition.y + 5),
      frogPosition.z + this.config.camera.position.z
    );

    new Tween(this.camera.position)
      .to(targetPosition, 100)
      .easing(Easing.Linear.None)
      .start();

    const distance = Math.sqrt(frogPosition.x ** 2 + frogPosition.z ** 2);
    this.updateSceneryBasedOnDistance(distance, frogPosition);
    
    this.environmentEffects.createDistanceBasedEffects(distance, frogPosition);
  }

  private updateSceneryBasedOnDistance(distance: number, frogPosition: Vector3): void {
    this.currentDistance = distance;
    
    if (distance - this.lastSceneryUpdate > 20) {
      this.createDistanceBasedScenery(distance, frogPosition);
      this.lastSceneryUpdate = distance;
    }

    this.updateEnvironmentEffects(distance);
  }

  private updateEnvironmentEffects(distance: number): void {
    // Change the world colors based on distance like the original game
    let skyColor: Color;
    let fogColor: Color;
    
    if (distance < 50) {
      skyColor = new Color(0xf7d9aa);
      fogColor = new Color(0xf7d9aa);
    } else if (distance < 100) {
      skyColor = new Color(0xFF6B6B);
      fogColor = new Color(0xFF6B6B);
    } else if (distance < 200) {
      skyColor = new Color(0x9370DB);
      fogColor = new Color(0x9370DB);
    } else if (distance < 300) {
      skyColor = new Color(0x32CD32);
      fogColor = new Color(0x32CD32);
    } else if (distance < 500) {
      skyColor = new Color(0xFF69B4);
      fogColor = new Color(0xFF69B4);
    } else if (distance < 750) {
      skyColor = new Color(0xFF4500);
      fogColor = new Color(0xFF4500);
    } else {
      const time = Date.now() * 0.001;
      const hue = (time * 0.1) % 1;
      skyColor = new Color().setHSL(hue, 0.8, 0.6);
      fogColor = new Color().setHSL(hue, 0.8, 0.4);
    }

    this.renderer.setClearColor(skyColor);
    if (this.scene.fog) {
      (this.scene.fog as Fog).color = fogColor;
      (this.scene.fog as Fog).near = Math.max(20, 100 - distance * 0.1);
      (this.scene.fog as Fog).far = Math.max(50, 200 - distance * 0.2);
    }
  }

  private createDistanceBasedScenery(distance: number, frogPosition: Vector3): void {
    this.cleanupDistantScenery(frogPosition);

    if (distance < 50) {
      this.createNormalScenery(frogPosition);
    } else if (distance < 100) {
      this.createWeirdScenery(frogPosition);
    } else if (distance < 200) {
      this.createSurrealScenery(frogPosition);
    } else if (distance < 300) {
      this.createAlienScenery(frogPosition);
    } else if (distance < 500) {
      this.createCandyLandScenery(frogPosition);
    } else if (distance < 750) {
      this.createDreamWorldScenery(frogPosition);
    } else {
      this.createChaosRealmScenery(frogPosition);
    }
  }

  private createNormalScenery(frogPosition: Vector3): void {
    for (let i = 0; i < 3; i++) {
      const tree = this.createTree();
      
      tree.position.set(
        frogPosition.x + (Math.random() - 0.5) * 60,
        2,
        frogPosition.z + (Math.random() - 0.5) * 60
      );
      tree.castShadow = true;
      tree.receiveShadow = true;
      
      this.add(tree);
      this.sceneryObjects.push(tree as any);
    }
  }

  private createWeirdScenery(frogPosition: Vector3): void {
    for (let i = 0; i < 4; i++) {
      const weirdGeometry = new BoxGeometry(2, 2, 2);
      const weirdMaterial = new MeshPhongMaterial({ 
        color: new Color().setHSL(Math.random(), 0.8, 0.6),
        flatShading: true
      });
      const weirdCube = new Mesh(weirdGeometry, weirdMaterial);
      
      weirdCube.position.set(
        frogPosition.x + (Math.random() - 0.5) * 80,
        3 + Math.random() * 5,
        frogPosition.z + (Math.random() - 0.5) * 80
      );
      
      weirdCube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      weirdCube.castShadow = true;
      this.add(weirdCube);
      this.sceneryObjects.push(weirdCube);
      
      new Tween(weirdCube.position)
        .to({ y: weirdCube.position.y + 2 }, 2000)
        .easing(Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .start();
        
      new Tween(weirdCube.rotation)
        .to({ 
          x: weirdCube.rotation.x + Math.PI * 2,
          y: weirdCube.rotation.y + Math.PI * 2,
          z: weirdCube.rotation.z + Math.PI * 2
        }, 4000)
        .repeat(Infinity)
        .start();
    }
  }

  private createSurrealScenery(frogPosition: Vector3): void {
    for (let i = 0; i < 3; i++) {
      const stemGeometry = new CylinderGeometry(1, 1.5, 6, 8);
      const stemMaterial = new MeshPhongMaterial({ 
        color: 0xF5DEB3,
        flatShading: true
      });
      const stem = new Mesh(stemGeometry, stemMaterial);
      
      const capGeometry = new SphereGeometry(4, 16, 8);
      const capMaterial = new MeshPhongMaterial({ 
        color: [0xFF0000, 0xFF69B4, 0x9370DB][i % 3],
        flatShading: true
      });
      const cap = new Mesh(capGeometry, capMaterial);
      
      stem.position.set(
        frogPosition.x + (Math.random() - 0.5) * 100,
        3,
        frogPosition.z + (Math.random() - 0.5) * 100
      );
      
      cap.position.copy(stem.position);
      cap.position.y += 6;
      cap.scale.y = 0.5;
      
      stem.castShadow = true;
      stem.receiveShadow = true;
      cap.castShadow = true;
      cap.receiveShadow = true;
      
      this.add(stem);
      this.add(cap);
      this.sceneryObjects.push(stem, cap);
    }
  }

  private createAlienScenery(frogPosition: Vector3): void {
    for (let i = 0; i < 5; i++) {
      const crystalGeometry = new ConeGeometry(1, 8, 6);
      const crystalMaterial = new MeshPhongMaterial({ 
        color: 0x00FFFF,
        flatShading: true,
        emissive: new Color(0x004444)
      });
      const crystal = new Mesh(crystalGeometry, crystalMaterial);
      
      crystal.position.set(
        frogPosition.x + (Math.random() - 0.5) * 120,
        4,
        frogPosition.z + (Math.random() - 0.5) * 120
      );
      
      crystal.rotation.z = (Math.random() - 0.5) * Math.PI * 0.5;
      crystal.castShadow = true;
      
      this.add(crystal);
      this.sceneryObjects.push(crystal);
    }
  }

  private createCandyLandScenery(frogPosition: Vector3): void {
    for (let i = 0; i < 4; i++) {
      const stickGeometry = new CylinderGeometry(0.2, 0.2, 8, 8);
      const stickMaterial = new MeshPhongMaterial({ 
        color: 0xFFFFFF,
        flatShading: true
      });
      const stick = new Mesh(stickGeometry, stickMaterial);
      
      const candyGeometry = new CylinderGeometry(3, 3, 1, 16);
      const candyMaterial = new MeshPhongMaterial({ 
        color: [0xFF1493, 0x00FF00, 0xFFFF00, 0xFF4500][i % 4],
        flatShading: true
      });
      const candy = new Mesh(candyGeometry, candyMaterial);
      
      stick.position.set(
        frogPosition.x + (Math.random() - 0.5) * 140,
        4,
        frogPosition.z + (Math.random() - 0.5) * 140
      );
      
      candy.position.copy(stick.position);
      candy.position.y += 6;
      
      stick.castShadow = true;
      candy.castShadow = true;
      
      this.add(stick);
      this.add(candy);
      this.sceneryObjects.push(stick, candy);
      
      new Tween(candy.rotation)
        .to({ y: Math.PI * 2 }, 3000)
        .repeat(Infinity)
        .start();
    }
  }

  private createDreamWorldScenery(frogPosition: Vector3): void {
    for (let i = 0; i < 3; i++) {
      const islandGeometry = new SphereGeometry(6, 16, 8);
      const islandMaterial = new MeshPhongMaterial({ 
        color: 0x8FBC8F,
        flatShading: true
      });
      const island = new Mesh(islandGeometry, islandMaterial);
      
      island.position.set(
        frogPosition.x + (Math.random() - 0.5) * 160,
        10 + Math.random() * 10,
        frogPosition.z + (Math.random() - 0.5) * 160
      );
      
      island.scale.y = 0.3;
      island.castShadow = true;
      
      this.add(island);
      this.sceneryObjects.push(island);
      
      for (let j = 0; j < 3; j++) {
        const treeGeometry = new ConeGeometry(1, 4, 8);
        const treeMaterial = new MeshPhongMaterial({ 
          color: 0x228B22,
          flatShading: true
        });
        const tree = new Mesh(treeGeometry, treeMaterial);
        
        tree.position.set(
          island.position.x + (Math.random() - 0.5) * 8,
          island.position.y + 2,
          island.position.z + (Math.random() - 0.5) * 8
        );
        
        tree.castShadow = true;
        this.add(tree);
        this.sceneryObjects.push(tree);
      }
      
      new Tween(island.position)
        .to({ y: island.position.y + 3 }, 4000)
        .easing(Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .start();
    }
  }

  private createChaosRealmScenery(frogPosition: Vector3): void {
    for (let i = 0; i < 6; i++) {
      const geometries = [
        new TorusGeometry(3, 1, 8, 16),
        new SphereGeometry(4, 8, 6),
        new BoxGeometry(6, 2, 6),
        new ConeGeometry(2, 10, 4),
        new CylinderGeometry(1, 3, 8, 3)
      ];
      
      const geometry = geometries[Math.floor(Math.random() * geometries.length)]!;
      const material = new MeshPhongMaterial({ 
        color: new Color().setHSL(Math.random(), 0.8, 0.6),
        flatShading: true,
        emissive: new Color().setHSL(Math.random(), 0.3, 0.2)
      });
      
      const chaosObject = new Mesh(geometry, material);
      
      chaosObject.position.set(
        frogPosition.x + (Math.random() - 0.5) * 200,
        Math.random() * 20,
        frogPosition.z + (Math.random() - 0.5) * 200
      );
      
      chaosObject.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      chaosObject.scale.setScalar(0.5 + Math.random() * 2);
      chaosObject.castShadow = true;
      
      this.add(chaosObject);
      this.sceneryObjects.push(chaosObject);
      
      new Tween(chaosObject.position)
        .to({
          x: chaosObject.position.x + (Math.random() - 0.5) * 40,
          y: chaosObject.position.y + (Math.random() - 0.5) * 20,
          z: chaosObject.position.z + (Math.random() - 0.5) * 40
        }, 3000 + Math.random() * 2000)
        .easing(Easing.Elastic.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .start();
      
      new Tween(chaosObject.rotation)
        .to({
          x: chaosObject.rotation.x + Math.PI * 4,
          y: chaosObject.rotation.y + Math.PI * 6,
          z: chaosObject.rotation.z + Math.PI * 2
        }, 5000 + Math.random() * 3000)
        .repeat(Infinity)
        .start();
    }
  }

  private cleanupDistantScenery(frogPosition: Vector3): void {
    this.sceneryObjects = this.sceneryObjects.filter(obj => {
      const distance = obj.position.distanceTo(frogPosition);
      if (distance > 300) {
        this.remove(obj);
        return false;
      }
      return true;
    });
  }

  public resetCamera(): void {
    new Tween(this.camera.position)
      .to(this.originalCameraPosition, 1000)
      .easing(Easing.Cubic.Out)
      .start();
    
    this.currentDistance = 0;
    this.lastSceneryUpdate = 0;
    
    this.renderer.setClearColor(0xf7d9aa);
    if (this.scene.fog) {
      (this.scene.fog as Fog).color = new Color(0xf7d9aa);
      (this.scene.fog as Fog).near = 100;
      (this.scene.fog as Fog).far = 950;
    }
  }
}