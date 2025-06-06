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
  MeshPhysicalMaterial,
  BackSide
} from 'three';
import type { PostConfig } from '../shared/types/postConfig';
import { Water } from './water';
import { ProceduralTerrain } from './proceduralTerrain';
import { EnvironmentEffects } from './environmentEffects';

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
  
  // Enhanced visual elements
  private water!: Water;
  private terrain!: ProceduralTerrain;
  private skyMesh!: Mesh;
  private environmentEffects!: EnvironmentEffects;

  private config: PostConfig;

  constructor(config: PostConfig, devicePixelRatio: number) {
    this.config = config;
    this.container = document.getElementById('game') as HTMLElement;
    this.scene = new Scene();
    this.clock = new Clock();

    this.setupRenderer(devicePixelRatio);
    this.setupCamera();
    this.setupLights();
    this.setupTerrain();
    this.setupWater();
    this.setupSky();
    this.setupEnvironment();
    this.setupEnvironmentEffects();
    this.setupDynamicFog();
    
    this.originalCameraPosition = this.camera.position.clone();
  }

  public render(): void {
    const time = this.clock.getElapsedTime();
    
    // Update water animation
    this.water.update();
    
    // Update terrain
    this.terrain.update(time);
    
    // Update sky shader
    if (this.skyMesh.material instanceof ShaderMaterial) {
      this.skyMesh.material.uniforms.time.value = time;
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
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor(0x87CEEB, 1);
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
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
  }

  private setupLights(): void {
    const { color, intensity, position } = this.config.light.directional;
    const directionalLight = new DirectionalLight(parseInt(color, 16), intensity);
    directionalLight.position.set(position.x, position.y, position.z);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.add(directionalLight);

    const ambientLight = new AmbientLight(
      parseInt(this.config.light.ambient.color, 16), 
      this.config.light.ambient.intensity
    );
    this.add(ambientLight);
  }

  private setupTerrain(): void {
    this.terrain = new ProceduralTerrain();
    this.add(this.terrain.getMesh());
  }

  private setupWater(): void {
    this.water = new Water();
    this.add(this.water.getMesh());
  }

  private setupSky(): void {
    const skyGeometry = new SphereGeometry(800, 32, 16);
    const skyMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        sunPosition: { value: new Vector3(0, 1, 0) },
        skyColor: { value: new Color(0x87CEEB) },
        horizonColor: { value: new Color(0xFFE4B5) },
        sunColor: { value: new Color(0xFFFFAA) },
        cloudiness: { value: 0.3 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 sunPosition;
        uniform vec3 skyColor;
        uniform vec3 horizonColor;
        uniform vec3 sunColor;
        uniform float cloudiness;
        
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        
        float noise(vec2 p) {
          return sin(p.x * 10.0) * sin(p.y * 10.0);
        }
        
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for(int i = 0; i < 4; i++) {
            value += amplitude * noise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return value;
        }
        
        void main() {
          vec3 direction = normalize(vWorldPosition);
          float elevation = direction.y;
          
          vec3 color = mix(horizonColor, skyColor, max(0.0, elevation));
          
          float sunDistance = distance(direction, normalize(sunPosition));
          float sunIntensity = 1.0 - smoothstep(0.0, 0.1, sunDistance);
          color = mix(color, sunColor, sunIntensity * 0.8);
          
          float sunGlow = 1.0 - smoothstep(0.0, 0.3, sunDistance);
          color += sunColor * sunGlow * 0.3;
          
          vec2 cloudUv = direction.xz / (direction.y + 0.1) + time * 0.01;
          float cloudNoise = fbm(cloudUv * 2.0 + time * 0.02);
          cloudNoise = smoothstep(0.4, 0.8, cloudNoise);
          
          vec3 cloudColor = mix(vec3(1.0), vec3(0.8, 0.8, 0.9), elevation);
          color = mix(color, cloudColor, cloudNoise * cloudiness);
          
          float scatter = pow(max(0.0, 1.0 - elevation), 2.0);
          color = mix(color, horizonColor, scatter * 0.3);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: BackSide
    });
    
    this.skyMesh = new Mesh(skyGeometry, skyMaterial);
    this.add(this.skyMesh);
  }

  private setupEnvironmentEffects(): void {
    this.environmentEffects = new EnvironmentEffects(this.scene);
  }

  private setupDynamicFog(): void {
    this.scene.fog = new Fog(0x87CEEB, 50, 200);
  }

  private setupEnvironment(): void {
    // Launch pad
    const padGeometry = new CylinderGeometry(2, 2, 0.2, 16);
    const padMaterial = new MeshLambertMaterial({ 
      color: 0x8B4513,
      transparent: true,
      opacity: 0.9
    });
    const launchPad = new Mesh(padGeometry, padMaterial);
    launchPad.position.set(0, 0.1, 0);
    launchPad.castShadow = true;
    launchPad.receiveShadow = true;
    this.add(launchPad);

    this.createEnhancedLilyPads();
    this.createEnhancedRocks();
    this.createWaterPlants();
  }

  private createEnhancedLilyPads(): void {
    for (let i = 0; i < 12; i++) {
      const lilyPadGeometry = new CylinderGeometry(1.2, 1, 0.1, 8);
      const lilyPadMaterial = new MeshLambertMaterial({ 
        color: new Color().setHSL(0.3, 0.6, 0.4),
        transparent: true,
        opacity: 0.8
      });
      const lilyPad = new Mesh(lilyPadGeometry, lilyPadMaterial);
      
      const angle = (i / 12) * Math.PI * 2;
      const distance = 15 + Math.random() * 15;
      lilyPad.position.set(
        Math.cos(angle) * distance,
        0.05,
        Math.sin(angle) * distance
      );
      lilyPad.rotation.y = Math.random() * Math.PI * 2;
      lilyPad.castShadow = true;
      lilyPad.receiveShadow = true;
      this.add(lilyPad);
      
      if (Math.random() < 0.4) {
        const flowerGeometry = new ConeGeometry(0.3, 0.5, 6);
        const flowerMaterial = new MeshLambertMaterial({ 
          color: new Color().setHSL(Math.random() * 0.1 + 0.9, 0.8, 0.8)
        });
        const flower = new Mesh(flowerGeometry, flowerMaterial);
        flower.position.copy(lilyPad.position);
        flower.position.y += 0.3;
        flower.castShadow = true;
        this.add(flower);
      }
    }
  }

  private createEnhancedRocks(): void {
    for (let i = 0; i < 20; i++) {
      const rockSize = 0.3 + Math.random() * 1.2;
      const rockGeometry = new BoxGeometry(
        rockSize,
        rockSize * 0.6,
        rockSize * 0.8
      );
      
      const rockHue = 0.1 + Math.random() * 0.1;
      const rockMaterial = new MeshLambertMaterial({ 
        color: new Color().setHSL(rockHue, 0.2, 0.3 + Math.random() * 0.2)
      });
      
      const rock = new Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        (Math.random() - 0.5) * 60,
        rockSize * 0.3,
        (Math.random() - 0.5) * 60
      );
      rock.rotation.set(
        (Math.random() - 0.5) * 0.4,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.4
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.add(rock);
    }
  }

  private createWaterPlants(): void {
    for (let i = 0; i < 15; i++) {
      const stemGeometry = new CylinderGeometry(0.05, 0.08, 2 + Math.random() * 2, 6);
      const stemMaterial = new MeshLambertMaterial({ 
        color: new Color().setHSL(0.25, 0.7, 0.3)
      });
      const stem = new Mesh(stemGeometry, stemMaterial);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 8 + Math.random() * 25;
      stem.position.set(
        Math.cos(angle) * distance,
        1,
        Math.sin(angle) * distance
      );
      stem.rotation.z = (Math.random() - 0.5) * 0.3;
      stem.castShadow = true;
      this.add(stem);
      
      if (Math.random() < 0.6) {
        const cattailGeometry = new CylinderGeometry(0.15, 0.1, 0.8, 8);
        const cattailMaterial = new MeshLambertMaterial({ 
          color: new Color().setHSL(0.08, 0.6, 0.4)
        });
        const cattail = new Mesh(cattailGeometry, cattailMaterial);
        cattail.position.copy(stem.position);
        cattail.position.y += 1.5;
        cattail.castShadow = true;
        this.add(cattail);
      }
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

    const distance = Math.sqrt(frogPosition.x ** 2 + frogPosition.z ** 2);
    this.updateSceneryBasedOnDistance(distance, frogPosition);
    
    this.water.setMousePosition(
      (frogPosition.x / 100) * 0.5 + 0.5,
      (frogPosition.z / 100) * 0.5 + 0.5
    );
    
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
    let skyColor: Color;
    let fogColor: Color;
    let waterColor: Color;
    
    if (distance < 50) {
      skyColor = new Color(0x87CEEB);
      fogColor = new Color(0x87CEEB);
      waterColor = new Color(0x006994);
      this.water.setWaveHeight(1.0);
      this.water.setWaveSpeed(1.0);
    } else if (distance < 100) {
      skyColor = new Color(0xFF6B6B);
      fogColor = new Color(0xFF6B6B);
      waterColor = new Color(0x8B0000);
      this.water.setWaveHeight(1.5);
      this.water.setWaveSpeed(1.2);
    } else if (distance < 200) {
      skyColor = new Color(0x9370DB);
      fogColor = new Color(0x9370DB);
      waterColor = new Color(0x4B0082);
      this.water.setWaveHeight(2.0);
      this.water.setWaveSpeed(1.5);
    } else if (distance < 300) {
      skyColor = new Color(0x32CD32);
      fogColor = new Color(0x32CD32);
      waterColor = new Color(0x006400);
      this.water.setWaveHeight(2.5);
      this.water.setWaveSpeed(2.0);
    } else if (distance < 500) {
      skyColor = new Color(0xFF69B4);
      fogColor = new Color(0xFF69B4);
      waterColor = new Color(0xFF1493);
      this.water.setWaveHeight(3.0);
      this.water.setWaveSpeed(2.5);
    } else if (distance < 750) {
      skyColor = new Color(0xFF4500);
      fogColor = new Color(0xFF4500);
      waterColor = new Color(0xFF6347);
      this.water.setWaveHeight(4.0);
      this.water.setWaveSpeed(3.0);
    } else {
      const time = Date.now() * 0.001;
      const hue = (time * 0.1) % 1;
      skyColor = new Color().setHSL(hue, 0.8, 0.6);
      fogColor = new Color().setHSL(hue, 0.8, 0.4);
      waterColor = new Color().setHSL(hue, 0.9, 0.3);
      this.water.setWaveHeight(5.0 + Math.sin(time) * 2.0);
      this.water.setWaveSpeed(4.0 + Math.cos(time) * 1.0);
    }

    this.renderer.setClearColor(skyColor);
    if (this.scene.fog) {
      (this.scene.fog as Fog).color = fogColor;
      (this.scene.fog as Fog).near = Math.max(20, 100 - distance * 0.1);
      (this.scene.fog as Fog).far = Math.max(50, 200 - distance * 0.2);
    }
    
    this.water.setWaterColor(waterColor);
    
    if (this.skyMesh.material instanceof ShaderMaterial) {
      this.skyMesh.material.uniforms.skyColor.value = skyColor;
      this.skyMesh.material.uniforms.horizonColor.value = fogColor;
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
      const treeGeometry = new CylinderGeometry(0.5, 1, 4, 8);
      const treeMaterial = new MeshLambertMaterial({ 
        color: new Color().setHSL(0.08, 0.6, 0.3)
      });
      const tree = new Mesh(treeGeometry, treeMaterial);
      
      tree.position.set(
        frogPosition.x + (Math.random() - 0.5) * 60,
        2,
        frogPosition.z + (Math.random() - 0.5) * 60
      );
      tree.castShadow = true;
      tree.receiveShadow = true;
      
      this.add(tree);
      this.sceneryObjects.push(tree);
      
      const crownGeometry = new SphereGeometry(2, 12, 8);
      const crownMaterial = new MeshLambertMaterial({ 
        color: new Color().setHSL(0.25, 0.7, 0.4)
      });
      const crown = new Mesh(crownGeometry, crownMaterial);
      crown.position.copy(tree.position);
      crown.position.y += 3;
      crown.castShadow = true;
      this.add(crown);
      this.sceneryObjects.push(crown);
    }
  }

  private createWeirdScenery(frogPosition: Vector3): void {
    for (let i = 0; i < 4; i++) {
      const weirdGeometry = new BoxGeometry(2, 2, 2);
      const weirdMaterial = new MeshLambertMaterial({ 
        color: new Color().setHSL(Math.random(), 0.8, 0.6),
        transparent: true,
        opacity: 0.8
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
      const stemMaterial = new MeshLambertMaterial({ color: 0xF5DEB3 });
      const stem = new Mesh(stemGeometry, stemMaterial);
      
      const capGeometry = new SphereGeometry(4, 16, 8);
      const capMaterial = new MeshLambertMaterial({ 
        color: [0xFF0000, 0xFF69B4, 0x9370DB][i % 3],
        transparent: true,
        opacity: 0.9
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
      const crystalMaterial = new MeshLambertMaterial({ 
        color: 0x00FFFF,
        transparent: true,
        opacity: 0.8,
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
      const islandMaterial = new MeshLambertMaterial({ color: 0x8FBC8F });
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
        const treeMaterial = new MeshLambertMaterial({ color: 0x228B22 });
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
      const material = new MeshLambertMaterial({ 
        color: new Color().setHSL(Math.random(), 0.8, 0.6),
        transparent: true,
        opacity: 0.7 + Math.random() * 0.3,
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
    
    this.renderer.setClearColor(0x87CEEB);
    if (this.scene.fog) {
      (this.scene.fog as Fog).color = new Color(0x87CEEB);
      (this.scene.fog as Fog).near = 50;
      (this.scene.fog as Fog).far = 200;
    }
    
    this.water.setWaterColor(new Color(0x006994));
    this.water.setWaveHeight(1.0);
    this.water.setWaveSpeed(1.0);
  }
}