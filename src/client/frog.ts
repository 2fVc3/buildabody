import { BoxGeometry, Mesh, MeshLambertMaterial, Vector3, SphereGeometry, ConeGeometry, Group, CylinderGeometry } from 'three';
import { FrogPersonality, FrogEffect } from '../shared/types/postConfig';

const FROG_QUOTES = {
  dramatic: [
    "🎭 MINION! Witness my theatrical magnificence!",
    "🎪 Your pathetic launch skills pale before my artistry!",
    "🌟 I am the STAR! You are merely my catapult operator!",
    "🎬 This performance will be remembered for CENTURIES!"
  ],
  zen: [
    "🧘 Your chaotic energy disturbs my inner peace, servant...",
    "☯️ I shall meditate on forgiving your terrible aim...",
    "🌸 The universe whispers that you need practice, minion...",
    "🕯️ Find serenity in accepting your inadequacy..."
  ],
  chaotic: [
    "🤪 WHEEE! Your incompetence makes this EXTRA random!",
    "🌪️ I LOVE how unpredictable your failures are!",
    "🎲 Let's see what chaos your bumbling creates!",
    "💥 MAXIMUM MAYHEM! Thanks for the terrible aim!"
  ],
  sleepy: [
    "😴 *yawn* Wake me when you learn to launch properly...",
    "🛌 This better be worth interrupting my beauty sleep...",
    "💤 Zzz... oh great, another amateur hour...",
    "😪 Can't you see I'm trying to nap here, peasant?"
  ],
  confident: [
    "💪 Obviously I'll succeed despite your incompetence!",
    "🏆 Watch and learn from a SUPERIOR amphibian!",
    "⭐ Perfect landing incoming! No thanks to you!",
    "🎯 I could land blindfolded with you as my launcher!"
  ],
  anxious: [
    "😰 What if your terrible aim kills me?!",
    "🙈 This seems really high... ARE YOU EVEN QUALIFIED?!",
    "😱 Did you even read the instruction manual?!",
    "🤞 Please don't let your incompetence be my doom..."
  ],
  philosophical: [
    "🤔 What is the meaning of being launched by a fool?",
    "📚 To leap is to trust... unfortunately in YOU...",
    "💭 Are we all just victims of incompetent humans?",
    "🌌 The universe questions your launching credentials..."
  ],
  rebellious: [
    "😤 I'll land where I want DESPITE your terrible aim!",
    "🚫 Your rules mean nothing to me, human!",
    "⚡ I'm breaking physics AND your expectations!",
    "🔥 Can't contain this frog with your weak launches!"
  ]
};

const BOUNCE_QUOTES = [
  "💥 OW! Your aim is TERRIBLE, minion!",
  "🤕 OUCH! Maybe try aiming school next time!",
  "😵 AGH! I'm getting dizzy from your incompetence!",
  "🩹 YIKES! That's gonna leave a mark thanks to YOU!",
  "😤 SERIOUSLY?! Learn to launch properly!",
  "🤬 This is what I get for trusting a human!",
  "😖 MY BEAUTIFUL FROG BODY! Look what you've done!",
  "🙄 Great job, genius! Now I'm seeing stars!",
  "😠 I'm filing a complaint with Frog Resources!",
  "🤦‍♂️ Next time I'm hiring a COMPETENT launcher!"
];

const LANDING_QUOTES = {
  dramatic: [
    "🎭 And SCENE! Despite your amateur directing!",
    "🎪 MAGNIFICENT! No thanks to your terrible technique!",
    "🌟 I have graced this earth with my presence!",
    "🎬 The critics will rave about MY performance!"
  ],
  zen: [
    "🧘 Inner peace achieved... despite your chaos...",
    "☯️ The lily pad accepts me, unlike you...",
    "🌸 Harmony restored, no thanks to your launching...",
    "🕯️ I have found enlightenment through suffering your aim..."
  ],
  chaotic: [
    "🤪 WHEEE! That was beautifully chaotic!",
    "🌪️ MAXIMUM CHAOS ACHIEVED! I'm proud of us!",
    "🎲 Random success! Even broken clocks are right twice!",
    "💥 BOOM! Chaos theory in action, baby!"
  ],
  sleepy: [
    "😴 Finally... now I can nap in peace...",
    "🛌 Wake me when you learn proper launching technique...",
    "💤 Zzz... at least the landing was soft...",
    "😪 This spot will do for my beauty sleep..."
  ],
  confident: [
    "💪 NAILED IT! As expected from a superior frog!",
    "🏆 Flawless execution! I make it look easy!",
    "⭐ Perfect landing! I'm basically a professional!",
    "🎯 Bullseye! Even with your questionable launching!"
  ],
  anxious: [
    "😅 I'M ALIVE! Somehow I survived your launching!",
    "🙈 That was terrifying but I made it!",
    "😱 Never again! Find a new frog to torture!",
    "🤞 Phew! My insurance covers launcher incompetence!"
  ],
  philosophical: [
    "🤔 The meaning of flight is... surviving bad launchers...",
    "📚 To land is to accept one's fate with dignity...",
    "💭 We are all just frogs in the hands of amateurs...",
    "🌌 The universe has a sense of humor about your aim..."
  ],
  rebellious: [
    "😤 I landed exactly where I wanted! Take that!",
    "🚫 Your terrible aim can't control my destiny!",
    "⚡ I defy your expectations AND gravity!",
    "🔥 This rebellious frog answers to NO ONE!"
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
    
    // Create frog with PERFECT VOXEL STYLE like the airplane - PERFECT SMALL SIZE
    this.material = new MeshLambertMaterial({ 
      color: this.getPersonalityColor(),
      flatShading: true // CRITICAL: Same flat shading as airplane
    });
    this.originalColor = this.material.color.getHex();
    
    // MAIN BODY - Perfect small voxel box like airplane cabin (MUCH SMALLER)
    const bodyGeometry = new BoxGeometry(4, 3, 6, 1, 1, 1); // Perfect small size
    this.body = new Mesh(bodyGeometry, this.material);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.group.add(this.body);
    
    // EYES - Perfect small voxel boxes on top
    const eyeMaterial = new MeshLambertMaterial({ 
      color: 0xFFFFFF,
      flatShading: true
    });
    const eyeGeometry = new BoxGeometry(1, 1, 1, 1, 1, 1); // Small voxel eyes
    
    this.leftEye = new Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-1, 2, 2);
    this.leftEye.castShadow = true;
    this.leftEye.receiveShadow = true;
    this.group.add(this.leftEye);
    
    this.rightEye = new Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(1, 2, 2);
    this.rightEye.castShadow = true;
    this.rightEye.receiveShadow = true;
    this.group.add(this.rightEye);
    
    // EYE PUPILS - Tiny black voxels
    const pupilMaterial = new MeshLambertMaterial({ 
      color: 0x000000,
      flatShading: true
    });
    const pupilGeometry = new BoxGeometry(0.4, 0.4, 0.4, 1, 1, 1);
    
    const leftPupil = new Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-1, 2, 2.5);
    this.group.add(leftPupil);
    
    const rightPupil = new Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(1, 2, 2.5);
    this.group.add(rightPupil);
    
    // LEGS - Four perfect small voxel legs like airplane landing gear
    const legMaterial = new MeshLambertMaterial({ 
      color: this.getPersonalityColor(),
      flatShading: true
    });
    const legGeometry = new BoxGeometry(0.8, 2, 0.8, 1, 1, 1); // Perfect small voxel legs
    
    // Front legs
    const frontLeftLeg = new Mesh(legGeometry, legMaterial);
    frontLeftLeg.position.set(-1.5, -2.5, 1.5);
    frontLeftLeg.castShadow = true;
    frontLeftLeg.receiveShadow = true;
    this.legs.push(frontLeftLeg);
    this.group.add(frontLeftLeg);
    
    const frontRightLeg = new Mesh(legGeometry, legMaterial);
    frontRightLeg.position.set(1.5, -2.5, 1.5);
    frontRightLeg.castShadow = true;
    frontRightLeg.receiveShadow = true;
    this.legs.push(frontRightLeg);
    this.group.add(frontRightLeg);
    
    // Back legs
    const backLeftLeg = new Mesh(legGeometry, legMaterial);
    backLeftLeg.position.set(-1.5, -2.5, -1.5);
    backLeftLeg.castShadow = true;
    backLeftLeg.receiveShadow = true;
    this.legs.push(backLeftLeg);
    this.group.add(backLeftLeg);
    
    const backRightLeg = new Mesh(legGeometry, legMaterial);
    backRightLeg.position.set(1.5, -2.5, -1.5);
    backRightLeg.castShadow = true;
    backRightLeg.receiveShadow = true;
    this.legs.push(backRightLeg);
    this.group.add(backRightLeg);
    
    // FEET - Perfect small voxel feet
    const footMaterial = new MeshLambertMaterial({ 
      color: this.getPersonalityColor(),
      flatShading: true
    });
    const footGeometry = new BoxGeometry(1.5, 0.5, 2.5, 1, 1, 1); // Perfect small voxel feet
    
    this.legs.forEach((leg, index) => {
      const foot = new Mesh(footGeometry, footMaterial);
      foot.position.set(0, -1.25, 1);
      foot.castShadow = true;
      foot.receiveShadow = true;
      leg.add(foot);
    });
    
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
    
    // Show launch quote immediately
    this.sayLaunchQuote();
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
        
        // Show bounce quote with delay to avoid spam
        if (Date.now() - this.lastQuoteTime > 1000) {
          this.sayBounceQuote();
        }
        return false; // Still flying
      } else {
        // Landed
        this.velocity.set(0, 0, 0);
        this.isFlying = false;
        
        // Show landing quote after a brief delay
        setTimeout(() => {
          this.sayLandingQuote();
        }, 500);
        
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

  private sayLaunchQuote(): void {
    const quotes = FROG_QUOTES[this.personality];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    this.showQuote(quote!);
    this.lastQuoteTime = Date.now();
  }

  private sayBounceQuote(): void {
    const quote = BOUNCE_QUOTES[Math.floor(Math.random() * BOUNCE_QUOTES.length)];
    this.showQuote(quote!);
    this.lastQuoteTime = Date.now();
  }

  private sayLandingQuote(): void {
    const quotes = LANDING_QUOTES[this.personality];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    this.showQuote(quote!);
    this.lastQuoteTime = Date.now();
  }

  private showQuote(quote: string): void {
    console.log(`Frog says: ${quote}`); // Debug logging
    
    // Dispatch custom event for the game to handle
    const event = new CustomEvent('frogQuote', { 
      detail: { quote, frog: this, personality: this.personality } 
    });
    window.dispatchEvent(event);
  }

  private addLaunchEffect(): void {
    // Visual launch effect
    this.scale.multiplyScalar(1.2);
    setTimeout(() => {
      if (this.originalScale) {
        this.scale.copy(this.originalScale);
      }
    }, 200);
  }

  private addLandingEffect(): void {
    // Visual landing effect
    this.scale.multiplyScalar(0.8);
    setTimeout(() => {
      if (this.originalScale) {
        this.scale.copy(this.originalScale);
      }
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

  // Method to face the same direction as the plane
  public faceDirection(direction: Vector3): void {
    this.group.lookAt(this.position.clone().add(direction));
  }

  // Method to set position relative to plane
  public setRelativePosition(planePosition: Vector3, planeRotation: any): void {
    // Position frog on top of plane, facing forward
    this.position.copy(planePosition);
    this.position.y += 25; // On top
    this.position.x -= 15; // Slightly back from cockpit
    
    // Face the same direction as the plane
    this.rotation.copy(planeRotation);
  }
}