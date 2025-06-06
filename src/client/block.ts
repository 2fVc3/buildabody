import { BoxGeometry, Euler, Mesh, MeshLambertMaterial, Vector3 } from 'three';
import { BlockEffect } from '../shared/types/postConfig';

type CutState = 'missed' | 'perfect' | 'chopped';

export class Block {
  public direction: Vector3 = new Vector3(0, 0, 0);
  public effect: BlockEffect = { type: 'none', duration: 0, magnitude: 0 };

  private mesh: Mesh;
  private material: MeshLambertMaterial;
  private originalScale: Vector3;
  private originalColor: number = 0xDEB887;

  constructor(scale: Vector3 | undefined = undefined) {
    // Create a wooden material like in the image
    this.material = new MeshLambertMaterial({
      color: 0xDEB887, // Burlywood color like wooden Jenga blocks
    });

    // Create Jenga block geometry - rectangular like wooden blocks
    const geometry = new BoxGeometry(1, 1, 1);
    this.mesh = new Mesh(geometry, this.material);

    if (scale !== undefined) {
      this.mesh.scale.copy(scale);
      this.originalScale = scale.clone();
    }

    // Start with no rotation - we'll handle rotation in game logic
    this.mesh.rotation.set(0, 0, 0);
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
  public set color(value: number) { 
    this.originalColor = value;
    this.material.color.set(value); 
  }

  public getMesh(): Mesh {
    return this.mesh;
  }

  public applyEffect(effect: BlockEffect): void {
    this.effect = effect;
    
    switch (effect.type) {
      case 'grow':
        this.scale.multiplyScalar(1 + effect.magnitude);
        break;
      case 'shrink':
        this.scale.multiplyScalar(1 - effect.magnitude);
        break;
      case 'rainbow':
        // Cycle through rainbow colors
        const time = Date.now() * 0.001;
        const hue = (time + Math.random()) % 1;
        this.material.color.setHSL(hue, 0.8, 0.6);
        
        // Set up continuous rainbow cycling
        const rainbowInterval = setInterval(() => {
          if (this.effect.type !== 'rainbow') {
            clearInterval(rainbowInterval);
            this.material.color.set(this.originalColor);
            return;
          }
          const currentTime = Date.now() * 0.001;
          const currentHue = (currentTime * 0.5 + Math.random() * 0.1) % 1;
          this.material.color.setHSL(currentHue, 0.8, 0.6);
        }, 100);
        
        // Stop rainbow after duration
        setTimeout(() => {
          clearInterval(rainbowInterval);
          this.effect = { type: 'none', duration: 0, magnitude: 0 };
          this.material.color.set(this.originalColor);
        }, effect.duration);
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

    // Move in the direction set by the game logic
    this.position.add(this.direction.clone().multiplyScalar(speed));
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

    // Determine which axis we're moving on based on rotation
    const isRotated = Math.abs(this.rotation.y) > Math.PI / 4;

    if (!isRotated) {
      // Moving along X axis
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
      // Moving along Z axis
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