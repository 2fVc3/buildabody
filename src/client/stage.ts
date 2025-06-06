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
} from 'three';
import type { PostConfig } from '../shared/types/postConfig';

export class Stage {
  private container: HTMLElement;
  private scene: Scene;
  private renderer!: WebGLRenderer;
  private camera!: OrthographicCamera;
  private originalCameraPosition: Vector3;
  private sceneryObjects: Mesh[] = [];
  private currentDistance: number = 0;
  private lastSceneryUpdate: number = 0;

  private config: PostConfig;

  constructor(config: PostConfig, devicePixelRatio: number) {
    this.config = config;
    this.container = document.getElementById('game') as HTMLElement;
    this.scene = new Scene();

    this.setupRenderer(devicePixelRatio);
    this.setupCamera();
    this.setupLights();
    this.setupEnvironment();
    this.setupDynamicFog();
    
    this.originalCameraPosition = this.camera.position.clone();
  }

  public render(): void {
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
      alpha: false,
    });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setClearColor(parseInt(this.config.background.skyColor, 16), 1);
    this.container.appendChild(this.renderer.domElement);
  }

  private setupCamera(): void {
    const { near, far, position, lookAt } = this.config.camera;
    this.camera = new OrthographicCamera();
    this.camera.near = near;
    this.camera.far = far;
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
  }

  private setupLights(): void {
    // Directional light
    const { color, intensity, position } = this.config.light.directional;
    const directionalLight = new DirectionalLight(parseInt(color, 16), intensity);
    directionalLight.position.set(position.x, position.y, position.z);
    this.add(directionalLight);

    // Ambient light
    const ambientLight = new AmbientLight(
      parseInt(this.config.light.ambient.color, 16), 
      this.config.light.ambient.intensity
    );
    this.add(ambientLight);
  }

  private setupDynamicFog(): void {
    // Start with no fog, will be updated based on distance
    this.scene.fog = new Fog(0x87CEEB, 50, 200);
  }

  private setupEnvironment(): void {
    // Ground plane - will change color based on distance
    const groundGeometry = new PlaneGeometry(1000, 1000);
    const groundMaterial = new MeshLambertMaterial({ 
      color: parseInt(this.config.background.groundColor, 16) 
    });
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    this.add(ground);

    // Launch pad
    const padGeometry = new CylinderGeometry(2, 2, 0.2, 16);
    const padMaterial = new MeshLambertMaterial({ color: 0x8B4513 });
    const launchPad = new Mesh(padGeometry, padMaterial);
    launchPad.position.set(0, 0.1, 0);
    this.add(launchPad);

    // Initial close scenery
    this.createCloseScenery();
  }

  private createCloseScenery(): void {
    // Lily pads around the launch area
    for (let i = 0; i < 8; i++) {
      const lilyPadGeometry = new CylinderGeometry(1, 1, 0.1, 8);
      const lilyPadMaterial = new MeshLambertMaterial({ color: 0x228B22 });
      const lilyPad = new Mesh(lilyPadGeometry, lilyPadMaterial);
      
      const angle = (i / 8) * Math.PI * 2;
      const distance = 15 + Math.random() * 10;
      lilyPad.position.set(
        Math.cos(angle) * distance,
        0.05,
        Math.sin(angle) * distance
      );
      this.add(lilyPad);
    }

    // Some normal rocks near spawn
    for (let i = 0; i < 12; i++) {
      const rockGeometry = new BoxGeometry(
        0.5 + Math.random() * 1,
        0.3 + Math.random() * 0.5,
        0.5 + Math.random() * 1
      );
      const rockMaterial = new MeshLambertMaterial({ color: 0x696969 });
      const rock = new Mesh(rockGeometry, rockMaterial);
      
      rock.position.set(
        (Math.random() - 0.5) * 40,
        0.2,
        (Math.random() - 0.5) * 40
      );
      rock.rotation.y = Math.random() * Math.PI * 2;
      this.add(rock);
    }
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

    // Update distance and scenery
    const distance = Math.sqrt(frogPosition.x ** 2 + frogPosition.z ** 2);
    this.updateSceneryBasedOnDistance(distance, frogPosition);
  }

  private updateSceneryBasedOnDistance(distance: number, frogPosition: Vector3): void {
    this.currentDistance = distance;
    
    // Update scenery every 20 units to avoid performance issues
    if (distance - this.lastSceneryUpdate > 20) {
      this.createDistanceBasedScenery(distance, frogPosition);
      this.lastSceneryUpdate = distance;
    }

    // Update environment colors and effects
    this.updateEnvironmentEffects(distance);
  }

  private updateEnvironmentEffects(distance: number): void {
    // Change sky color based on distance - gets more surreal
    let skyColor: Color;
    let fogColor: Color;
    
    if (distance < 50) {
      // Normal sky
      skyColor = new Color(0x87CEEB); // Sky blue
      fogColor = new Color(0x87CEEB);
    } else if (distance < 100) {
      // Sunset colors
      skyColor = new Color(0xFF6B6B); // Coral
      fogColor = new Color(0xFF6B6B);
    } else if (distance < 200) {
      // Purple twilight
      skyColor = new Color(0x9370DB); // Medium purple
      fogColor = new Color(0x9370DB);
    } else if (distance < 300) {
      // Green alien world
      skyColor = new Color(0x32CD32); // Lime green
      fogColor = new Color(0x32CD32);
    } else if (distance < 500) {
      // Pink candy land
      skyColor = new Color(0xFF69B4); // Hot pink
      fogColor = new Color(0xFF69B4);
    } else if (distance < 750) {
      // Orange dream world
      skyColor = new Color(0xFF4500); // Orange red
      fogColor = new Color(0xFF4500);
    } else {
      // Rainbow chaos - cycling colors
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
    // Clean up old scenery that's too far away
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
    // Normal trees and bushes
    for (let i = 0; i < 3; i++) {
      const treeGeometry = new CylinderGeometry(0.5, 1, 4, 8);
      const treeMaterial = new MeshLambertMaterial({ color: 0x8B4513 });
      const tree = new Mesh(treeGeometry, treeMaterial);
      
      tree.position.set(
        frogPosition.x + (Math.random() - 0.5) * 60,
        2,
        frogPosition.z + (Math.random() - 0.5) * 60
      );
      
      this.add(tree);
      this.sceneryObjects.push(tree);
    }
  }

  private createWeirdScenery(frogPosition: Vector3): void {
    // Floating cubes and weird shapes
    for (let i = 0; i < 4; i++) {
      const weirdGeometry = new BoxGeometry(2, 2, 2);
      const weirdMaterial = new MeshLambertMaterial({ 
        color: Math.random() * 0xFFFFFF 
      });
      const weirdCube = new Mesh(weirdGeometry, weirdMaterial);
      
      weirdCube.position.set(
        frogPosition.x + (Math.random() - 0.5) * 80,
        3 + Math.random() * 5, // Floating
        frogPosition.z + (Math.random() - 0.5) * 80
      );
      
      weirdCube.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      this.add(weirdCube);
      this.sceneryObjects.push(weirdCube);
      
      // Add floating animation
      new Tween(weirdCube.position)
        .to({ y: weirdCube.position.y + 2 }, 2000)
        .easing(Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .start();
    }
  }

  private createSurrealScenery(frogPosition: Vector3): void {
    // Giant mushrooms and impossible structures
    for (let i = 0; i < 3; i++) {
      const stemGeometry = new CylinderGeometry(1, 1.5, 6, 8);
      const stemMaterial = new MeshLambertMaterial({ color: 0xF5DEB3 });
      const stem = new Mesh(stemGeometry, stemMaterial);
      
      const capGeometry = new SphereGeometry(4, 16, 8);
      const capMaterial = new MeshLambertMaterial({ 
        color: [0xFF0000, 0xFF69B4, 0x9370DB][i % 3] 
      });
      const cap = new Mesh(capGeometry, capMaterial);
      
      stem.position.set(
        frogPosition.x + (Math.random() - 0.5) * 100,
        3,
        frogPosition.z + (Math.random() - 0.5) * 100
      );
      
      cap.position.copy(stem.position);
      cap.position.y += 6;
      cap.scale.y = 0.5; // Flatten the cap
      
      this.add(stem);
      this.add(cap);
      this.sceneryObjects.push(stem, cap);
    }
  }

  private createAlienScenery(frogPosition: Vector3): void {
    // Crystalline structures and alien plants
    for (let i = 0; i < 5; i++) {
      const crystalGeometry = new ConeGeometry(1, 8, 6);
      const crystalMaterial = new MeshLambertMaterial({ 
        color: 0x00FFFF,
        transparent: true,
        opacity: 0.8
      });
      const crystal = new Mesh(crystalGeometry, crystalMaterial);
      
      crystal.position.set(
        frogPosition.x + (Math.random() - 0.5) * 120,
        4,
        frogPosition.z + (Math.random() - 0.5) * 120
      );
      
      crystal.rotation.z = (Math.random() - 0.5) * Math.PI * 0.5;
      
      this.add(crystal);
      this.sceneryObjects.push(crystal);
      
      // Glowing effect
      crystalMaterial.emissive.setHex(0x004444);
    }
  }

  private createCandyLandScenery(frogPosition: Vector3): void {
    // Giant lollipops and candy structures
    for (let i = 0; i < 4; i++) {
      const stickGeometry = new CylinderGeometry(0.2, 0.2, 8, 8);
      const stickMaterial = new MeshLambertMaterial({ color: 0xFFFFFF });
      const stick = new Mesh(stickGeometry, stickMaterial);
      
      const candyGeometry = new CylinderGeometry(3, 3, 1, 16);
      const candyMaterial = new MeshLambertMaterial({ 
        color: [0xFF1493, 0x00FF00, 0xFFFF00, 0xFF4500][i % 4]
      });
      const candy = new Mesh(candyGeometry, candyMaterial);
      
      stick.position.set(
        frogPosition.x + (Math.random() - 0.5) * 140,
        4,
        frogPosition.z + (Math.random() - 0.5) * 140
      );
      
      candy.position.copy(stick.position);
      candy.position.y += 6;
      
      this.add(stick);
      this.add(candy);
      this.sceneryObjects.push(stick, candy);
      
      // Spinning candy
      new Tween(candy.rotation)
        .to({ y: Math.PI * 2 }, 3000)
        .repeat(Infinity)
        .start();
    }
  }

  private createDreamWorldScenery(frogPosition: Vector3): void {
    // Floating islands and impossible geometry
    for (let i = 0; i < 3; i++) {
      const islandGeometry = new SphereGeometry(6, 16, 8);
      const islandMaterial = new MeshLambertMaterial({ color: 0x8FBC8F });
      const island = new Mesh(islandGeometry, islandMaterial);
      
      island.position.set(
        frogPosition.x + (Math.random() - 0.5) * 160,
        10 + Math.random() * 10,
        frogPosition.z + (Math.random() - 0.5) * 160
      );
      
      island.scale.y = 0.3; // Flatten to make it island-like
      
      this.add(island);
      this.sceneryObjects.push(island);
      
      // Add some trees on the island
      for (let j = 0; j < 3; j++) {
        const treeGeometry = new ConeGeometry(1, 4, 8);
        const treeMaterial = new MeshLambertMaterial({ color: 0x228B22 });
        const tree = new Mesh(treeGeometry, treeMaterial);
        
        tree.position.set(
          island.position.x + (Math.random() - 0.5) * 8,
          island.position.y + 2,
          island.position.z + (Math.random() - 0.5) * 8
        );
        
        this.add(tree);
        this.sceneryObjects.push(tree);
      }
      
      // Floating animation
      new Tween(island.position)
        .to({ y: island.position.y + 3 }, 4000)
        .easing(Easing.Sinusoidal.InOut)
        .yoyo(true)
        .repeat(Infinity)
        .start();
    }
  }

  private createChaosRealmScenery(frogPosition: Vector3): void {
    // Complete madness - everything is possible
    for (let i = 0; i < 6; i++) {
      const geometries = [
        new TorusGeometry(3, 1, 8, 16),
        new SphereGeometry(4, 8, 6),
        new BoxGeometry(6, 2, 6),
        new ConeGeometry(2, 10, 4),
        new CylinderGeometry(1, 3, 8, 3)
      ];
      
      const geometry = geometries[Math.floor(Math.random() * geometries.length)]!;
      const material = new MeshLambertMaterial({ 
        color: Math.random() * 0xFFFFFF,
        transparent: true,
        opacity: 0.7 + Math.random() * 0.3
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
      
      this.add(chaosObject);
      this.sceneryObjects.push(chaosObject);
      
      // Rainbow color cycling
      const startTime = Date.now();
      const colorInterval = setInterval(() => {
        const time = (Date.now() - startTime) * 0.001;
        const hue = (time * 0.5 + i * 0.1) % 1;
        material.color.setHSL(hue, 0.8, 0.6);
        material.emissive.setHSL(hue, 0.3, 0.2);
      }, 100);
      
      // Chaotic movement
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
      
      // Chaotic rotation
      new Tween(chaosObject.rotation)
        .to({
          x: chaosObject.rotation.x + Math.PI * 4,
          y: chaosObject.rotation.y + Math.PI * 6,
          z: chaosObject.rotation.z + Math.PI * 2
        }, 5000 + Math.random() * 3000)
        .repeat(Infinity)
        .start();
      
      // Clean up interval when object is removed
      setTimeout(() => {
        clearInterval(colorInterval);
      }, 30000);
    }
  }

  private cleanupDistantScenery(frogPosition: Vector3): void {
    // Remove scenery objects that are too far away to improve performance
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
    
    // Reset scenery tracking
    this.currentDistance = 0;
    this.lastSceneryUpdate = 0;
    
    // Reset environment to normal
    this.renderer.setClearColor(parseInt(this.config.background.skyColor, 16));
    if (this.scene.fog) {
      (this.scene.fog as Fog).color = new Color(0x87CEEB);
      (this.scene.fog as Fog).near = 50;
      (this.scene.fog as Fog).far = 200;
    }
  }
}