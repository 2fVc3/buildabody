import { BoxGeometry, Mesh, MeshLambertMaterial, Vector3, SphereGeometry, ConeGeometry, Group } from 'three';
import { FrogPersonality, FrogEffect } from '../shared/types/postConfig';

const FROG_QUOTES = {
  dramatic: [
    "🎭 This leap shall be LEGENDARY!",
    "🎪 Behold my magnificent trajectory!",
    "🌟 I am the star of this pond!",
    "🎬 This is my moment to shine!"
  ],
  zen: [
    "🧘 I am one with the wind...",
    "☯️ The lily pad calls to me...",
    "🌸 Inner peace through flight...",
    "🕯️ Serenity in motion..."
  ],
  chaotic: [
    "🤪 WHEEEEE! CHAOS TIME!",
    "🌪️ Random direction GO!",
    "🎲 Let's see what happens!",
    "💥 MAXIMUM MAYHEM!"
  ],
  sleepy: [
    "😴 Zzz... oh, are we flying?",
    "🛌 This better be worth waking up for...",
    "💤 Can I nap mid-flight?",
    "😪 Five more minutes..."
  ],
  confident: [
    "💪 I've got this in the bag!",
    "🏆 Watch and learn, peasants!",
    "⭐ Perfect landing incoming!",
    "🎯 Bullseye guaranteed!"
  ],
  anxious: [
    "😰 What if I miss the pond?!",
    "🙈 This seems really high...",
    "😱 Did I remember to stretch?",
    "🤞 Please don't let me faceplant..."
  ],
  philosophical: [
    "🤔 What is the meaning of flight?",
    "📚 To leap is to live...",
    "💭 Are we all just flying frogs?",
    "🌌 The universe guides my path..."
  ],
  rebellious: [
    "😤 I'll land where I want!",
    "🚫 Rules are for other frogs!",
    "⚡ Breaking physics since birth!",
    "🔥 Can't contain this frog!"
  ]
};

export class Frog {
  private group: Group;
  private body: Mesh;
  private leftEye: Mesh;
  private rightEye: Mesh;
  private legs: Mesh[];
  private material: MeshLambertMaterial;
  
  public personality: FrogPersonality;
  public effect: FrogEffect = { type: 'none', duration: 0, magnitude: 0 };
  public velocity: Vector3 = new Vector3();
  public isFlying: boolean = false;
  public bounceCount: number = 0;
  public lastQuoteTime: number = 0;
  
  private originalColor: number;
  private originalScale: Vector3;

  constructor(personality: FrogPersonality) {
    this.personality = personality;
    this.group = new Group();
    this.legs = [];
    
    // Create frog body (main sphere)
    this.material = new MeshLambertMaterial({ color: this.getPersonalityColor() });
    this.originalColor = this.material.color.getHex();
    
    const bodyGeometry = new SphereGeometry(0.8, 16, 12);
    this.body = new Mesh(bodyGeometry, this.material);
    this.body.scale.set(1, 0.8, 1.2); // Make it more frog-like
    this.group.add(this.body);
    
    // Create eyes
    const eyeMaterial = new MeshLambertMaterial({ color: 0xFFFFFF });
    const eyeGeometry = new SphereGeometry(0.2, 8, 6);
    
    this.leftEye = new Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.3, 0.4, 0.6);
    this.group.add(this.leftEye);
    
    this.rightEye = new Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.3, 0.4, 0.6);
    this.group.add(this.rightEye);
    
    // Create legs
    const legMaterial = new MeshLambertMaterial({ color: this.getPersonalityColor() });
    const legGeometry = new ConeGeometry(0.15, 0.6, 6);
    
    for (let i = 0; i < 4; i++) {
      const leg = new Mesh(legGeometry, legMaterial);
      const angle = (i / 4) * Math.PI * 2;
      leg.position.set(
        Math.cos(angle) * 0.6,
        -0.5,
        Math.sin(angle) * 0.4
      );
      leg.rotation.x = Math.PI;
      this.legs.push(leg);
      this.group.add(leg);
    }
    
    this.originalScale = this.group.scale.clone();
    this.addPersonalityAnimation();
  }

  private getPersonalityColor(): number {
    const colors = {
      dramatic: 0xFF1493,    // Deep pink
      zen: 0x90EE90,         // Light green
      chaotic: 0xFF4500,     // Orange red
      sleepy: 0x9370DB,      // Medium purple
      confident: 0xFFD700,   // Gold
      anxious: 0x87CEEB,     // Sky blue
      philosophical: 0x8B4513, // Saddle brown
      rebellious: 0x8B0000   // Dark red
    };
    return colors[this.personality];
  }

  private addPersonalityAnimation(): void {
    // Continuous personality-based animations
    setInterval(() => {
      if (this.isFlying) return;
      
      switch (this.personality) {
        case 'dramatic':
          // Dramatic pose changes
          this.group.rotation.y += 0.02;
          break;
        case 'zen':
          // Gentle breathing motion
          const breathe = Math.sin(Date.now() * 0.003) * 0.05;
          this.group.scale.y = this.originalScale.y + breathe;
          break;
        case 'chaotic':
          // Random twitches
          if (Math.random() < 0.1) {
            this.group.rotation.z = (Math.random() - 0.5) * 0.2;
          }
          break;
        case 'sleepy':
          // Slow nodding
          this.group.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
          break;
        case 'anxious':
          // Nervous shaking
          this.group.position.x += (Math.random() - 0.5) * 0.02;
          this.group.position.z += (Math.random() - 0.5) * 0.02;
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

  public get rotation() {
    return this.group.rotation;
  }

  public get scale(): Vector3 {
    return this.group.scale;
  }

  public launch(power: number, angle: number): void {
    this.isFlying = true;
    this.bounceCount = 0;
    
    // Calculate launch velocity based on personality
    const personalityMultiplier = this.getPersonalityLaunchMultiplier();
    const adjustedPower = power * personalityMultiplier;
    
    this.velocity.set(
      Math.cos(angle) * adjustedPower * 0.3,
      adjustedPower * 0.4,
      Math.sin(angle) * adjustedPower * 0.3
    );
    
    // Add some personality-based randomness
    if (this.personality === 'chaotic') {
      this.velocity.x += (Math.random() - 0.5) * 2;
      this.velocity.z += (Math.random() - 0.5) * 2;
    }
    
    this.sayQuote();
    this.addLaunchEffect();
  }

  private getPersonalityLaunchMultiplier(): number {
    const multipliers = {
      dramatic: 1.2,      // Extra dramatic launches
      zen: 0.9,           // Calm, controlled launches
      chaotic: 1.3,       // Unpredictable power
      sleepy: 0.7,        // Low energy launches
      confident: 1.1,     // Slightly better launches
      anxious: 0.8,       // Nervous, weaker launches
      philosophical: 1.0, // Thoughtful, average launches
      rebellious: 1.15    // Defiant, strong launches
    };
    return multipliers[this.personality];
  }

  public update(deltaTime: number, gravity: number, bounceDecay: number): boolean {
    if (!this.isFlying) return false;
    
    // Apply gravity
    this.velocity.y -= gravity * deltaTime * 0.01;
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime * 0.01));
    
    // Rotation during flight
    this.rotation.x += this.velocity.length() * deltaTime * 0.001;
    this.rotation.z += this.velocity.x * deltaTime * 0.001;
    
    // Check for ground collision
    if (this.position.y <= 0.5) {
      this.position.y = 0.5;
      
      if (Math.abs(this.velocity.y) > 0.5) {
        // Bounce
        this.velocity.y = -this.velocity.y * bounceDecay;
        this.velocity.x *= bounceDecay;
        this.velocity.z *= bounceDecay;
        this.bounceCount++;
        
        this.sayBounceQuote();
        return false; // Still flying
      } else {
        // Landed
        this.velocity.set(0, 0, 0);
        this.isFlying = false;
        this.sayLandingQuote();
        this.addLandingEffect();
        return true; // Landed
      }
    }
    
    return false; // Still flying
  }

  public applyEffect(effect: FrogEffect): void {
    this.effect = effect;
    
    switch (effect.type) {
      case 'rainbow':
        this.startRainbowEffect();
        break;
      case 'giant':
        this.scale.multiplyScalar(1 + effect.magnitude);
        break;
      case 'tiny':
        this.scale.multiplyScalar(1 - effect.magnitude);
        break;
      case 'bouncy':
        // Will affect bounce behavior in update
        break;
      case 'glowing':
        this.material.emissive.setHex(0x444444);
        break;
      case 'spinning':
        // Will affect rotation in update
        break;
    }
    
    // Clear effect after duration
    setTimeout(() => {
      this.clearEffect();
    }, effect.duration);
  }

  private startRainbowEffect(): void {
    const rainbowInterval = setInterval(() => {
      if (this.effect.type !== 'rainbow') {
        clearInterval(rainbowInterval);
        return;
      }
      const hue = (Date.now() * 0.001) % 1;
      this.material.color.setHSL(hue, 0.8, 0.6);
    }, 100);
  }

  private clearEffect(): void {
    this.effect = { type: 'none', duration: 0, magnitude: 0 };
    this.material.color.setHex(this.originalColor);
    this.material.emissive.setHex(0x000000);
    this.scale.copy(this.originalScale);
  }

  private sayQuote(): void {
    if (Date.now() - this.lastQuoteTime < 2000) return;
    
    const quotes = FROG_QUOTES[this.personality];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    this.showQuote(quote!);
    this.lastQuoteTime = Date.now();
  }

  private sayBounceQuote(): void {
    const bounceQuotes = [
      "🏀 Boing boing!",
      "⚡ Still got it!",
      "🎾 Bouncy castle mode!",
      "🤸 Acrobatic frog!"
    ];
    const quote = bounceQuotes[Math.floor(Math.random() * bounceQuotes.length)];
    this.showQuote(quote!);
  }

  private sayLandingQuote(): void {
    const landingQuotes = {
      dramatic: "🎭 And SCENE! *takes a bow*",
      zen: "🧘 Perfect harmony achieved...",
      chaotic: "🤪 NAILED IT! ...I think?",
      sleepy: "😴 Finally, time for a nap...",
      confident: "💪 Exactly as planned!",
      anxious: "😅 I'm alive! I'M ALIVE!",
      philosophical: "🤔 The journey ends where it began...",
      rebellious: "😤 Told you I'd land where I wanted!"
    };
    
    const quote = landingQuotes[this.personality];
    this.showQuote(quote);
  }

  private showQuote(quote: string): void {
    // This would integrate with the game's UI system
    const event = new CustomEvent('frogQuote', { 
      detail: { quote, frog: this } 
    });
    window.dispatchEvent(event);
  }

  private addLaunchEffect(): void {
    // Visual launch effect
    this.scale.multiplyScalar(1.2);
    setTimeout(() => {
      this.scale.copy(this.originalScale);
    }, 200);
  }

  private addLandingEffect(): void {
    // Visual landing effect
    this.scale.multiplyScalar(0.8);
    setTimeout(() => {
      this.scale.copy(this.originalScale);
    }, 300);
  }

  public getScore(): number {
    const distance = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);
    const personalityBonus = this.getPersonalityBonus();
    const bounceBonus = this.bounceCount * 10;
    const effectBonus = this.effect.type !== 'none' ? 25 : 0;
    
    return Math.floor(distance * 10 + personalityBonus + bounceBonus + effectBonus);
  }

  private getPersonalityBonus(): number {
    const bonuses = {
      dramatic: 50,      // Style points
      zen: 30,           // Peaceful bonus
      chaotic: 40,       // Chaos bonus
      sleepy: 20,        // Effort bonus
      confident: 35,     // Confidence bonus
      anxious: 45,       // Overcoming fear bonus
      philosophical: 25, // Wisdom bonus
      rebellious: 55     // Rule-breaking bonus
    };
    return bonuses[this.personality];
  }
}