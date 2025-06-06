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
  private blocks: Block[] = [];
  private currentBlockIndex: number = 0; // Track which block in current layer we're placing

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

    this.updateLeaderboard(initData.leaderboard);
    this.scoreContainer.innerHTML = '0';

    this.stage = new Stage(this.config, devicePixelRatio);
    this.stage.resize(width, height);

    this.blocks = [];
    this.currentBlockIndex = 0;
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
    this.checkTowerStability();
  }

  private checkTowerStability(): void {
    if (this.state !== 'playing') return;
    
    const currentBlock = this.blocks[this.blocks.length - 1];
    if (!currentBlock || currentBlock.direction.length() === 0) return; // Don't check if block is placed

    // Get the layer this block should be placed on
    const currentLayer = this.getCurrentLayer();
    const baseY = this.getLayerBaseY(currentLayer);
    const baseBlocks = this.getBlocksAtLayer(currentLayer - 1);
    
    if (baseBlocks.length === 0) return;

    // Check if block is too far from any base block
    let isSupported = false;
    for (const baseBlock of baseBlocks) {
      const xDiff = Math.abs(currentBlock.x - baseBlock.x);
      const zDiff = Math.abs(currentBlock.z - baseBlock.z);
      
      // If block overlaps with any base block by at least 20%, it's supported
      if (xDiff < (baseBlock.width + currentBlock.width) * 0.4 && 
          zDiff < (baseBlock.depth + currentBlock.depth) * 0.4) {
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
    
    // Animate blocks falling
    const fallDelay = 30;
    this.blocks.forEach((block, index) => {
      new Tween(block.position)
        .to({
          x: block.x + (Math.random() - 0.5) * 15,
          y: -30,
          z: block.z + (Math.random() - 0.5) * 15
        }, 2000)
        .delay(index * fallDelay)
        .easing(Easing.Bounce.Out)
        .start();

      new Tween(block.rotation)
        .to({
          x: Math.random() * Math.PI * 6,
          y: Math.random() * Math.PI * 6,
          z: Math.random() * Math.PI * 6
        }, 2000)
        .delay(index * fallDelay)
        .easing(Easing.Quadratic.Out)
        .start();
    });

    setTimeout(() => this.endGame(), 2500);
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
    this.updateState('playing');
    this.addNextBlock();
  }

  private async restartGame(): Promise<void> {
    this.updateState('resetting');

    // Animate blocks falling away
    const length = this.blocks.length;
    this.blocks.forEach((block, index) => {
      new Tween(block.position)
        .to({
          x: block.x + (Math.random() - 0.5) * 25,
          y: -40,
          z: block.z + (Math.random() - 0.5) * 25
        }, 1500)
        .delay(index * 30)
        .easing(Easing.Quadratic.In)
        .onComplete(() => {
          this.stage.remove(block.getMesh());
          this.pool.release(block);
        })
        .start();

      new Tween(block.rotation)
        .to({
          x: Math.random() * Math.PI * 4,
          y: Math.random() * Math.PI * 4,
          z: Math.random() * Math.PI * 4
        }, 1500)
        .delay(index * 30)
        .start();
    });

    const resetDuration = length * 30 + 1500;
    this.stage.resetCamera(resetDuration);

    setTimeout(async () => {
      this.blocks = [];
      this.currentBlockIndex = 0;
      this.addBaseLayer();
      await this.startGame();
    }, resetDuration);
  }

  private async endGame(): Promise<void> {
    const score = Math.floor((this.blocks.length - 3) / 3); // Count complete layers above base
    const data = await this.devvit.gameOver(score);

    if (this.userAllTimeStats && score > this.userAllTimeStats.score) {
      this.gameOverText.innerHTML = `New high score! ${score} layers built!`;
    } else {
      this.gameOverText.innerHTML = `Game Over! You built ${score} layers!`;
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

    // Check if block is supported by at least one base block
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

    // Minimum overlap required (20% of block area)
    const minOverlap = (currentBlock.width * currentBlock.depth) * 0.2;
    
    if (bestOverlap < minOverlap) {
      this.toppleTower();
      return;
    }

    // Stop the block movement
    currentBlock.direction.set(0, 0, 0);

    // Snap to proper position on the layer
    const targetY = this.getLayerBaseY(currentLayer);
    currentBlock.y = targetY;

    // Check if we completed a layer (3 blocks)
    this.currentBlockIndex++;
    if (this.currentBlockIndex >= 3) {
      this.currentBlockIndex = 0; // Reset for next layer
    }

    this.addNextBlock();
    this.updateScore();
  }

  private getCurrentLayer(): number {
    return Math.floor((this.blocks.length - 3) / 3) + 1; // Layer 0 is base, layer 1 is first built layer
  }

  private getLayerBaseY(layer: number): number {
    const { scale } = this.config.block.base;
    return layer * (scale.y + 0.05); // Small gap between layers
  }

  private getBlocksAtLayer(layer: number): Block[] {
    if (layer === 0) {
      return this.blocks.slice(0, 3); // Base layer
    }
    const startIndex = 3 + (layer - 1) * 3;
    const endIndex = Math.min(startIndex + 3, this.blocks.length);
    return this.blocks.slice(startIndex, endIndex);
  }

  private addBaseLayer(): void {
    const { scale, color } = this.config.block.base;
    
    // Create 3 blocks for the base layer (horizontal along X-axis)
    for (let i = 0; i < 3; i++) {
      const block = new Block(new Vector3(scale.x, scale.y, scale.z));
      block.position.set(
        (i - 1) * (scale.x + 0.1), // Space blocks slightly apart
        0,
        0
      );
      block.rotation.set(0, 0, 0); // Horizontal along X-axis
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
    
    // JENGA PATTERN: Alternate orientations between layers
    if (isEvenLayer) {
      // Even layers: horizontal along X-axis (like base layer)
      block.rotation.set(0, 0, 0);
      block.position.set(
        (this.currentBlockIndex - 1) * (scale.x + 0.1), // Position in layer
        baseY,
        0
      );
      block.direction.set(Math.random() > 0.5 ? 1 : -1, 0, 0); // Move along X
    } else {
      // Odd layers: horizontal along Z-axis (perpendicular to base)
      block.rotation.set(0, Math.PI / 2, 0);
      block.position.set(
        0,
        baseY,
        (this.currentBlockIndex - 1) * (scale.z + 0.1) // Position in layer
      );
      block.direction.set(0, 0, Math.random() > 0.5 ? 1 : -1); // Move along Z
    }
    
    block.color = this.getNextBlockColor();
    block.applyEffect(this.getRandomEffect());

    this.stage.add(block.getMesh());
    this.blocks.push(block);
    
    // Start the block moving from a distance
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
      { type: 'grow', duration: 5000, magnitude: 0.2 },
      { type: 'shrink', duration: 5000, magnitude: 0.15 },
      { type: 'speed', duration: 3000, magnitude: 0.4 },
      { type: 'slow', duration: 3000, magnitude: 0.3 },
      { type: 'rainbow', duration: 4000, magnitude: 1 },
      { type: 'none', duration: 0, magnitude: 0 }
    ];
    
    if (Math.random() > this.config.gameplay.effectProbability) {
      return effects[effects.length - 1]!;
    }
    
    return effects[Math.floor(Math.random() * (effects.length - 1))]!;
  }

  private addChoppedBlock(position: Vector3, scale: Vector3, sourceBlock: Block): void {
    const block = this.pool.get();

    block.rotation.copy(sourceBlock.rotation);
    block.scale.copy(scale);
    block.position.copy(position);
    block.color = sourceBlock.color;

    this.stage.add(block.getMesh());

    const dirX = Math.sign(block.x - sourceBlock.x);
    const dirZ = Math.sign(block.z - sourceBlock.z);
    new Tween(block.position)
      .to(
        {
          x: block.x + dirX * 15,
          y: block.y - 40,
          z: block.z + dirZ * 15,
        },
        1500
      )
      .easing(Easing.Quadratic.In)
      .onComplete(() => {
        this.stage.remove(block.getMesh());
        this.pool.release(block);
      })
      .start();

    new Tween(block.rotation)
      .to({ x: dirZ * 8, z: dirX * -8 }, 1200)
      .delay(100)
      .start();
  }

  private moveCurrentBlock(deltaTime: number): void {
    if (this.state !== 'playing') return;

    const currentBlock = this.blocks[this.blocks.length - 1];
    if (!currentBlock || currentBlock.direction.length() === 0) return;

    const speed = 0.06 + Math.min(0.0003 * this.blocks.length, 0.03);
    currentBlock.moveScalar(speed * deltaTime);

    this.reverseDirection();
  }

  private reverseDirection(): void {
    const currentBlock = this.blocks[this.blocks.length - 1];
    if (!currentBlock || currentBlock.direction.length() === 0) return;

    const currentLayer = this.getCurrentLayer();
    const baseBlocks = this.getBlocksAtLayer(currentLayer - 1);
    if (baseBlocks.length === 0) return;

    const { distance } = this.config.gameplay;

    // Find the center of the base layer
    let centerX = 0, centerZ = 0;
    for (const block of baseBlocks) {
      centerX += block.x;
      centerZ += block.z;
    }
    centerX /= baseBlocks.length;
    centerZ /= baseBlocks.length;

    // Check movement bounds based on current direction
    if (Math.abs(currentBlock.direction.x) > 0) {
      // Moving along X axis
      if (Math.abs(currentBlock.x - centerX) > distance) {
        currentBlock.direction.x *= -1;
      }
    } else if (Math.abs(currentBlock.direction.z) > 0) {
      // Moving along Z axis
      if (Math.abs(currentBlock.z - centerZ) > distance) {
        currentBlock.direction.z *= -1;
      }
    }
  }

  private getNextBlockColor(): number {
    const { base, range, intensity } = this.config.block.colors;
    const offset = this.blocks.length + this.colorOffset;
    
    // Wooden color variations
    const r = Math.max(180, Math.min(255, base.r + range.r * Math.sin(intensity.r * offset)));
    const g = Math.max(140, Math.min(200, base.g + range.g * Math.sin(intensity.g * offset)));
    const b = Math.max(80, Math.min(140, base.b + range.b * Math.sin(intensity.b * offset)));
    
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