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

export type NoodleEffect = {
  type: 'normal' | 'wiggly' | 'bouncy';
  bounciness: number;
  wiggleSpeed: number;
};

export type BlockBaseConfig = {
  color: string;
  scale: Vector3;
  effect?: NoodleEffect;
};

export type BlockColorsConfig = {
  base: RGB;
  range: RGB;
  intensity: RGB;
};

export type BlockConfig = {
  base: BlockBaseConfig;
  colors: BlockColorsConfig;
};

export type SpeedConfig = {
  min: number;
  max: number;
  multiplier: number;
};

export type GameplayConfig = {
  distance: number;
  speed: SpeedConfig;
  accuracy: number;
  noodleBounciness: number;
  wiggleSpeed: number;
};

export type InstructionsConfig = {
  height: number;
};

export type CameraConfig = {
  near: number;
  far: number;
  viewSize: number;
  position: Vector3;
  lookAt: Vector3;
  offset: number;
};

export type BackgroundConfig = {
  color: string;
};

export type DirectionalLightConfig = {
  color: string;
  intensity: number;
  position: Vector3;
};

export type AmbientLightConfig = {
  color: string;
  intensity: number;
  position: Vector3;
};

export type LightConfig = {
  directional: DirectionalLightConfig;
  ambient: AmbientLightConfig;
};

export type PostConfig = {
  block: BlockConfig;
  gameplay: GameplayConfig;
  instructions: InstructionsConfig;
  camera: CameraConfig;
  background: BackgroundConfig;
  light: LightConfig;
};