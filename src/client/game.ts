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

type GameState = 'loading' | 'ready' | 'aiming' | 'flying' | 'ended';

const FROG_PERSONALITIES: FrogPersonality[] = [
  'dramatic', 'zen', 'chaotic', 'sleepy', 'confident', 'anxious', 'philosophical', 'rebellious'
];

const SILLY_ACHIEVEMENTS = [
  "🏆 First Flight Survivor! (The frog is mildly impressed)",
  "🎪 Bounce Master Extraordinaire! (Still thinks you're incompetent)",
  "🌟 Frog Whisperer Certified! (They're just being polite)",
  "🎭 Drama Queen of the Pond! (The frog demands better)",
  "🧘 Zen Master Amphibian! (Achieved despite your chaos)",
  "🤪 Chaos Theory Proven! (Thanks to your terrible aim)",
  "💤 Sleepy Launch Champion! (Woke up just to criticize you)",
  "💪 Confidence Incarnate! (No thanks to your launching)",
  "😰 Anxiety Overcomer! (Survived your incompetence)",
  "🤔 Philosophical Frog Sage! (Questions your life choices)",
  "😤 Rebellious Leap Legend! (Defied your expectations)"
];

export class Game {
  private devvit!: Devvit;
  private mainContainer!: HTMLElement;
  private scoreContainer!: HTMLElement;
  private powerMeter!: HTMLElement;
  private personalityDisplay!: HTMLElement;
  private quoteDisplay!: HTMLElement;
  private leaderboardList!: HTMLElement;
  private gameOverText!: HTMLElement;
  private launchButton!: HTMLElement;
  private ticker!: Ticker;

  private state: GameState = 'loading';
  private stage!: Stage;
  private currentFrog!: Frog;
  private totalScore: number = 0;
  private launchCount: number = 0;
  private power: number = 0;
  private angle: number = 0;
  private powerIncreasing: boolean = true;
  private isCharging: boolean = false;

  private stats!: Stats;
  private config!: PostConfig;

  private userAllTimeStats: {
    score: number;
    rank: number;
  } | null = null;

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
    this.powerMeter = document.getElementById('power-meter') as HTMLElement;
    this.personalityDisplay = document.getElementById('personality') as HTMLElement;
    this.quoteDisplay = document.getElementById('quote-display') as HTMLElement;
    this.leaderboardList = document.getElementById('leaderboard-list') as HTMLElement;
    this.gameOverText = document.getElementById('game-over-text') as HTMLElement;
    this.launchButton = document.getElementById('launch-button') as HTMLElement;

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
    // Listen for frog quotes - FIXED to properly handle all quote types
    window.addEventListener('frogQuote', (event: any) => {
      console.log('Received frog quote event:', event.detail);
      this.showQuote(event.detail.quote);
    });

    // Power meter control - Mouse events
    this.launchButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.startPowerMeter();
    });
    
    this.launchButton.addEventListener('mouseup', (e) => {
      e.preventDefault();
      this.launch();
    });

    // Power meter control - Touch events
    this.launchButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startPowerMeter();
    });
    
    this.launchButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.launch();
    });

    // Also handle mouse leave in case user drags off button
    this.launchButton.addEventListener('mouseleave', (e) => {
      if (this.isCharging) {
        this.launch();
      }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.state === 'aiming' && !this.isCharging) {
        e.preventDefault();
        this.startPowerMeter();
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && this.isCharging) {
        e.preventDefault();
        this.launch();
      }
    });
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
    if (this.state === 'aiming' && this.isCharging) {
      this.updatePowerMeter();
    } else if (this.state === 'flying') {
      this.updateFrogFlight(deltaTime);
    }
  }

  private updatePowerMeter(): void {
    if (this.powerIncreasing) {
      this.power += 3;
      if (this.power >= 100) {
        this.power = 100;
        this.powerIncreasing = false;
      }
    } else {
      this.power -= 3;
      if (this.power <= 0) {
        this.power = 0;
        this.powerIncreasing = true;
      }
    }

    this.powerMeter.style.width = `${this.power}%`;
    this.powerMeter.style.backgroundColor = this.getPowerColor();
  }

  private getPowerColor(): string {
    if (this.power < 30) return '#ff4444';
    if (this.power < 70) return '#ffaa44';
    return '#44ff44';
  }

  private updateFrogFlight(deltaTime: number): void {
    if (!this.currentFrog) return;

    const landed = this.currentFrog.update(
      deltaTime,
      this.config.launch.gravity,
      this.config.launch.bounceDecay
    );

    if (landed) {
      this.handleFrogLanding();
    }

    // Follow frog with camera
    this.stage.followFrog(this.currentFrog.position);
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
        await this.restartGame();
        break;
    }
  }

  private async startGame(): Promise<void> {
    this.totalScore = 0;
    this.launchCount = 0;
    this.updateScore();
    this.updateState('aiming');
    this.spawnNewFrog();
  }

  private spawnNewFrog(): void {
    // Remove old frog
    if (this.currentFrog) {
      this.stage.remove(this.currentFrog.getMesh());
    }

    // Create new frog with random personality
    const personality = FROG_PERSONALITIES[Math.floor(Math.random() * FROG_PERSONALITIES.length)]!;
    this.currentFrog = new Frog(personality);
    
    // Position at launch pad
    this.currentFrog.position.set(0, 0.5, 0);
    
    // Apply random effect
    const effect = this.getRandomEffect();
    if (effect.type !== 'none') {
      this.currentFrog.applyEffect(effect);
    }

    this.stage.add(this.currentFrog.getMesh());
    this.stage.resetCamera();
    
    this.updatePersonalityDisplay();
    
    // Show spawn quote with personality-specific insults
    const spawnQuotes = {
      dramatic: "🎭 A DRAMATIC frog appears! Prepare for theatrical criticism!",
      zen: "🧘 A ZEN frog appears... already disappointed in your energy...",
      chaotic: "🤪 A CHAOTIC frog appears! Ready for maximum mayhem!",
      sleepy: "😴 A SLEEPY frog appears... *yawn* this better be good...",
      confident: "💪 A CONFIDENT frog appears! Knows you'll mess this up!",
      anxious: "😰 An ANXIOUS frog appears! Already worried about your aim!",
      philosophical: "🤔 A PHILOSOPHICAL frog appears... questioning your existence...",
      rebellious: "😤 A REBELLIOUS frog appears! Won't follow your rules!"
    };
    
    this.showQuote(spawnQuotes[personality]);
  }

  private updatePersonalityDisplay(): void {
    const personality = this.currentFrog.personality;
    const emojis = {
      dramatic: '🎭',
      zen: '🧘',
      chaotic: '🤪',
      sleepy: '😴',
      confident: '💪',
      anxious: '😰',
      philosophical: '🤔',
      rebellious: '😤'
    };
    
    this.personalityDisplay.innerHTML = `${emojis[personality]} ${personality.toUpperCase()} FROG`;
  }

  private startPowerMeter(): void {
    if (this.state !== 'aiming' || this.isCharging) return;
    
    this.isCharging = true;
    this.power = 0;
    this.powerIncreasing = true;
    
    console.log('Started charging power meter');
  }

  private launch(): void {
    if (this.state !== 'aiming' || !this.isCharging) return;

    this.isCharging = false;
    
    // Use current power level
    const launchPower = Math.max(10, this.power); // Minimum 10% power
    this.angle = (Math.random() - 0.5) * Math.PI * 0.3; // Random angle
    
    console.log(`Launching frog with power: ${launchPower}%`);
    
    this.currentFrog.launch(launchPower, this.angle);
    this.launchCount++;
    
    this.updateState('flying');
    
    // Reset power meter
    this.power = 0;
    this.powerMeter.style.width = '0%';
  }

  private handleFrogLanding(): void {
    const frogScore = this.currentFrog.getScore();
    this.totalScore += frogScore;
    this.updateScore();
    
    // Show score with sarcastic comment
    const scoreComments = [
      `🎯 Landed! +${frogScore} points! (The frog is unimpressed)`,
      `💰 Score: +${frogScore}! (Could've been better, says the frog)`,
      `🏆 +${frogScore} points! (The frog thinks you got lucky)`,
      `⭐ ${frogScore} points earned! (Frog: "I did all the work")`
    ];
    
    const comment = scoreComments[Math.floor(Math.random() * scoreComments.length)]!;
    this.showQuote(comment);
    
    // Show achievement for special scores
    if (frogScore > 200) {
      setTimeout(() => {
        this.showAchievement();
      }, 2000);
    }

    setTimeout(() => {
      if (this.launchCount >= 5) {
        this.endGame();
      } else {
        this.updateState('aiming');
        this.spawnNewFrog();
      }
    }, 3000); // Longer delay to see landing quotes
  }

  private showAchievement(): void {
    const achievement = SILLY_ACHIEVEMENTS[Math.floor(Math.random() * SILLY_ACHIEVEMENTS.length)]!;
    this.showQuote(achievement);
  }

  private async endGame(): Promise<void> {
    this.updateState('ended');
    
    const data = await this.devvit.gameOver(this.totalScore);
    
    if (this.userAllTimeStats && this.totalScore > this.userAllTimeStats.score) {
      this.gameOverText.innerHTML = `🏆 NEW RECORD! 🏆<br/>You launched ${this.launchCount} frogs for ${this.totalScore} points!<br/>🐸 The frogs are... slightly less disappointed! 🐸`;
    } else {
      this.gameOverText.innerHTML = `🎪 FROG LAUNCHING COMPLETE! 🎪<br/>You launched ${this.launchCount} frogs for ${this.totalScore} points!<br/>🐸 The frogs have filed their complaints! 🐸`;
    }
    
    this.userAllTimeStats = data.userAllTimeStats;
    this.updateLeaderboard(data.leaderboard);
  }

  private async restartGame(): Promise<void> {
    // Epic frog farewell animation
    if (this.currentFrog) {
      // Final sarcastic goodbye
      this.showQuote("🐸 Finally! I'm escaping this amateur hour!");
      
      new Tween(this.currentFrog.position)
        .to({ y: 20 }, 1000)
        .easing(Easing.Back.Out)
        .onComplete(() => {
          this.stage.remove(this.currentFrog.getMesh());
        })
        .start();
    }

    setTimeout(async () => {
      await this.startGame();
    }, 1000);
  }

  private getRandomEffect(): FrogEffect {
    const effects: FrogEffect[] = [
      { type: 'rainbow', duration: 3000, magnitude: 1 },
      { type: 'giant', duration: 5000, magnitude: 0.5 },
      { type: 'tiny', duration: 5000, magnitude: 0.3 },
      { type: 'bouncy', duration: 4000, magnitude: 1.5 },
      { type: 'glowing', duration: 4000, magnitude: 1 },
      { type: 'spinning', duration: 3000, magnitude: 2 },
      { type: 'none', duration: 0, magnitude: 0 }
    ];
    
    if (Math.random() > 0.3) {
      return effects[effects.length - 1]!; // No effect
    }
    
    return effects[Math.floor(Math.random() * (effects.length - 1))]!;
  }

  private updateScore(): void {
    this.scoreContainer.innerHTML = String(this.totalScore);
  }

  private showQuote(quote: string): void {
    console.log('Showing quote:', quote); // Debug logging
    
    this.quoteDisplay.innerHTML = quote;
    this.quoteDisplay.classList.add('show');
    
    setTimeout(() => {
      this.quoteDisplay.classList.remove('show');
    }, 4000); // Longer display time for better readability
  }

  private updateLeaderboard(
    leaderboard: {
      user: User;
      score: number;
    }[]
  ) {
    this.leaderboardList.innerHTML = '';
    leaderboard.forEach((leaderboardItem, index) => {
      const leaderboardItemElement = document.createElement('div');
      leaderboardItemElement.classList.add('leaderboard-item');

      const rank = ['👑', '🥈', '🥉', '🐸'][index] || '🐸';
      
      const img = document.createElement('img');
      img.src = leaderboardItem.user.snoovatarUrl;
      leaderboardItemElement.appendChild(img);
      
      const userText = document.createElement('span');
      userText.innerHTML = `${rank} ${leaderboardItem.user.username} | <b>${leaderboardItem.score}</b>`;
      leaderboardItemElement.appendChild(userText);

      this.leaderboardList.appendChild(leaderboardItemElement);
    });
  }
}