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
} from 'three';
import type { PostConfig } from '../shared/types/postConfig';

export class Stage {
  private container: HTMLElement;
  private scene: Scene;
  private renderer!: WebGLRenderer;
  private camera!: OrthographicCamera;
  private originalCameraPosition: Vector3;

  private config: PostConfig;

  constructor(config: PostConfig, devicePixelRatio: number) {
    this.config = config;
    this.container = document.getElementById('game') as HTMLElement;
    this.scene = new Scene();

    this.setupRenderer(devicePixelRatio);
    this.setupCamera();
    this.setupLights();
    this.setupEnvironment();
    
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

  private setupEnvironment(): void {
    // Ground plane
    const groundGeometry = new PlaneGeometry(100, 100);
    const groundMaterial = new MeshLambertMaterial({ 
      color: parseInt(this.config.background.groundColor, 16) 
    });
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    this.add(ground);

    // Launch pad
    const padGeometry = new CylinderGeometry(2, 2, 0.2, 16);
    const padMaterial = new MeshLambertMaterial({ color: 0x8B4513 }); // Saddle brown
    const launchPad = new Mesh(padGeometry, padMaterial);
    launchPad.position.set(0, 0.1, 0);
    this.add(launchPad);

    // Some decorative lily pads around the scene
    for (let i = 0; i < 8; i++) {
      const lilyPadGeometry = new CylinderGeometry(1, 1, 0.1, 8);
      const lilyPadMaterial = new MeshLambertMaterial({ color: 0x228B22 }); // Forest green
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

    // Some random rocks for visual interest
    for (let i = 0; i < 12; i++) {
      const rockGeometry = new BoxGeometry(
        0.5 + Math.random() * 1,
        0.3 + Math.random() * 0.5,
        0.5 + Math.random() * 1
      );
      const rockMaterial = new MeshLambertMaterial({ color: 0x696969 }); // Dim gray
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
  }

  public resetCamera(): void {
    new Tween(this.camera.position)
      .to(this.originalCameraPosition, 1000)
      .easing(Easing.Cubic.Out)
      .start();
  }
}