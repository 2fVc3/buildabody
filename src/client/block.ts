import { BoxGeometry, Euler, Mesh, MeshToonMaterial, Vector3 } from 'three';
import { BlockEffect } from '../shared/types/postConfig';

type CutState = 'missed' | 'perfect' | 'chopped';

export class Block {
  public direction: Vector3 = new Vector3(0, 0, 0);
  public effect: BlockEffect = { type: 'none', duration: 0, magnitude: 0 };

  private mesh: Mesh;
  private material: MeshToonMaterial;
  private originalScale: Vector3;

  constructor(scale: Vector3 | undefined = undefined) {
    // Create a French fry material with proper shading
    this.material = new MeshToonMaterial({
      roughness: 0.3,
      metalness: 0.1,
    });

    // Create a French fry shaped geometry - longer and thinner
    const geometry = new BoxGeometry(1, 1, 1);
    this.mesh = new Mesh(geometry, this.material);

    if (scale !== undefined) {
      this.mesh.scale.copy(scale);
      this.originalScale = scale.clone();
    }

    // Rotate for Jenga-style placement
    this.mesh.rotation.set(0, Math.PI / 2, 0);
  }

  // prettier-ignore
  public get position(): Vector3 { return this.mesh.position; }
  // prettier-ignore
  public get rotation(): Euler { return this.mesh.rotation; }
  // prettier-ignore
  public get scale(): Vector3 { return this.mesh.scale; }

  // prettier-ignore
  public get x(): number { return this.mesh.position.x; }
  // prettier-ignore
  public get y(): number { return this.mesh.position.y; }
  // prettier-ignore
  public get z(): number { return this.mesh.position.z; }

  // prettier-ignore
  public set x(value: number) { this.mesh.position.x = value; }
  // prettier-ignore
  public set y(value: number) { this.mesh.position.y = value; }
  // prettier-ignore
  public set z(value: number) { this.mesh.position.z = value; }

  // prettier-ignore
  public get width(): number { return this.scale.x; }
  // prettier-ignore
  public get height(): number { return this.scale.y; }
  // prettier-ignore
  public get depth(): number { return this.scale.z; }

  // prettier-ignore
  public get color(): number { return this.material.color.getHex(); }
  // prettier-ignore
  public set color(value: number) { this.material.color.set(value); }

  public getMesh(): Mesh {
    return this.mesh;
  }

  public applyEffect(effect: BlockEffect): void {
    this.effect = effect;
    
    switch (effect.type) {
      case 'grow':
        // Scale more in length for fry effect
        this.scale.y *= (1 + effect.magnitude * 1.5);
        this.scale.x *= (1 + effect.magnitude * 0.5);
        this.scale.z *= (1 + effect.magnitude * 0.5);
        break;
      case 'shrink':
        this.scale.multiplyScalar(1 - effect.magnitude);
        break;
      case 'rainbow':
        // Golden-brown color variations for fries
        this.material.color.setHSL(0.08 + Math.random() * 0.04, 0.7, 0.6);
        break;
    }
  }

  public moveScalar(scalar: number): void {
    let speed = scalar;
    if (this.effect.type === 'speed') {
      speed *= (1 + this.effect.magnitude);
    } else if (this.effect.type === 'slow') {
      speed *= (1 - this.effect.magnitude);
    }

    // Jenga-style movement
    const level = Math.floor(this.y / (this.height + 0.1));
    const isAlternating = level % 2 === 0;

    if (isAlternating) {
      this.position.set(
        this.position.x + this.direction.x * speed,
        this.position.y,
        this.position.z
      );
    } else {
      this.position.set(
        this.position.x,
        this.position.y,
        this.position.z + this.direction.z * speed
      );
    }
  }

  public cut(
    targetBlock: Block,
    accuracy: number
  ): {
    state: CutState;
    position?: Vector3;
    scale?: Vector3;
  } {
    const position = this.position.clone();
    const scale = this.scale.clone();

    const level = Math.floor(this.y / (this.height + 0.1));
    const isAlternating = level % 2 === 0;

    if (isAlternating) {
      const overlap = targetBlock.width - Math.abs(this.x - targetBlock.x);
      if (overlap < 0) return { state: 'missed' };

      if (this.scale.x - overlap < accuracy) {
        this.x = targetBlock.x;
        return { state: 'perfect' };
      }

      this.scale.x = overlap;
      this.x = (targetBlock.x + this.x) * 0.5;

      scale.x -= overlap;
      position.x = this.x + (scale.x + this.width) * (this.x < targetBlock.x ? -0.5 : 0.5);
    } else {
      const overlap = targetBlock.depth - Math.abs(this.z - targetBlock.z);
      if (overlap < 0) return { state: 'missed' };

      if (this.scale.z - overlap < accuracy) {
        this.z = targetBlock.z;
        return { state: 'perfect' };
      }

      this.scale.z = overlap;
      this.z = (targetBlock.z + this.z) * 0.5;

      scale.z -= overlap;
      position.z = this.z + (scale.z + this.depth) * (this.z < targetBlock.z ? -0.5 : 0.5);
    }

    return { state: 'chopped', position, scale };
  }
}