import { Easing, Tween, update as tweenjsUpdate } from '@tweenjs/tween.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Vector3, CylinderGeometry, Mesh, MeshStandardMaterial, BoxGeometry } from 'three';
import * as CANNON from 'cannon-es';
import { Block } from './block';
import { Stage } from './stage';
import { Ticker } from './ticker';
import { getEnv } from './utils/env';
import { Devvit } from './devvit';
import type { PostConfig } from '../shared/types/postConfig';
import { User } from '../shared/types/user';
import { InitMessage } from '../shared/types/message';

type GameState = 'loading' | 'ready' | 'playing' | 'ended' | 'resetting';

export class Game {
  private devvit!: Devvit;
  private mainContainer!: HTMLElement;
  private scoreContainer!: HTMLElement;
  private instructions!: HTMLElement;
  private leaderboardList!: HTMLElement;
  private gameOverText!: HTMLElement;
  private ticker!: Ticker;

  private state: GameState = 'loading';
  private stage!: Stage;
  private fry!: Block;
  private friesBag!: Mesh;
  private floor!: Mesh;
  
  private world!: CANNON.World;
  private fryBody!: CANNON.Body;
  private bagBody!: CANNON.Body;
  private floorBody!: CANNON.Body;

  private score: number = 0;
  private flipPower: number = 0;
  private isCharging: boolean = false;
  private maxFlipPower: number = 15;
  private chargeRate: number = 0.5;

  private stats!: Stats;
  private config!: PostConfig;
  
  private userAllTimeStats: {
    score: number;
    rank: number;
  } | null = null;

  public async prepare(width: number, height: number, devicePixelRatio: number): Promise<void> {
    try {
      const response = await fetch(`/api/init`);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const data = await response.json();
      if (data.type !== 'init') {
        throw new Error('Invalid init data received');
      }
      const initData = data as InitMessage;

      this.devvit = new Devvit({
        userId: initData.user.id,
      });

      this.config = initData.postConfig;
      this.userAllTimeStats = initData.userAllTimeStats;

      this.setupDOMElements();
      this.updateLeaderboard(initData.leaderboard);
      this.setupPhysicsWorld();
      this.setupStage(width, height, devicePixelRatio);
      this.createFloor();
      this.createFriesBag();
      this.createFry();

      if (getEnv().MODE === 'development') {
        this.stats = Stats();
        document.body.appendChild(this.stats.dom);
      }

      this.ticker = new Ticker((currentTime: number, deltaTime: number) => {
        tweenjsUpdate(currentTime);
        this.world.step(1/60);
        this.updatePhysics();
        this.checkCollisions();
        if (this.isCharging && this.flipPower < this.maxFlipPower) {
          this.flipPower += this.chargeRate;
        }
        this.render();
        this.stats?.update();
      });

      this.updateState('ready');
      this.instructions.innerHTML = "Hold to charge, release to flip!";
    } catch (error) {
      console.error('Failed to initialize game:', error);
      const container = document.getElementById('container');
      if (container) {
        container.innerHTML = '<p style="color: red; padding: 1em;">Failed to load game configuration. Please try refreshing.</p>';
      }
    }
  }

  private setupDOMElements(): void {
    this.mainContainer = document.getElementById('container') as HTMLElement;
    this.scoreContainer = document.getElementById('score') as HTMLElement;
    this.instructions = document.getElementById('instructions') as HTMLElement;
    this.leaderboardList = document.getElementById('leaderboard-list') as HTMLElement;
    this.gameOverText = document.getElementById('game-over-text') as HTMLElement;
    this.scoreContainer.innerHTML = '0';
  }

  private setupPhysicsWorld(): void {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0)
    });
  }

  private setupStage(width: number, height: number, devicePixelRatio: number): void {
    this.stage = new Stage(this.config, devicePixelRatio);
    this.stage.resize(width, height);
    // Adjust camera for better gameplay view
    this.stage.setCustomCamera(15, 10, 15);
  }

  private createFloor(): void {
    const geometry = new BoxGeometry(20, 0.1, 20);
    const material = new MeshStandardMaterial({ color: 0xcccccc });
    this.floor = new Mesh(geometry, material);
    this.floor.position.set(0, -0.05, 0);
    this.stage.add(this.floor);

    this.floorBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(10, 0.05, 10)),
      position: new CANNON.Vec3(0, -0.05, 0)
    });
    this.world.addBody(this.floorBody);
  }

  private createFriesBag(): void {
    const geometry = new CylinderGeometry(2, 1.5, 4, 32);
    const material = new MeshStandardMaterial({ color: 0xFFFFFF });
    this.friesBag = new Mesh(geometry, material);
    this.friesBag.position.set(5, 2, 5);
    this.stage.add(this.friesBag);

    this.bagBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(2, 1.5, 4, 32),
      position: new CANNON.Vec3(5, 2, 5)
    });
    this.world.addBody(this.bagBody);
  }

  private createFry(): void {
    // Random starting position on the floor
    const startX = Math.random() * 10 - 5;
    const startZ = Math.random() * 10 - 5;
    
    this.fry = new Block(new Vector3(0.3, 2, 0.3));
    this.fry.position.set(startX, 1, startZ);
    this.stage.add(this.fry.getMesh());

    if (this.fryBody) {
      this.world.removeBody(this.fryBody);
    }

    this.fryBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(new CANNON.Vec3(0.15, 1, 0.15)),
      position: new CANNON.Vec3(startX, 1, startZ)
    });
    this.world.addBody(this.fryBody);
  }

  private checkCollisions(): void {
    if (!this.fryBody || !this.bagBody) return;

    const distance = this.fryBody.position.distanceTo(this.bagBody.position);
    const heightDiff = this.fryBody.position.y - this.bagBody.position.y;

    // Check if fry is above bag and within radius
    if (distance < 2 && heightDiff > 0 && heightDiff < 4) {
      this.score += 1;
      this.scoreContainer.innerHTML = this.score.toString();
      this.createFry(); // Spawn new fry
    }
  }

  private updatePhysics(): void {
    if (this.fry && this.fryBody) {
      this.fry.position.copy(this.fryBody.position as any);
      this.fry.quaternion.copy(this.fryBody.quaternion as any);
    }
  }

  public async start(): Promise<void> {
    this.ticker.start();
  }

  public async pause(): Promise<void> {
    this.ticker.stop();
  }

  public resize(width: number, height: number): void {
    this.stage.resize(width, height);
  }

  private render(): void {
    this.stage.render();
  }

  private updateState(newState: GameState): void {
    this.mainContainer.classList.remove(this.state);
    this.state = newState;
    this.mainContainer.classList.add(this.state);
  }

  public async onMouseDown(): Promise<void> {
    if (this.state === 'playing') {
      this.isCharging = true;
      this.flipPower = 0;
    }
  }

  public async onMouseUp(): Promise<void> {
    if (this.state === 'playing' && this.isCharging) {
      this.isCharging = false;
      this.flipFry();
    }
  }

  public async action(): Promise<void> {
    if (this.state === 'ready') {
      this.startGame();
    } else if (this.state === 'ended') {
      this.restartGame();
    }
  }

  private flipFry(): void {
    const upForce = this.flipPower * 2;
    const horizontalForce = this.flipPower;
    
    // Calculate direction towards the bag
    const direction = new CANNON.Vec3();
    direction.copy(this.bagBody.position as any);
    direction.vsub(this.fryBody.position, direction);
    direction.normalize();
    
    const force = new CANNON.Vec3(
      direction.x * horizontalForce,
      upForce,
      direction.z * horizontalForce
    );
    
    this.fryBody.applyImpulse(force, this.fryBody.position);
    this.flipPower = 0;
  }

  private startGame(): void {
    this.score = 0;
    this.scoreContainer.innerHTML = '0';
    this.updateState('playing');
  }

  private async restartGame(): Promise<void> {
    this.score = 0;
    this.scoreContainer.innerHTML = '0';
    this.createFry();
    this.updateState('playing');
  }

  private updateLeaderboard(
    leaderboard: {
      user: User;
      score: number;
    }[]
  ): void {
    this.leaderboardList.innerHTML = '';
    leaderboard.forEach((item) => {
      const element = document.createElement('div');
      element.classList.add('leaderboard-item');
      const img = document.createElement('img');
      img.src = item.user.snoovatarUrl;
      element.appendChild(img);
      const userText = document.createElement('span');
      userText.innerHTML = `${item.user.username} | <b>${item.score}</b>`;
      element.appendChild(userText);
      this.leaderboardList.appendChild(element);
    });
  }
}