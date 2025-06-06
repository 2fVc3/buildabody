export type Vector3<T = number> = {
  x: T;
  y: T;
  z: T;
};

export type RGB = {
  r: number;
  g: number;
  b: number;
};

export type FrogPersonality = 
  | 'dramatic' 
  | 'zen' 
  | 'chaotic' 
  | 'sleepy' 
  | 'confident' 
  | 'anxious' 
  | 'philosophical' 
  | 'rebellious';

export type FrogEffect = {
  type: 'rainbow' | 'giant' | 'tiny' | 'bouncy' | 'glowing' | 'spinning' | 'none';
  duration: number;
  magnitude: number;
};

export type FrogConfig = {
  baseColor: string;
  size: Vector3;
  personalities: FrogPersonality[];
  effects: FrogEffect[];
};

export type LaunchConfig = {
  minPower: number;
  maxPower: number;
  gravity: number;
  bounceDecay: number;
  maxBounces: number;
};

export type ScoringConfig = {
  landingBonus: number;
  bounceMultiplier: number;
  personalityBonus: number;
  effectBonus: number;
  distanceMultiplier: number;
};

export type CameraConfig = {
  near: number;
  far: number;
  viewSize: number;
  position: Vector3;
  lookAt: Vector3;
  followSpeed: number;
};

export type BackgroundConfig = {
  color: string;
  skyColor: string;
  groundColor: string;
};

export type LightConfig = {
  directional: {
    color: string;
    intensity: number;
    position: Vector3;
  };
  ambient: {
    color: string;
    intensity: number;
  };
};

export type PostConfig = {
  frog: FrogConfig;
  launch: LaunchConfig;
  scoring: ScoringConfig;
  camera: CameraConfig;
  background: BackgroundConfig;
  light: LightConfig;
};