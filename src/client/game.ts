import { Easing, Tween, update as tweenjsUpdate } from '@tweenjs/tween.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Vector3, CylinderGeometry, Mesh, MeshStandardMaterial } from 'three';
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
  
  private world!: CANNON.World;
  private fryBody!: CANNON.Body;

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
      console.log('Received init data:', initData);

      this.devvit = new Devvit({
        userId: initData.user.id,
      });

      this.config = initData.postConfig;
      this.userAllTimeStats = initData.userAllTimeStats;

      this.setupDOMElements();
      this.updateLeaderboard(initData.leaderboard);
      this.setupPhysicsWorld();
      this.setupStage(width, height, devicePixelRatio);
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
        this.render();
        this.stats?.update();
      });

      this.updateState('ready');
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
  }

  private createFriesBag(): void {
    const geometry = new CylinderGeometry(2, 1.5, 4, 32);
    const material = new MeshStandardMaterial({ color: 0xFFFFFF });
    this.friesBag = new Mesh(geometry, material);
    this.friesBag.position.set(0, 0, 0);
    this.stage.add(this.friesBag);

    // Add physics for the bag
    const bagShape = new CANNON.Cylinder(2, 1.5, 4, 32);
    const bagBody = new CANNON.Body({
      mass: 0,
      shape: bagShape,
      position: new CANNON.Vec3(0, 0, 0)
    });
    this.world.addBody(bagBody);
  }

  private createFry(): void {
    this.fry = new Block(new Vector3(1.5, 8, 1.5));
    this.stage.add(this.fry.getMesh());

    // Add physics for the fry
    const fryShape = new CANNON.Box(new CANNON.Vec3(0.75, 4, 0.75));
    this.fryBody = new CANNON.Body({
      mass: 1,
      shape: fryShape,
      position: new CANNON.Vec3(0, 10, 0)
    });
    this.world.addBody(this.fryBody);
  }

  private updatePhysics(): void {
    if (this.fry && this.fryBody) {
      this.fry.getMesh().position.copy(this.fryBody.position as any);
      this.fry.getMesh().quaternion.copy(this.fryBody.quaternion as any);
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

  public async action(): Promise<void> {
    if (this.state === 'playing') {
      this.flipFry();
    } else if (this.state === 'ready') {
      this.startGame();
    } else if (this.state === 'ended') {
      this.restartGame();
    }
  }

  private flipFry(): void {
    const force = new CANNON.Vec3(0, 10, -5);
    const point = new CANNON.Vec3(0, 0, 0);
    this.fryBody.applyForce(force, point);
  }

  private startGame(): void {
    this.updateState('playing');
  }

  private async restartGame(): Promise<void> {
    this.updateState('ready');
    this.createFry();
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