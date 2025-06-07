import { Easing, Tween, update as tweenjsUpdate } from '@tweenjs/tween.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Vector3 } from 'three';
import { Frog } from './frog';
import { Stage } from './stage';
import { Ticker } from './ticker';
import { getEnv } from './utils/env';
import { Devvit } from './devvit';
import type { PostConfig, FrogPersonality, FrogEffect } from '../shared/types/postConfig';
import { User } from '../shared/types/user';
import { InitMessage } from '../shared/types/message';

type GameState = 'loading' | 'ready' | 'playing' | 'crashed' | 'ended';

const FROG_PERSONALITIES: FrogPersonality[] = [
  'dramatic', 'zen', 'chaotic', 'sleepy', 'confident', 'anxious', 'philosophical', 'rebellious'
];

export class Game {
  private devvit!: Devvit;
  private mainContainer!: HTMLElement;
  private scoreContainer!: HTMLElement;
  private speedDisplay!: HTMLElement;
  private planesAvoidedDisplay!: HTMLElement;
  private personalityDisplay!: HTMLElement;
  private quoteDisplay!: HTMLElement;
  private leaderboardList!: HTMLElement;
  private fullLeaderboardList!: HTMLElement;
  private gameOverText!: HTMLElement;
  private startButton!: HTMLElement;
  private leaderboardButton!: HTMLElement;
  private instructionsButton!: HTMLElement;
  private leaderboardScreen!: HTMLElement;
  private instructionsScreen!: HTMLElement;
  private closeLeaderboard!: HTMLElement;
  private closeInstructions!: HTMLElement;
  private ticker!: Ticker;

  private state: GameState = 'loading';
  private stage!: Stage;
  private totalScore: number = 0;
  private finalDistance: number = 0;

  private stats!: Stats;
  private config!: PostConfig;

  private userAllTimeStats: {
    score: number;
    rank: number;
  } | null = null;

  private leaderboardData: {
    user: User;
    score: number;
  }[] = [];

  // CRITICAL FIX: Quote timing management
  private currentQuoteTimeout: number | null = null;

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
    this.leaderboardData = initData.leaderboard;

    this.mainContainer = document.getElementById('container') as HTMLElement;
    this.scoreContainer = document.getElementById('score') as HTMLElement;
    this.speedDisplay = document.getElementById('speed-display') as HTMLElement;
    this.planesAvoidedDisplay = document.getElementById('planes-avoided') as HTMLElement;
    this.personalityDisplay = document.getElementById('personality') as HTMLElement;
    this.quoteDisplay = document.getElementById('quote-display') as HTMLElement;
    this.leaderboardList = document.getElementById('leaderboard-list') as HTMLElement;
    this.fullLeaderboardList = document.getElementById('full-leaderboard-list') as HTMLElement;
    this.gameOverText = document.getElementById('game-over-text') as HTMLElement;
    this.startButton = document.getElementById('start-button') as HTMLElement;
    this.leaderboardButton = document.getElementById('leaderboard-button') as HTMLElement;
    this.instructionsButton = document.getElementById('instructions-button') as HTMLElement;
    this.leaderboardScreen = document.querySelector('.leaderboard-screen') as HTMLElement;
    this.instructionsScreen = document.querySelector('.instructions-screen') as HTMLElement;
    this.closeLeaderboard = document.getElementById('close-leaderboard') as HTMLElement;
    this.closeInstructions = document.getElementById('close-instructions') as HTMLElement;

    this.updateLeaderboard(initData.leaderboard);
    this.scoreContainer.innerHTML = '0';

    this.stage = new Stage(this.config, devicePixelRatio);
    this.stage.resize(width, height);

    this.setupEventListeners();

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

  private setupEventListeners(): void {
    // Listen for game events
    window.addEventListener('planeAvoided', (event: any) => {
      this.showQuote(event.detail.message, 2000); // CRITICAL FIX: Shorter duration
      this.updateGameStats(event.detail.planesAvoided, event.detail.speed);
    });

    window.addEventListener('planeCrash', (event: any) => {
      this.showQuote(event.detail.message, 3000); // CRITICAL FIX: Medium duration
      this.updateState('crashed');
    });

    window.addEventListener('frogDestroyed', (event: any) => {
      this.showQuote(event.detail.message, 3000); // CRITICAL FIX: Medium duration
      this.handleGameOver(0); // No score for destroyed frog
    });

    window.addEventListener('gameReset', (event: any) => {
      this.showQuote(event.detail.message, 2000); // CRITICAL FIX: Shorter duration
      // CRITICAL FIX: Don't auto-start, return to ready state
      this.updateState('ready');
      this.updateGameStats(0, '1.0');
    });

    window.addEventListener('gameOver', (event: any) => {
      this.finalDistance = event.detail.distance;
      this.handleGameOver(event.detail.score);
    });

    // Listen for frog quotes
    window.addEventListener('frogQuote', (event: any) => {
      this.showQuote(event.detail.quote, 3000); // CRITICAL FIX: Medium duration for frog quotes
    });

    // Menu navigation
    this.leaderboardButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showLeaderboardScreen();
    });

    this.instructionsButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showInstructionsScreen();
    });

    this.startButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.action();
    });

    this.closeLeaderboard.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hideLeaderboardScreen();
    });

    this.closeInstructions.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hideInstructionsScreen();
    });
  }

  private showLeaderboardScreen(): void {
    this.leaderboardScreen.classList.add('show');
    this.updateFullLeaderboard();
  }

  private hideLeaderboardScreen(): void {
    this.leaderboardScreen.classList.remove('show');
  }

  private showInstructionsScreen(): void {
    this.instructionsScreen.classList.add('show');
  }

  private hideInstructionsScreen(): void {
    this.instructionsScreen.classList.remove('show');
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
    // Game updates are handled in the stage
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
      case 'ended':
        // CRITICAL FIX: Return to main menu instead of restarting immediately
        await this.returnToMainMenu();
        break;
    }
  }

  private async startGame(): Promise<void> {
    this.totalScore = 0;
    this.finalDistance = 0;
    this.updateScore();
    this.updateState('playing');
    
    // CRITICAL FIX: Start the game in the stage
    this.stage.startGame();
    
    this.showQuote('🛩️ Dodge the incoming planes to build up speed! Crash strategically to launch your frog!', 3000);
  }

  private async returnToMainMenu(): Promise<void> {
    // CRITICAL FIX: Reset to main menu state
    this.totalScore = 0;
    this.finalDistance = 0;
    this.updateScore();
    this.updateState('ready');
    this.showQuote('🛩️ Ready for another aerial frog adventure!', 2000);
  }

  private updateGameStats(planesAvoided: number, speed: string): void {
    if (this.speedDisplay) {
      this.speedDisplay.innerHTML = `Speed: ${speed}x`;
    }
    if (this.planesAvoidedDisplay) {
      this.planesAvoidedDisplay.innerHTML = `Avoided: ${planesAvoided}`;
    }
  }

  private async handleGameOver(score: number): Promise<void> {
    this.totalScore = score;
    this.updateScore();
    this.updateState('ended');
    
    if (score > 0) {
      const data = await this.devvit.gameOver(this.totalScore);
      
      if (this.userAllTimeStats && this.totalScore > this.userAllTimeStats.score) {
        this.gameOverText.innerHTML = `🏆 NEW FLIGHT RECORD! 🏆<br/>Your frog flew ${this.finalDistance.toFixed(1)} units for ${this.totalScore} points!<br/>🛩️ The frog is... slightly less disappointed in your piloting! 🐸<br/><br/>🎮 Click to return to main menu`;
      } else {
        this.gameOverText.innerHTML = `🎪 AERIAL FROG MISSION COMPLETE! 🎪<br/>Your frog flew ${this.finalDistance.toFixed(1)} units for ${this.totalScore} points!<br/>🛩️ The frog has filed their flight complaints! 🐸<br/><br/>🎮 Click to return to main menu`;
      }
      
      this.userAllTimeStats = data.userAllTimeStats;
      this.leaderboardData = data.leaderboard;
      this.updateLeaderboard(data.leaderboard);
    } else {
      this.gameOverText.innerHTML = `💥 FROG DESTROYED! 💥<br/>Your frog was obliterated by a destroyer plane!<br/>🛩️ No points awarded for frog destruction! 🐸<br/><br/>🎮 Click to return to main menu`;
    }
  }

  private updateScore(): void {
    this.scoreContainer.innerHTML = String(this.totalScore);
  }

  // CRITICAL FIX: Better quote management with timing and queue
  private showQuote(quote: string, duration: number = 3000): void {
    // Clear any existing quote timeout
    if (this.currentQuoteTimeout) {
      clearTimeout(this.currentQuoteTimeout);
      this.currentQuoteTimeout = null;
    }

    // Show the new quote
    this.quoteDisplay.innerHTML = quote;
    this.quoteDisplay.classList.add('show');
    
    // Set timeout to hide quote after specified duration
    this.currentQuoteTimeout = window.setTimeout(() => {
      this.quoteDisplay.classList.remove('show');
      this.currentQuoteTimeout = null;
    }, duration);
  }

  private updateLeaderboard(
    leaderboard: {
      user: User;
      score: number;
    }[]
  ) {
    // Update compact leaderboard
    this.leaderboardList.innerHTML = '';
    leaderboard.slice(0, 4).forEach((leaderboardItem, index) => {
      const leaderboardItemElement = document.createElement('div');
      leaderboardItemElement.classList.add('leaderboard-item');

      const rank = ['👑', '🥈', '🥉', '🛩️'][index] || '🛩️';
      
      const img = document.createElement('img');
      img.src = leaderboardItem.user.snoovatarUrl;
      leaderboardItemElement.appendChild(img);
      
      const userText = document.createElement('span');
      userText.innerHTML = `${rank} ${leaderboardItem.user.username} | <b>${leaderboardItem.score}</b>`;
      leaderboardItemElement.appendChild(userText);

      this.leaderboardList.appendChild(leaderboardItemElement);
    });

    // Store for full leaderboard
    this.leaderboardData = leaderboard;
  }

  private updateFullLeaderboard(): void {
    this.fullLeaderboardList.innerHTML = '';
    
    if (this.leaderboardData.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.padding = '40px';
      emptyMessage.style.color = 'var(--text-secondary)';
      emptyMessage.style.fontSize = '18px';
      emptyMessage.style.fontWeight = '600';
      emptyMessage.innerHTML = '🛩️ No aerial frog pilots yet! Be the first to take flight! 🐸';
      this.fullLeaderboardList.appendChild(emptyMessage);
      return;
    }

    this.leaderboardData.forEach((leaderboardItem, index) => {
      const leaderboardItemElement = document.createElement('div');
      leaderboardItemElement.classList.add('full-leaderboard-item');

      const rankEmojis = ['👑', '🥈', '🥉'];
      const rank = rankEmojis[index] || '🛩️';
      
      const rankElement = document.createElement('div');
      rankElement.classList.add('rank');
      rankElement.innerHTML = `${rank}<br/>#${index + 1}`;
      leaderboardItemElement.appendChild(rankElement);

      const img = document.createElement('img');
      img.src = leaderboardItem.user.snoovatarUrl;
      img.alt = `${leaderboardItem.user.username}'s avatar`;
      leaderboardItemElement.appendChild(img);
      
      const infoElement = document.createElement('div');
      infoElement.classList.add('info');
      
      const usernameElement = document.createElement('div');
      usernameElement.classList.add('username');
      usernameElement.innerHTML = leaderboardItem.user.username;
      infoElement.appendChild(usernameElement);
      
      const scoreElement = document.createElement('div');
      scoreElement.classList.add('score');
      scoreElement.innerHTML = `${leaderboardItem.score} points`;
      infoElement.appendChild(scoreElement);
      
      leaderboardItemElement.appendChild(infoElement);
      this.fullLeaderboardList.appendChild(leaderboardItemElement);
    });
  }
}