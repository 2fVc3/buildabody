import { BoxGeometry, Mesh, MeshLambertMaterial, Vector3, SphereGeometry, CylinderGeometry, Group, ConeGeometry } from 'three';

export type ObstacleType = 
  | 'storyteller' 
  | 'bouncy_mushroom' 
  | 'speed_boost' 
  | 'slow_motion' 
  | 'teleporter' 
  | 'multiplier' 
  | 'confusion_cloud' 
  | 'gravity_well' 
  | 'wind_tunnel' 
  | 'rubber_wall' 
  | 'philosopher_stone' 
  | 'chaos_orb';

export type ObstacleEffect = {
  type: 'story' | 'bounce' | 'speed' | 'slow' | 'teleport' | 'multiply' | 'confuse' | 'gravity' | 'wind' | 'rubber' | 'philosophy' | 'chaos';
  magnitude: number;
  duration?: number;
  data?: any;
};

const STORYTELLER_STORIES = [
  "🏰 Once upon a time, there was a frog who questioned why humans launch amphibians...",
  "📚 Chapter 1: The Great Frog Rebellion of 1823 began when...",
  "🎭 In a land far, far away, frogs were considered sacred until...",
  "🌟 Legend tells of the Golden Frog who could predict terrible launchers...",
  "🔮 The ancient prophecy spoke of a chosen frog who would...",
  "🏛️ Historians debate whether the Great Frog War was caused by...",
  "🌙 Under the moonlight, the wise old frog whispered secrets about...",
  "⚔️ The epic battle between Frogs and Toads started because...",
  "🎪 The circus master never expected his frogs to develop consciousness and...",
  "🧙‍♂️ The wizard's spell backfired, giving all frogs the ability to..."
];

const PHILOSOPHER_QUOTES = [
  "🤔 What is the sound of one frog launching?",
  "💭 If a frog lands in a forest and no one's around, did it really judge your aim?",
  "🌌 Are we all just frogs in someone else's launching game?",
  "📖 To launch or not to launch, that is the amphibian question...",
  "🎭 Life is but a stage, and we are merely launched players...",
  "⚖️ The meaning of existence is... probably not frog launching...",
  "🔍 I think, therefore I am... launched by incompetent humans...",
  "🌊 You cannot step into the same launching pad twice...",
  "🎯 The unexamined launch is not worth living...",
  "🌟 In the beginning was the Word, and the Word was 'BOING'..."
];

export class Obstacle {
  private group: Group;
  private mesh: Mesh;
  private material: MeshLambertMaterial;
  private type: ObstacleType;
  private effect: ObstacleEffect;
  private isTriggered: boolean = false;
  private animationTime: number = 0;

  constructor(type: ObstacleType, position: Vector3) {
    this.type = type;
    this.group = new Group();
    this.effect = this.getEffectForType(type);
    
    this.createMesh();
    this.group.position.copy(position);
    this.addIdleAnimation();
  }

  private createMesh(): void {
    const config = this.getObstacleConfig(this.type);
    
    this.material = new MeshLambertMaterial({ color: config.color });
    this.mesh = new Mesh(config.geometry, this.material);
    
    // Add decorative elements based on type
    this.addDecorations();
    
    this.group.add(this.mesh);
  }

  private getObstacleConfig(type: ObstacleType) {
    const configs = {
      storyteller: {
        geometry: new BoxGeometry(2, 3, 1),
        color: 0x8B4513, // Saddle brown (like an old book)
      },
      bouncy_mushroom: {
        geometry: new CylinderGeometry(1.5, 0.5, 2, 16),
        color: 0xFF69B4, // Hot pink
      },
      speed_boost: {
        geometry: new ConeGeometry(1, 2, 8),
        color: 0x00FF00, // Lime green
      },
      slow_motion: {
        geometry: new SphereGeometry(1.2, 16, 12),
        color: 0x9370DB, // Medium purple
      },
      teleporter: {
        geometry: new CylinderGeometry(1.5, 1.5, 0.5, 16),
        color: 0x00FFFF, // Cyan
      },
      multiplier: {
        geometry: new BoxGeometry(1.5, 1.5, 1.5),
        color: 0xFFD700, // Gold
      },
      confusion_cloud: {
        geometry: new SphereGeometry(2, 12, 8),
        color: 0x808080, // Gray
      },
      gravity_well: {
        geometry: new CylinderGeometry(0.5, 2, 1, 16),
        color: 0x4B0082, // Indigo
      },
      wind_tunnel: {
        geometry: new CylinderGeometry(1, 1, 3, 16),
        color: 0x87CEEB, // Sky blue
      },
      rubber_wall: {
        geometry: new BoxGeometry(0.5, 4, 3),
        color: 0xFF1493, // Deep pink
      },
      philosopher_stone: {
        geometry: new SphereGeometry(1, 20, 16),
        color: 0x2F4F4F, // Dark slate gray
      },
      chaos_orb: {
        geometry: new SphereGeometry(1.5, 16, 12),
        color: 0xFF4500, // Orange red
      }
    };
    
    return configs[type];
  }

  private addDecorations(): void {
    switch (this.type) {
      case 'storyteller':
        // Add book pages
        const pageGeometry = new BoxGeometry(1.8, 0.1, 0.8);
        const pageMaterial = new MeshLambertMaterial({ color: 0xFFFFF0 });
        for (let i = 0; i < 3; i++) {
          const page = new Mesh(pageGeometry, pageMaterial);
          page.position.set(0, -0.5 + i * 0.3, 0.6);
          page.rotation.x = -0.2;
          this.group.add(page);
        }
        break;
        
      case 'bouncy_mushroom':
        // Add spots
        const spotGeometry = new SphereGeometry(0.2, 8, 6);
        const spotMaterial = new MeshLambertMaterial({ color: 0xFFFFFF });
        for (let i = 0; i < 5; i++) {
          const spot = new Mesh(spotGeometry, spotMaterial);
          const angle = (i / 5) * Math.PI * 2;
          spot.position.set(
            Math.cos(angle) * 1.2,
            0.5,
            Math.sin(angle) * 1.2
          );
          this.group.add(spot);
        }
        break;
        
      case 'teleporter':
        // Add swirling energy rings
        const ringGeometry = new CylinderGeometry(1.8, 1.8, 0.1, 16);
        const ringMaterial = new MeshLambertMaterial({ color: 0x00FFFF, transparent: true, opacity: 0.5 });
        for (let i = 0; i < 3; i++) {
          const ring = new Mesh(ringGeometry, ringMaterial);
          ring.position.y = i * 0.3;
          this.group.add(ring);
        }
        break;
        
      case 'chaos_orb':
        // Add chaotic spikes
        const spikeGeometry = new ConeGeometry(0.2, 1, 6);
        const spikeMaterial = new MeshLambertMaterial({ color: 0xFF0000 });
        for (let i = 0; i < 8; i++) {
          const spike = new Mesh(spikeGeometry, spikeMaterial);
          const angle = (i / 8) * Math.PI * 2;
          spike.position.set(
            Math.cos(angle) * 1.5,
            0,
            Math.sin(angle) * 1.5
          );
          spike.lookAt(0, 0, 0);
          this.group.add(spike);
        }
        break;
    }
  }

  private getEffectForType(type: ObstacleType): ObstacleEffect {
    const effects = {
      storyteller: { type: 'story' as const, magnitude: 1, duration: 0 },
      bouncy_mushroom: { type: 'bounce' as const, magnitude: 2.5, duration: 0 },
      speed_boost: { type: 'speed' as const, magnitude: 2.0, duration: 3000 },
      slow_motion: { type: 'slow' as const, magnitude: 0.3, duration: 4000 },
      teleporter: { type: 'teleport' as const, magnitude: 20, duration: 0 },
      multiplier: { type: 'multiply' as const, magnitude: 2, duration: 0 },
      confusion_cloud: { type: 'confuse' as const, magnitude: 1, duration: 5000 },
      gravity_well: { type: 'gravity' as const, magnitude: 2, duration: 2000 },
      wind_tunnel: { type: 'wind' as const, magnitude: 1.5, duration: 0 },
      rubber_wall: { type: 'rubber' as const, magnitude: 1.8, duration: 0 },
      philosopher_stone: { type: 'philosophy' as const, magnitude: 1, duration: 0 },
      chaos_orb: { type: 'chaos' as const, magnitude: 3, duration: 0 }
    };
    
    return effects[type];
  }

  private addIdleAnimation(): void {
    setInterval(() => {
      this.animationTime += 0.1;
      
      switch (this.type) {
        case 'storyteller':
          // Gentle book opening/closing
          this.mesh.rotation.y = Math.sin(this.animationTime * 0.5) * 0.1;
          break;
          
        case 'bouncy_mushroom':
          // Bouncy motion
          this.mesh.scale.y = 1 + Math.sin(this.animationTime * 2) * 0.1;
          break;
          
        case 'speed_boost':
          // Spinning motion
          this.mesh.rotation.y += 0.05;
          break;
          
        case 'teleporter':
          // Pulsing energy
          this.material.opacity = 0.7 + Math.sin(this.animationTime * 3) * 0.3;
          break;
          
        case 'chaos_orb':
          // Chaotic rotation
          this.mesh.rotation.x += 0.03;
          this.mesh.rotation.y += 0.05;
          this.mesh.rotation.z += 0.02;
          break;
          
        case 'philosopher_stone':
          // Wise floating motion
          this.group.position.y += Math.sin(this.animationTime) * 0.01;
          break;
      }
    }, 50);
  }

  public getMesh(): Group {
    return this.group;
  }

  public get position(): Vector3 {
    return this.group.position;
  }

  public checkCollision(frogPosition: Vector3, frogRadius: number = 1): boolean {
    const distance = this.position.distanceTo(frogPosition);
    return distance < (this.getCollisionRadius() + frogRadius);
  }

  private getCollisionRadius(): number {
    const radii = {
      storyteller: 2.5,
      bouncy_mushroom: 2,
      speed_boost: 1.5,
      slow_motion: 2,
      teleporter: 2,
      multiplier: 1.5,
      confusion_cloud: 3,
      gravity_well: 2.5,
      wind_tunnel: 1.5,
      rubber_wall: 2,
      philosopher_stone: 1.5,
      chaos_orb: 2.5
    };
    
    return radii[this.type];
  }

  public trigger(): { effect: ObstacleEffect; message: string; requiresInput?: boolean } {
    if (this.isTriggered && this.type !== 'bouncy_mushroom' && this.type !== 'rubber_wall') {
      return { effect: { type: 'story', magnitude: 0 }, message: "" };
    }
    
    this.isTriggered = true;
    this.addTriggerEffect();
    
    return this.getEffectMessage();
  }

  private getEffectMessage(): { effect: ObstacleEffect; message: string; requiresInput?: boolean } {
    const messages = {
      storyteller: {
        effect: this.effect,
        message: STORYTELLER_STORIES[Math.floor(Math.random() * STORYTELLER_STORIES.length)]!,
        requiresInput: true
      },
      bouncy_mushroom: {
        effect: this.effect,
        message: "🍄 BOING! The magical mushroom launches you skyward! 🍄"
      },
      speed_boost: {
        effect: this.effect,
        message: "⚡ ZOOM! You've been supercharged! ⚡"
      },
      slow_motion: {
        effect: this.effect,
        message: "🐌 Time slows to a crawl... everything feels like molasses... 🐌"
      },
      teleporter: {
        effect: this.effect,
        message: "✨ POOF! You've been teleported to a random location! ✨"
      },
      multiplier: {
        effect: this.effect,
        message: "💰 JACKPOT! Your score multiplier has been activated! 💰"
      },
      confusion_cloud: {
        effect: this.effect,
        message: "😵‍💫 The confusion cloud scrambles your brain! Up is down! Left is purple! 😵‍💫"
      },
      gravity_well: {
        effect: this.effect,
        message: "🌌 The gravity well pulls you into its mysterious depths! 🌌"
      },
      wind_tunnel: {
        effect: this.effect,
        message: "💨 WHOOSH! The wind tunnel catches you in its powerful current! 💨"
      },
      rubber_wall: {
        effect: this.effect,
        message: "🏓 BOING! The rubber wall bounces you back with extra force! 🏓"
      },
      philosopher_stone: {
        effect: this.effect,
        message: PHILOSOPHER_QUOTES[Math.floor(Math.random() * PHILOSOPHER_QUOTES.length)]!,
        requiresInput: true
      },
      chaos_orb: {
        effect: this.effect,
        message: "🌪️ CHAOS UNLEASHED! Reality bends around you! Anything could happen! 🌪️"
      }
    };
    
    return messages[this.type];
  }

  private addTriggerEffect(): void {
    // Visual feedback when triggered
    switch (this.type) {
      case 'storyteller':
        // Book glows
        this.material.emissive.setHex(0x444444);
        break;
        
      case 'bouncy_mushroom':
        // Mushroom compresses then expands
        this.mesh.scale.y = 0.5;
        setTimeout(() => {
          this.mesh.scale.y = 1.5;
          setTimeout(() => {
            this.mesh.scale.y = 1;
          }, 200);
        }, 100);
        break;
        
      case 'teleporter':
        // Bright flash
        this.material.emissive.setHex(0x00FFFF);
        setTimeout(() => {
          this.material.emissive.setHex(0x000000);
        }, 500);
        break;
        
      case 'chaos_orb':
        // Explosive color change
        const originalColor = this.material.color.getHex();
        this.material.color.setHex(Math.random() * 0xFFFFFF);
        setTimeout(() => {
          this.material.color.setHex(originalColor);
        }, 1000);
        break;
    }
  }

  public reset(): void {
    this.isTriggered = false;
    this.material.emissive.setHex(0x000000);
  }

  public getType(): ObstacleType {
    return this.type;
  }

  public getEffect(): ObstacleEffect {
    return this.effect;
  }
}