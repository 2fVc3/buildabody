import { Easing, Tween } from '@tweenjs/tween.js';
import {
  AmbientLight,
  DirectionalLight,
  Object3D,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import type { PostConfig } from '../shared/types/postConfig';

export class Stage {
  private container: HTMLElement;
  private scene: Scene;
  private renderer!: WebGLRenderer;
  private camera!: OrthographicCamera;
  private originalCameraPosition: { x: number; y: number; z: number };

  private config: PostConfig;

  constructor(config: PostConfig, devicePixelRatio: number) {
    this.config = config;
    this.container = document.getElementById('game') as HTMLElement;
    this.scene = new Scene();

    this.setupRenderer(devicePixelRatio);
    this.setupCamera();
    this.setupDirectionalLight();
    this.setupAmbientLight();
    
    this.originalCameraPosition = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z
    };
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
    this.renderer.setClearColor(parseInt(this.config.background.color, 16), 1);
    this.container.appendChild(this.renderer.domElement);
  }

  private setupCamera(): void {
    const { near, far, position, lookAt, offset } = this.config.camera;
    this.camera = new OrthographicCamera();
    this.camera.near = near;
    this.camera.far = far;
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    this.camera.position.y += offset;
  }

  private setupDirectionalLight(): void {
    const { color, intensity, position } = this.config.light.directional;
    const directionalLight = new DirectionalLight(parseInt(color, 16), intensity);
    directionalLight.position.set(position.x, position.y, position.z);
    this.add(directionalLight);
  }

  private setupAmbientLight(): void {
    const { color, intensity, position } = this.config.light.ambient;
    const ambientLight = new AmbientLight(parseInt(color, 16), intensity);
    ambientLight.position.set(position.x, position.y, position.z);
    this.add(ambientLight);
  }

  public setCamera(y: number): void {
    new Tween(this.camera.position)
      .to({ y: y + this.config.camera.offset }, 300)
      .easing(Easing.Cubic.Out)
      .start();
  }

  public resetCamera(duration: number): void {
    const { position, offset } = this.config.camera;
    new Tween(this.camera.position)
      .to({ y: position.y + offset }, duration)
      .easing(Easing.Cubic.Out)
      .start();
  }

  public shakeCamera(duration: number): void {
    const originalPosition = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z
    };

    // Create a series of random shake movements
    const shakeIntensity = 2;
    const shakeCount = 20;
    const shakeDuration = duration / shakeCount;

    for (let i = 0; i < shakeCount; i++) {
      const delay = i * shakeDuration;
      const isLast = i === shakeCount - 1;
      
      new Tween(this.camera.position)
        .to({
          x: isLast ? originalPosition.x : originalPosition.x + (Math.random() - 0.5) * shakeIntensity,
          y: isLast ? originalPosition.y : originalPosition.y + (Math.random() - 0.5) * shakeIntensity,
          z: isLast ? originalPosition.z : originalPosition.z + (Math.random() - 0.5) * shakeIntensity
        }, shakeDuration)
        .delay(delay)
        .easing(isLast ? Easing.Elastic.Out : Easing.Linear.None)
        .start();
    }
  }
}