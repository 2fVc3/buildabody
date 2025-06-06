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
  BackSide,
  TextureLoader,
  RepeatWrapping,
  MeshStandardMaterial,
  DoubleSide
} from 'three';
import type { PostConfig } from '../shared/types/postConfig';
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
  private waterMesh!: Mesh;
  private groundMesh!: Mesh;
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
    this.setupGround();
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
    if (this.waterMesh.material instanceof ShaderMaterial) {
      this.waterMesh.material.uniforms.time.value = time;
    }
    
    // Update sky shader
    if (this.skyMesh.material instanceof ShaderMaterial) {
      this.skyMesh.material.uniforms.time.value = time;
    }
    
    // Update ground shader
    if (this.groundMesh.material instanceof ShaderMaterial) {
      this.groundMesh.material.uniforms.time.value = time;
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

  private setupGround(): void {
    // Create beautiful procedural terrain
    const groundGeometry = new PlaneGeometry(2000, 2000, 128, 128);
    
    // Beautiful grass terrain with proper textures
    const groundMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        grassColor: { value: new Color(0x4a7c59) },
        dirtColor: { value: new Color(0x8b4513) },
        sandColor: { value: new Color(0xffe894) },
        rockColor: { value: new Color(0x8B7355) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vElevation;
        
        // Noise function for terrain generation
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
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
          vUv = uv;
          vPosition = position;
          
          // Create beautiful terrain elevation
          vec2 pos = position.xz * 0.01;
          float elevation = fbm(pos) * 2.0;
          elevation += fbm(pos * 2.0) * 1.0;
          elevation += fbm(pos * 4.0) * 0.5;
          
          vec3 newPosition = position;
          newPosition.y += elevation;
          vElevation = elevation;
          
          // Calculate normal for lighting
          float dx = fbm((pos + vec2(0.01, 0.0)) * 1.0) - fbm((pos - vec2(0.01, 0.0)) * 1.0);
          float dz = fbm((pos + vec2(0.0, 0.01)) * 1.0) - fbm((pos - vec2(0.0, 0.01)) * 1.0);
          
          vNormal = normalize(vec3(-dx * 20.0, 1.0, -dz * 20.0));
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 grassColor;
        uniform vec3 dirtColor;
        uniform vec3 sandColor;
        uniform vec3 rockColor;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vElevation;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          vec2 uv = vUv * 50.0;
          
          // Base terrain color mixing
          vec3 color = sandColor;
          
          // Grass on higher elevations
          float grassMix = smoothstep(-0.5, 1.0, vElevation);
          color = mix(color, grassColor, grassMix);
          
          // Rock on steep slopes
          float steepness = 1.0 - dot(vNormal, vec3(0.0, 1.0, 0.0));
          float rockMix = smoothstep(0.3, 0.7, steepness);
          color = mix(color, rockColor, rockMix);
          
          // Add texture detail
          float detail = noise(uv) * 0.1;
          color += detail;
          
          // Add some variation
          float variation = noise(uv * 0.1) * 0.05;
          color += variation;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    
    this.groundMesh = new Mesh(groundGeometry, groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = 0;
    this.groundMesh.receiveShadow = true;
    this.add(this.groundMesh);
  }

  private setupWater(): void {
    // Create stunning realistic water
    const waterGeometry = new PlaneGeometry(100, 100, 64, 64);
    
    const waterMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        waterColor: { value: new Color(0x006994) },
        foamColor: { value: new Color(0xffffff) },
        deepWaterColor: { value: new Color(0x003366) }
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vElevation;
        
        // Advanced noise for realistic water
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for(int i = 0; i < 6; i++) {
            value += amplitude * noise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return value;
        }
        
        void main() {
          vUv = uv;
          
          vec3 pos = position;
          
          // Create realistic water waves
          vec2 wavePos = pos.xz * 0.1;
          float wave1 = sin(wavePos.x * 2.0 + time * 2.0) * 0.4;
          float wave2 = sin(wavePos.y * 1.5 + time * 1.5) * 0.3;
          float wave3 = sin((wavePos.x + wavePos.y) * 0.8 + time * 2.5) * 0.2;
          
          // Add noise for realistic movement
          float noiseValue = fbm(wavePos + time * 0.1) * 0.3;
          
          float elevation = wave1 + wave2 + wave3 + noiseValue;
          pos.y += elevation;
          vElevation = elevation;
          
          // Calculate normal for lighting
          float dx = sin((wavePos.x + 0.1) * 2.0 + time * 2.0) * 0.4 - wave1;
          float dz = sin((wavePos.y + 0.1) * 1.5 + time * 1.5) * 0.3 - wave2;
          
          vec3 tangent = normalize(vec3(1.0, dx * 10.0, 0.0));
          vec3 bitangent = normalize(vec3(0.0, dz * 10.0, 1.0));
          vNormal = normalize(cross(tangent, bitangent));
          
          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 waterColor;
        uniform vec3 foamColor;
        uniform vec3 deepWaterColor;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vElevation;
        
        // Fresnel effect for realistic water
        float fresnel(vec3 viewDirection, vec3 normal, float power) {
          return pow(1.0 - max(0.0, dot(viewDirection, normal)), power);
        }
        
        // Water caustics
        float caustics(vec2 uv, float time) {
          vec2 p = uv * 8.0;
          float c = 0.0;
          
          for(int i = 0; i < 3; i++) {
            float t = time * 0.5 + float(i) * 2.0;
            vec2 offset = vec2(sin(t), cos(t)) * 0.3;
            c += sin(length(p + offset) * 3.0 - time * 2.0) * 0.3;
          }
          
          return max(0.0, c);
        }
        
        void main() {
          vec2 uv = vUv;
          
          // Base water color with depth variation
          vec3 color = mix(deepWaterColor, waterColor, 0.7);
          
          // Add foam on wave peaks
          float foam = smoothstep(0.3, 0.8, vElevation + 0.5);
          color = mix(color, foamColor, foam * 0.8);
          
          // Add caustics effect
          float causticsValue = caustics(uv + time * 0.1, time);
          color += causticsValue * 0.3 * vec3(0.8, 1.0, 1.0);
          
          // Fresnel reflection
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnelValue = fresnel(viewDirection, vNormal, 2.0);
          
          // Sky reflection
          vec3 skyColor = vec3(0.5, 0.8, 1.0);
          color = mix(color, skyColor, fresnelValue * 0.4);
          
          // Add sparkles
          float sparkle = sin(uv.x * 80.0 + time * 3.0) * sin(uv.y * 80.0 + time * 2.0);
          sparkle = pow(max(0.0, sparkle), 12.0);
          color += sparkle * 0.6;
          
          gl_FragColor = vec4(color, 0.95);
        }
      `,
      transparent: true,
      side: DoubleSide
    });
    
    this.waterMesh = new Mesh(waterGeometry, waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = -0.2;
    this.waterMesh.receiveShadow = true;
    this.add(this.waterMesh);
  }

  private setupSky(): void {
    const skyGeometry = new SphereGeometry(800, 32, 16);
    const skyMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
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
        uniform vec3 skyColor;
        uniform vec3 horizonColor;
        uniform vec3 sunColor;
        uniform float cloudiness;
        
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
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
          
          // Sky gradient
          vec3 color = mix(horizonColor, skyColor, max(0.0, elevation));
          
          // Add sun
          vec3 sunDirection = normalize(vec3(1.0, 0.3, 0.5));
          float sunDistance = distance(direction, sunDirection);
          float sunIntensity = 1.0 - smoothstep(0.0, 0.1, sunDistance);
          color = mix(color, sunColor, sunIntensity * 0.8);
          
          // Sun glow
          float sunGlow = 1.0 - smoothstep(0.0, 0.3, sunDistance);
          color += sunColor * sunGlow * 0.3;
          
          // Clouds
          if(elevation > 0.0) {
            vec2 cloudUv = direction.xz / (direction.y + 0.1) + time * 0.01;
            float cloudNoise = fbm(cloudUv * 2.0 + time * 0.02);
            cloudNoise = smoothstep(0.4, 0.8, cloudNoise);
            
            vec3 cloudColor = mix(vec3(1.0), vec3(0.8, 0.8, 0.9), elevation);
            color = mix(color, cloudColor, cloudNoise * cloudiness);
          }
          
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
    // Beautiful launch pad
    const padGeometry = new CylinderGeometry(2.5, 2.5, 0.3, 16);
    const padMaterial = new MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.1
    });
    const launchPad = new Mesh(padGeometry, padMaterial);
    launchPad.position.set(0, 0.15, 0);
    launchPad.castShadow = true;
    launchPad.receiveShadow = true;
    this.add(launchPad);

    this.createBeautifulLilyPads();
    this.createNaturalRocks();
    this.createLushVegetation();
  }

  private createBeautifulLilyPads(): void {
    for (let i = 0; i < 15; i++) {
      const lilyPadGeometry = new CylinderGeometry(1.5, 1.2, 0.1, 12);
      const lilyPadMaterial = new MeshStandardMaterial({ 
        color: new Color().setHSL(0.3, 0.7, 0.4),
        roughness: 0.6,
        metalness: 0.0
      });
      const lilyPad = new Mesh(lilyPadGeometry, lilyPadMaterial);
      
      const angle = (i / 15) * Math.PI * 2;
      const distance = 20 + Math.random() * 25;
      lilyPad.position.set(
        Math.cos(angle) * distance,
        -0.15,
        Math.sin(angle) * distance
      );
      lilyPad.rotation.y = Math.random() * Math.PI * 2;
      lilyPad.castShadow = true;
      lilyPad.receiveShadow = true;
      this.add(lilyPad);
      
      // Add beautiful flowers
      if (Math.random() < 0.5) {
        const flowerGeometry = new ConeGeometry(0.4, 0.6, 8);
        const flowerMaterial = new MeshStandardMaterial({ 
          color: new Color().setHSL(Math.random() * 0.1 + 0.9, 0.9, 0.8)
        });
        const flower = new Mesh(flowerGeometry, flowerMaterial);
        flower.position.copy(lilyPad.position);
        flower.position.y += 0.4;
        flower.castShadow = true;
        this.add(flower);
      }
    }
  }

  private createNaturalRocks(): void {
    for (let i = 0; i < 25; i++) {
      const rockSize = 0.4 + Math.random() * 1.5;
      const rockGeometry = new BoxGeometry(
        rockSize,
        rockSize * 0.7,
        rockSize * 0.9
      );
      
      const rockMaterial = new MeshStandardMaterial({ 
        color: new Color().setHSL(0.1, 0.3, 0.3 + Math.random() * 0.2),
        roughness: 0.9,
        metalness: 0.0
      });
      
      const rock = new Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        (Math.random() - 0.5) * 80,
        rockSize * 0.35,
        (Math.random() - 0.5) * 80
      );
      rock.rotation.set(
        (Math.random() - 0.5) * 0.5,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.5
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.add(rock);
    }
  }

  private createLushVegetation(): void {
    // Create beautiful grass and plants
    for (let i = 0; i < 20; i++) {
      const stemGeometry = new CylinderGeometry(0.08, 0.12, 3 + Math.random() * 3, 8);
      const stemMaterial = new MeshStandardMaterial({ 
        color: new Color().setHSL(0.25, 0.8, 0.3),
        roughness: 0.7
      });
      const stem = new Mesh(stemGeometry, stemMaterial);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 10 + Math.random() * 30;
      stem.position.set(
        Math.cos(angle) * distance,
        1.5,
        Math.sin(angle) * distance
      );
      stem.rotation.z = (Math.random() - 0.5) * 0.4;
      stem.castShadow = true;
      this.add(stem);
      
      // Add cattails
      if (Math.random() < 0.7) {
        const cattailGeometry = new CylinderGeometry(0.2, 0.15, 1.0, 8);
        const cattailMaterial = new MeshStandardMaterial({ 
          color: new Color().setHSL(0.08, 0.7, 0.4)
        });
        const cattail = new Mesh(cattailGeometry, cattailMaterial);
        cattail.position.copy(stem.position);
        cattail.position.y += 2.0;
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
    } else if (distance < 100) {
      skyColor = new Color(0xFF6B6B);
      fogColor = new Color(0xFF6B6B);
      waterColor = new Color(0x8B0000);
    } else if (distance < 200) {
      skyColor = new Color(0x9370DB);
      fogColor = new Color(0x9370DB);
      waterColor = new Color(0x4B0082);
    } else if (distance < 300) {
      skyColor = new Color(0x32CD32);
      fogColor = new Color(0x32CD32);
      waterColor = new Color(0x006400);
    } else if (distance < 500) {
      skyColor = new Color(0xFF69B4);
      fogColor = new Color(0xFF69B4);
      waterColor = new Color(0xFF1493);
    } else if (distance < 750) {
      skyColor = new Color(0xFF4500);
      fogColor = new Color(0xFF4500);
      waterColor = new Color(0xFF6347);
    } else {
      const time = Date.now() * 0.001;
      const hue = (time * 0.1) % 1;
      skyColor = new Color().setHSL(hue, 0.8, 0.6);
      fogColor = new Color().setHSL(hue, 0.8, 0.4);
      waterColor = new Color().setHSL(hue, 0.9, 0.3);
    }

    this.renderer.setClearColor(skyColor);
    if (this.scene.fog) {
      (this.scene.fog as Fog).color = fogColor;
      (this.scene.fog as Fog).near = Math.max(20, 100 - distance * 0.1);
      (this.scene.fog as Fog).far = Math.max(50, 200 - distance * 0.2);
    }
    
    // Update water color
    if (this.waterMesh.material instanceof ShaderMaterial) {
      this.waterMesh.material.uniforms.waterColor.value = waterColor;
    }
    
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
    
    // Reset water color
    if (this.waterMesh.material instanceof ShaderMaterial) {
      this.waterMesh.material.uniforms.waterColor.value = new Color(0x006994);
    }
  }
}