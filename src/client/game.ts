import { Easing, Tween, update as tweenjsUpdate } from '@tweenjs/tween.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Vector3 } from 'three';
import { Block } from './block';
import { Stage } from './stage';
import { Ticker } from './ticker';
import { getEnv } from './utils/env';
import { Pool } from './utils/pool';
import { Devvit } from './devvit';
import type { PostConfig } from '../shared/types/postConfig';
import { User } from '../shared/types/user';
import { InitMessage } from '../shared/types/message';
import { BlockEffect } from '../shared/types/postConfig';

type GameState = 'loading' | 'ready' | 'playing' | 'ended' | 'resetting';

const SILLY_MESSAGES = [
  "🍟 That block is having an existential crisis!",
  "🎪 Physics has left the chat",
  "🤡 Your tower defies all known laws of engineering",
  "🎭 The blocks are staging a rebellion!",
  "🎨 Picasso would be proud of this architectural masterpiece",
  "🎪 Welcome to the circus of structural impossibility!",
  "🤹 You're basically a block whisperer now",
  "🎭 This tower has more drama than a soap opera",
  "🎪 The blocks are doing interpretive dance",
  "🤡 Gravity is just a suggestion, apparently"
];

const CELEBRATION_MESSAGES = [
  "🎉 MAGNIFICENT CHAOS!",
  "🎊 BEAUTIFUL DISASTER!",
  "🎈 GLORIOUS MAYHEM!",
  "🎆 SPECTACULAR NONSENSE!",
  "🎇 DIVINE MADNESS!",
  "🎪 CIRCUS APPROVED!",
  "🤹 PHYSICS DEFIED!",
  "🎭 DRAMA ACHIEVED!"
];

export class Game {
  private devvit!: Devvit;
  private mainContainer!: HTMLElement;
  private scoreContainer!: HTMLElement;
  private instructions!: HTMLElement;
  private leaderboardList!: HTMLElement;
  private gameOverText!: HTMLElement;
  private sillyMessageElement!: HTMLElement;
  private ticker!: Ticker;

  private state: GameState = 'loading';
  private stage!: Stage;
  private blocks: Block[] = [];
  private currentBlockIndex: number = 0;
  private chaosLevel: number = 0; // Increases as tower gets taller
  private lastSillyMessage: number = 0;

  private pool!: Pool<Block>;
  private stats!: Stats;
  private colorOffset!: number;

  private userAllTimeStats: {
    score: number;
    rank: number;
  } | null = null;

  private config!: PostConfig;

  public async prepare(width: number, height: number, devicePixelRatio: number): Promise<void> {
    let initData: InitMessage;
    try {
      const response = await fetch(`/api/init`);
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      const data = await response.json();
      if (data.type !== 'init') {
        throw new Error('Invalid init data received');
      }
      initData = data as InitMessage;
    } catch (error) {
      console.error('Failed to fetch init data:', error);
      const container = document.getElementById('container');
      if (container) {
        container.innerHTML = '<p style="color: red; padding: 1em;">Failed to load game configuration. Please try refreshing.</p>';
      }
      return;
    }

    this.devvit = new Devvit({
      userId: initData.user.id,
    });

    this.config = initData.postConfig;
    this.userAllTimeStats = initData.userAllTimeStats;

    this.mainContainer = document.getElementById('container') as HTMLElement;
    this.scoreContainer = document.getElementById('score') as HTMLElement;
    this.instructions = document.getElementById('instructions') as HTMLElement;
    this.leaderboardList = document.getElementById('leaderboard-list') as HTMLElement;
    this.gameOverText = document.getElementById('game-over-text') as HTMLElement;
    this.sillyMessageElement = document.getElementById('silly-message') as HTMLElement;

    this.updateLeaderboard(initData.leaderboard);
    this.scoreContainer.innerHTML = '0';

    this.stage = new Stage(this.config, devicePixelRatio);
    this.stage.resize(width, height);

    this.blocks = [];
    this.currentBlockIndex = 0;
    this.chaosLevel = 0;
    this.addBaseLayer();

    this.pool = new Pool(() => new Block());

    if (getEnv().MODE === 'development') {
      this.stats = Stats();
      document.body.appendChild(this.stats.dom);
    }

    this.ticker = new Ticker((currentTime: number, deltaTime: number) => {
      tweenjsUpdate(currentTime);
      this.update(deltaTime);
      this.render();
      this.stats?.update();
    });

    this.updateState('ready');
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

  private update(deltaTime: number): void {
    this.moveCurrentBlock(deltaTime);
    this.applyChaosEffects();
    this.checkTowerStability();
  }

  private applyChaosEffects(): void {
    if (this.state !== 'playing') return;
    
    // Random wobble effects for higher chaos levels
    if (this.chaosLevel > 3 && Math.random() < 0.01) {
      this.blocks.forEach((block, index) => {
        if (index < 3) return; // Don't wobble base blocks
        
        const wobbleIntensity = this.chaosLevel * 0.02;
        new Tween(block.rotation)
          .to({
            x: block.rotation.x + (Math.random() - 0.5) * wobbleIntensity,
            z: block.rotation.z + (Math.random() - 0.5) * wobbleIntensity
          }, 200)
          .easing(Easing.Elastic.Out)
          .start();
      });
    }

    // Occasional silly messages
    if (this.chaosLevel > 2 && Date.now() - this.lastSillyMessage > 5000 && Math.random() < 0.02) {
      this.showSillyMessage();
    }
  }

  private showSillyMessage(): void {
    const message = SILLY_MESSAGES[Math.floor(Math.random() * SILLY_MESSAGES.length)]!;
    this.sillyMessageElement.textContent = message;
    this.sillyMessageElement.classList.add('show');
    
    setTimeout(() => {
      this.sillyMessageElement.classList.remove('show');
    }, 3000);
    
    this.lastSillyMessage = Date.now();
  }

  private checkTowerStability(): void {
    if (this.state !== 'playing') return;
    
    const currentBlock = this.blocks[this.blocks.length - 1];
    if (!currentBlock || currentBlock.direction.length() === 0) return;

    const currentLayer = this.getCurrentLayer();
    const baseBlocks = this.getBlocksAtLayer(currentLayer - 1);
    
    if (baseBlocks.length === 0) return;

    // More forgiving stability for chaos mode
    const stabilityThreshold = Math.max(0.3, 0.8 - this.chaosLevel * 0.1);
    
    let isSupported = false;
    for (const baseBlock of baseBlocks) {
      const xDiff = Math.abs(currentBlock.x - baseBlock.x);
      const zDiff = Math.abs(currentBlock.z - baseBlock.z);
      
      if (xDiff < (baseBlock.width + currentBlock.width) * stabilityThreshold && 
          zDiff < (baseBlock.depth + currentBlock.depth) * stabilityThreshold) {
        isSupported = true;
        break;
      }
    }

    if (!isSupported) {
      this.toppleTower();
    }
  }

  private toppleTower(): void {
    if (this.state !== 'playing') return;
    
    this.updateState('ended');
    
    // SPECTACULAR CHAOS FALL ANIMATION
    const fallDelay = 20;
    this.blocks.forEach((block, index) => {
      // Each block falls in a different ridiculous way
      const fallStyle = Math.floor(Math.random() * 4);
      
      switch (fallStyle) {
        case 0: // Spinning tornado fall
          new Tween(block.position)
            .to({
              x: block.x + Math.sin(index) * 20,
              y: -40,
              z: block.z + Math.cos(index) * 20
            }, 3000)
            .delay(index * fallDelay)
            .easing(Easing.Bounce.Out)
            .start();
          
          new Tween(block.rotation)
            .to({
              x: Math.PI * 8,
              y: Math.PI * 12,
              z: Math.PI * 6
            }, 3000)
            .delay(index * fallDelay)
            .start();
          break;
          
        case 1: // Dramatic slow-mo fall
          new Tween(block.position)
            .to({
              x: block.x + (Math.random() - 0.5) * 25,
              y: -30,
              z: block.z + (Math.random() - 0.5) * 25
            }, 4000)
            .delay(index * fallDelay * 2)
            .easing(Easing.Quadratic.InOut)
            .start();
          break;
          
        case 2: // Bouncy castle fall
          new Tween(block.position)
            .to({
              x: block.x + (Math.random() - 0.5) * 15,
              y: -20,
              z: block.z + (Math.random() - 0.5) * 15
            }, 2500)
            .delay(index * fallDelay)
            .easing(Easing.Elastic.Out)
            .start();
          break;
          
        default: // Classic chaotic fall
          new Tween(block.position)
            .to({
              x: block.x + (Math.random() - 0.5) * 30,
              y: -35,
              z: block.z + (Math.random() - 0.5) * 30
            }, 2000)
            .delay(index * fallDelay)
            .easing(Easing.Back.In)
            .start();
      }
    });

    // Shake the camera for dramatic effect
    this.stage.shakeCamera(2000);

    setTimeout(() => this.endGame(), 3000);
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
    switch (this.state) {
      case 'ready':
        await this.startGame();
        break;
      case 'playing':
        await this.placeBlock();
        break;
      case 'ended':
        await this.restartGame();
        break;
    }
  }

  private async startGame(): Promise<void> {
    if (this.state === 'playing') return;
    this.colorOffset = Math.round(Math.random() * 100);
    this.scoreContainer.innerHTML = '0';
    this.currentBlockIndex = 0;
    this.chaosLevel = 0;
    this.updateState('playing');
    this.addNextBlock();
  }

  private async restartGame(): Promise<void> {
    this.updateState('resetting');

    // EPIC RESET ANIMATION
    const length = this.blocks.length;
    this.blocks.forEach((block, index) => {
      // Blocks fly away in all directions like confetti
      const angle = (index / length) * Math.PI * 2;
      const distance = 40 + Math.random() * 20;
      
      new Tween(block.position)
        .to({
          x: Math.cos(angle) * distance,
          y: 20 + Math.random() * 30,
          z: Math.sin(angle) * distance
        }, 1000)
        .delay(index * 20)
        .easing(Easing.Back.Out)
        .onComplete(() => {
          this.stage.remove(block.getMesh());
          this.pool.release(block);
        })
        .start();

      new Tween(block.rotation)
        .to({
          x: Math.random() * Math.PI * 6,
          y: Math.random() * Math.PI * 6,
          z: Math.random() * Math.PI * 6
        }, 1000)
        .delay(index * 20)
        .start();
    });

    const resetDuration = length * 20 + 1000;
    this.stage.resetCamera(resetDuration);

    setTimeout(async () => {
      this.blocks = [];
      this.currentBlockIndex = 0;
      this.chaosLevel = 0;
      this.addBaseLayer();
      await this.startGame();
    }, resetDuration);
  }

  private async endGame(): Promise<void> {
    const score = Math.floor((this.blocks.length - 3) / 3);
    const data = await this.devvit.gameOver(score);

    // CELEBRATION MESSAGE
    const celebration = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)]!;
    
    if (this.userAllTimeStats && score > this.userAllTimeStats.score) {
      this.gameOverText.innerHTML = `${celebration}<br/>NEW RECORD: ${score} layers of pure chaos!`;
    } else {
      this.gameOverText.innerHTML = `${celebration}<br/>You created ${score} layers of beautiful madness!`;
    }
    
    this.userAllTimeStats = data.userAllTimeStats;
    this.updateLeaderboard(data.leaderboard);
  }

  private async placeBlock(): Promise<void> {
    if (this.state !== 'playing') return;

    const currentBlock = this.blocks[this.blocks.length - 1]!;
    const currentLayer = this.getCurrentLayer();
    const baseBlocks = this.getBlocksAtLayer(currentLayer - 1);
    
    if (baseBlocks.length === 0) return;

    // More forgiving placement for chaos mode
    const placementThreshold = Math.max(0.15, 0.3 - this.chaosLevel * 0.02);
    
    let bestOverlap = 0;
    let bestBaseBlock = baseBlocks[0]!;
    
    for (const baseBlock of baseBlocks) {
      const xOverlap = Math.max(0, Math.min(
        currentBlock.x + currentBlock.width/2, baseBlock.x + baseBlock.width/2
      ) - Math.max(
        currentBlock.x - currentBlock.width/2, baseBlock.x - baseBlock.width/2
      ));
      
      const zOverlap = Math.max(0, Math.min(
        currentBlock.z + currentBlock.depth/2, baseBlock.z + baseBlock.depth/2
      ) - Math.max(
        currentBlock.z - currentBlock.depth/2, baseBlock.z - baseBlock.depth/2
      ));
      
      const overlap = xOverlap * zOverlap;
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestBaseBlock = baseBlock;
      }
    }

    const minOverlap = (currentBlock.width * currentBlock.depth) * placementThreshold;
    
    if (bestOverlap < minOverlap) {
      this.toppleTower();
      return;
    }

    // SUCCESSFUL PLACEMENT CELEBRATION
    currentBlock.direction.set(0, 0, 0);
    const targetY = this.getLayerBaseY(currentLayer);
    currentBlock.y = targetY;

    // Add some celebration effects
    this.celebrateBlockPlacement(currentBlock);

    this.currentBlockIndex++;
    if (this.currentBlockIndex >= 3) {
      this.currentBlockIndex = 0;
      this.chaosLevel++; // Increase chaos with each completed layer
      
      // Layer completion celebration
      this.celebrateLayerCompletion();
    }

    this.addNextBlock();
    this.updateScore();
  }

  private celebrateBlockPlacement(block: Block): void {
    // Quick scale pulse
    const originalScale = block.scale.clone();
    new Tween(block.scale)
      .to({ x: originalScale.x * 1.2, y: originalScale.y * 1.2, z: originalScale.z * 1.2 }, 150)
      .easing(Easing.Elastic.Out)
      .onComplete(() => {
        new Tween(block.scale)
          .to({ x: originalScale.x, y: originalScale.y, z: originalScale.z }, 150)
          .easing(Easing.Elastic.Out)
          .start();
      })
      .start();

    // Random color flash
    const originalColor = block.color;
    block.color = Math.random() * 0xFFFFFF;
    setTimeout(() => {
      block.color = originalColor;
    }, 200);
  }

  private celebrateLayerCompletion(): void {
    // Make all blocks in the current layer do a little dance
    const currentLayer = this.getCurrentLayer() - 1;
    const layerBlocks = this.getBlocksAtLayer(currentLayer);
    
    layerBlocks.forEach((block, index) => {
      new Tween(block.position)
        .to({ y: block.y + 0.5 }, 300)
        .delay(index * 100)
        .easing(Easing.Bounce.Out)
        .onComplete(() => {
          new Tween(block.position)
            .to({ y: block.y - 0.5 }, 300)
            .easing(Easing.Bounce.Out)
            .start();
        })
        .start();
    });

    // Show celebration message
    if (this.chaosLevel % 3 === 0) {
      this.showSillyMessage();
    }
  }

  private getCurrentLayer(): number {
    return Math.floor((this.blocks.length - 3) / 3) + 1;
  }

  private getLayerBaseY(layer: number): number {
    const { scale } = this.config.block.base;
    return layer * (scale.y + 0.05);
  }

  private getBlocksAtLayer(layer: number): Block[] {
    if (layer === 0) {
      return this.blocks.slice(0, 3);
    }
    const startIndex = 3 + (layer - 1) * 3;
    const endIndex = Math.min(startIndex + 3, this.blocks.length);
    return this.blocks.slice(startIndex, endIndex);
  }

  private addBaseLayer(): void {
    const { scale, color } = this.config.block.base;
    
    for (let i = 0; i < 3; i++) {
      const block = new Block(new Vector3(scale.x, scale.y, scale.z));
      block.position.set(
        (i - 1) * (scale.x + 0.1),
        0,
        0
      );
      block.rotation.set(0, 0, 0);
      block.color = parseInt(color, 16);
      
      this.stage.add(block.getMesh());
      this.blocks.push(block);
    }
  }

  private addNextBlock(): void {
    const currentLayer = this.getCurrentLayer();
    const isEvenLayer = currentLayer % 2 === 0;
    const baseY = this.getLayerBaseY(currentLayer);
    
    const block = this.pool.get();
    const { scale } = this.config.block.base;
    
    block.scale.set(scale.x, scale.y, scale.z);
    
    if (isEvenLayer) {
      block.rotation.set(0, 0, 0);
      block.position.set(
        (this.currentBlockIndex - 1) * (scale.x + 0.1),
        baseY,
        0
      );
      block.direction.set(Math.random() > 0.5 ? 1 : -1, 0, 0);
    } else {
      block.rotation.set(0, Math.PI / 2, 0);
      block.position.set(
        0,
        baseY,
        (this.currentBlockIndex - 1) * (scale.z + 0.1)
      );
      block.direction.set(0, 0, Math.random() > 0.5 ? 1 : -1);
    }
    
    block.color = this.getNextBlockColor();
    block.applyEffect(this.getRandomEffect());

    this.stage.add(block.getMesh());
    this.blocks.push(block);
    
    block.moveScalar(this.config.gameplay.distance);
    this.stage.setCamera(block.y + 5);
  }

  private updateScore(): void {
    const completeLayers = Math.floor((this.blocks.length - 3) / 3);
    this.scoreContainer.innerHTML = String(completeLayers);
    
    if (this.blocks.length >= this.config.instructions.height + 3) {
      this.instructions.classList.add('hide');
    }
  }

  private getRandomEffect(): BlockEffect {
    const effects: BlockEffect[] = [
      { type: 'grow', duration: 5000, magnitude: 0.3 },
      { type: 'shrink', duration: 5000, magnitude: 0.2 },
      { type: 'speed', duration: 3000, magnitude: 0.5 },
      { type: 'slow', duration: 3000, magnitude: 0.4 },
      { type: 'rainbow', duration: 4000, magnitude: 1 },
      { type: 'none', duration: 0, magnitude: 0 }
    ];
    
    // Higher chaos = more effects
    const effectProbability = this.config.gameplay.effectProbability + (this.chaosLevel * 0.05);
    
    if (Math.random() > effectProbability) {
      return effects[effects.length - 1]!;
    }
    
    return effects[Math.floor(Math.random() * (effects.length - 1))]!;
  }

  private moveCurrentBlock(deltaTime: number): void {
    if (this.state !== 'playing') return;

    const currentBlock = this.blocks[this.blocks.length - 1];
    if (!currentBlock || currentBlock.direction.length() === 0) return;

    // Speed increases with chaos level for more frantic gameplay
    const baseSpeed = 0.06 + Math.min(0.0003 * this.blocks.length, 0.03);
    const chaosSpeedMultiplier = 1 + (this.chaosLevel * 0.1);
    const speed = baseSpeed * chaosSpeedMultiplier;
    
    currentBlock.moveScalar(speed * deltaTime);

    this.reverseDirection();
  }

  private reverseDirection(): void {
    const currentBlock = this.blocks[this.blocks.length - 1];
    if (!currentBlock || currentBlock.direction.length() === 0) return;

    const currentLayer = this.getCurrentLayer();
    const baseBlocks = this.getBlocksAtLayer(currentLayer - 1);
    if (baseBlocks.length === 0) return;

    // Movement distance increases with chaos for more dramatic swings
    const baseDistance = this.config.gameplay.distance;
    const chaosDistance = baseDistance + (this.chaosLevel * 0.5);

    let centerX = 0, centerZ = 0;
    for (const block of baseBlocks) {
      centerX += block.x;
      centerZ += block.z;
    }
    centerX /= baseBlocks.length;
    centerZ /= baseBlocks.length;

    if (Math.abs(currentBlock.direction.x) > 0) {
      if (Math.abs(currentBlock.x - centerX) > chaosDistance) {
        currentBlock.direction.x *= -1;
      }
    } else if (Math.abs(currentBlock.direction.z) > 0) {
      if (Math.abs(currentBlock.z - centerZ) > chaosDistance) {
        currentBlock.direction.z *= -1;
      }
    }
  }

  private getNextBlockColor(): number {
    const { base, range, intensity } = this.config.block.colors;
    const offset = this.blocks.length + this.colorOffset;
    
    // More vibrant colors with chaos
    const chaosColorBoost = this.chaosLevel * 10;
    
    const r = Math.max(100, Math.min(255, base.r + range.r * Math.sin(intensity.r * offset) + chaosColorBoost));
    const g = Math.max(100, Math.min(255, base.g + range.g * Math.sin(intensity.g * offset) + chaosColorBoost));
    const b = Math.max(80, Math.min(255, base.b + range.b * Math.sin(intensity.b * offset) + chaosColorBoost));
    
    return (Math.floor(r) << 16) + (Math.floor(g) << 8) + Math.floor(b);
  }

  private updateLeaderboard(
    leaderboard: {
      user: User;
      score: number;
    }[]
  ) {
    this.leaderboardList.innerHTML = '';
    leaderboard.forEach((leaderboardItem) => {
      const leaderboardItemElement = document.createElement('div');
      leaderboardItemElement.classList.add('leaderboard-item');

      const img = document.createElement('img');
      img.src = leaderboardItem.user.snoovatarUrl;
      leaderboardItemElement.appendChild(img);
      const userText = document.createElement('span');
      userText.innerHTML = `${leaderboardItem.user.username} | <b>${leaderboardItem.score}</b>`;
      leaderboardItemElement.appendChild(userText);

      this.leaderboardList.appendChild(leaderboardItemElement);
    });
  }
}