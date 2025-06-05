import { BoxGeometry, Euler, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { BlockEffect } from '../shared/types/postConfig';

export class Block {
  public direction: Vector3 = new Vector3(0, 0, 0);
  public effect: BlockEffect = { type: 'none', duration: 0, magnitude: 0 };

  private mesh: Mesh;
  private material: MeshStandardMaterial;
  private originalScale: Vector3;

  constructor(scale: Vector3 | undefined = undefined) {
    this.material = new MeshStandardMaterial({
      color: 0xFFD700,
      roughness: 0.7,
      metalness: 0.3,
    });
    
    // Create a french fry shaped geometry
    const geometry = new BoxGeometry(1, 1, 1);
    this.mesh = new Mesh(geometry, this.material);
    
    if (scale !== undefined) {
      this.mesh.scale.copy(scale);
      this.originalScale = scale.clone();
    }
  }

  public getMesh(): Mesh {
    return this.mesh;
  }

  public get position(): Vector3 { return this.mesh.position; }
  public get rotation(): Euler { return this.mesh.rotation; }
  public get scale(): Vector3 { return this.mesh.scale; }
  public get quaternion() { return this.mesh.quaternion; }

  public get x(): number { return this.mesh.position.x; }
  public get y(): number { return this.mesh.position.y; }
  public get z(): number { return this.mesh.position.z; }

  public set x(value: number) { this.mesh.position.x = value; }
  public set y(value: number) { this.mesh.position.y = value; }
  public set z(value: number) { this.mesh.position.z = value; }

  public get width(): number { return this.scale.x; }
  public get height(): number { return this.scale.y; }
  public get depth(): number { return this.scale.z; }

  public get color(): number { return this.material.color.getHex(); }
  public set color(value: number) { this.material.color.set(value); }

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
        // Make it look like it's being salted
        this.material.color.setHSL(0.1, 0.8, 0.7);
        break;
    }
  }
}