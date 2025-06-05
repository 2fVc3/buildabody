import { BoxGeometry, Euler, Mesh, MeshToonMaterial, Vector3, CylinderGeometry } from 'three';
import { NoodleEffect } from '../shared/types/postConfig';
import { Tween, Easing } from '@tweenjs/tween.js';

type CutState = 'missed' | 'perfect' | 'chopped';

export class Block {
  public direction: Vector3 = new Vector3(0, 0, 0);
  public effect: NoodleEffect = { type: 'normal', bounciness: 0.5, wiggleSpeed: 1 };

  private mesh: Mesh;
  private material: MeshToonMaterial;
  private originalPosition: Vector3;
  private wigglePhase: number = 0;
  private wiggleAmplitude: number = 0.2;
  private bounceTween?: Tween<Vector3>;

  constructor(scale: Vector3 | undefined = undefined) {
    this.material = new MeshToonMaterial({
      transparent: true,
      opacity: 0.9,
    });
    
    // Create a cylinder (noodle) instead of a box
    const geometry = new CylinderGeometry(0.5, 0.5, 1, 32);
    geometry.rotateZ(Math.PI / 2); // Lay the cylinder horizontally
    
    this.mesh = new Mesh(geometry, this.material);
    if (scale !== undefined) {
      this.mesh.scale.copy(scale);
    }
    
    this.originalPosition = this.mesh.position.clone();
    this.startWiggle();
  }

  private startWiggle() {
    const animate = () => {
      if (this.effect.type === 'wiggly') {
        this.wigglePhase += this.effect.wiggleSpeed * 0.05;
        const wiggleOffset = Math.sin(this.wigglePhase) * this.wiggleAmplitude;
        this.mesh.position.y = this.originalPosition.y + wiggleOffset;
        this.mesh.rotation.z = Math.sin(this.wigglePhase * 0.5) * 0.1;
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  public bounce() {
    if (this.bounceTween) {
      this.bounceTween.stop();
    }

    const startY = this.mesh.position.y;
    const bounceHeight = 0.5 * this.effect.bounciness;

    this.bounceTween = new Tween(this.mesh.position)
      .to({ y: startY + bounceHeight }, 300)
      .easing(Easing.Quadratic.Out)
      .yoyo(true)
      .repeat(1)
      .start();
  }

  public get position(): Vector3 { return this.mesh.position; }
  public get rotation(): Euler { return this.mesh.rotation; }
  public get scale(): Vector3 { return this.mesh.scale; }

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
  public set color(value: number) { 
    this.material.color.set(value);
    // Add some shininess to make it look more noodle-like
    this.material.shininess = 50;
  }

  public getMesh(): Mesh {
    return this.mesh;
  }

  public applyEffect(effect: NoodleEffect): void {
    this.effect = effect;
    this.wiggleAmplitude = effect.type === 'wiggly' ? 0.3 : 0.1;
    this.bounce();
  }

  public moveScalar(scalar: number): void {
    const wiggleOffset = Math.sin(this.wigglePhase) * 0.1;
    
    this.position.set(
      this.position.x + this.direction.x * scalar + (Math.sin(this.wigglePhase * 0.5) * 0.05),
      this.position.y + this.direction.y * scalar + wiggleOffset,
      this.position.z + this.direction.z * scalar
    );
  }

  public cut(targetBlock: Block, accuracy: number): { state: CutState; position?: Vector3; scale?: Vector3; } {
    const position = this.position.clone();
    const scale = this.scale.clone();

    if (Math.abs(this.direction.x) > Number.EPSILON) {
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